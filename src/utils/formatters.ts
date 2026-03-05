import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

function text(content: string): CallToolResult {
  return { content: [{ type: "text", text: content }] };
}

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------

interface ScanEvent {
  date?: string;
  time?: string;
  eventDescription?: string;
  scanLocation?: { city?: string; stateOrProvinceCode?: string; countryCode?: string };
}

interface TrackingResult {
  trackingNumberInfo?: { trackingNumber?: string };
  latestStatusDetail?: { description?: string; code?: string };
  dateAndTimes?: { type: string; dateTime: string }[];
  scanEvents?: ScanEvent[];
  lastUpdatedTime?: string;
  packageDetails?: { contentPieceCount?: number; weightAndDimensions?: { weight?: { value?: number; unit?: string }[] } };
}

export function formatTrackingResult(data: unknown): CallToolResult {
  const result = data as { output?: { completeTrackResults?: { trackResults?: TrackingResult[] }[] } };
  const trackResult = result?.output?.completeTrackResults?.[0]?.trackResults?.[0];

  if (!trackResult) return text("No tracking information found.");

  const trackingNum = trackResult.trackingNumberInfo?.trackingNumber ?? "Unknown";
  const status = trackResult.latestStatusDetail?.description ?? "Unknown";

  const edd = trackResult.dateAndTimes?.find((d) => d.type === "ESTIMATED_DELIVERY");
  const delivery = edd ? `Estimated Delivery: ${formatDateTime(edd.dateTime)}` : "";

  const lines = [
    `📦 Tracking: ${trackingNum}`,
    `Status: ${status}`,
    delivery,
  ].filter(Boolean);

  const events = trackResult.scanEvents ?? [];
  if (events.length > 0) {
    lines.push("\nScan History:");
    events.slice(0, 10).forEach((e) => {
      const loc = [e.scanLocation?.city, e.scanLocation?.stateOrProvinceCode]
        .filter(Boolean)
        .join(", ");
      const dt = [e.date, e.time].filter(Boolean).join(" ");
      lines.push(`  ${dt}  ${e.eventDescription ?? ""}${loc ? ` — ${loc}` : ""}`);
    });
  }

  return text(lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

interface RateDetail {
  serviceType?: string;
  serviceName?: string;
  commit?: { dateDetail?: { dayFormat?: string }; transitDays?: string };
  ratedShipmentDetails?: { totalNetCharge?: { amount?: number; currency?: string } }[];
}

export function formatRateQuotes(data: unknown): CallToolResult {
  const result = data as { output?: { rateReplyDetails?: RateDetail[] } };
  const rates = result?.output?.rateReplyDetails;

  if (!rates || rates.length === 0) return text("No rates available for this shipment.");

  const rows = rates
    .map((r) => {
      const name = r.serviceName ?? r.serviceType ?? "Unknown";
      const charge = r.ratedShipmentDetails?.[0]?.totalNetCharge;
      const price = charge
        ? `$${Number(charge.amount).toFixed(2)} ${charge.currency ?? "USD"}`
        : "N/A";
      const days = r.commit?.transitDays ?? "?";
      const deliveryDate = r.commit?.dateDetail?.dayFormat ?? "";
      return { name, price, days, deliveryDate };
    })
    .sort((a, b) => {
      const pa = parseFloat(a.price.replace(/[^0-9.]/g, "")) || Infinity;
      const pb = parseFloat(b.price.replace(/[^0-9.]/g, "")) || Infinity;
      return pa - pb;
    });

  const lines = ["💰 Rate Quotes (sorted by price):\n"];
  rows.forEach((r, i) => {
    const marker = i === 0 ? " ← cheapest" : "";
    lines.push(`${r.name}`);
    lines.push(`  Price: ${r.price}${marker}`);
    lines.push(`  Transit: ${r.days} day(s)${r.deliveryDate ? ` (arrives ${r.deliveryDate})` : ""}`);
    lines.push("");
  });

  return text(lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Address Validation
// ---------------------------------------------------------------------------

interface ResolvedAddress {
  attributes?: { resolutionCode?: string; residential?: boolean };
  resolvedAddresses?: {
    streetLinesToken?: string[];
    city?: string;
    stateOrProvinceCode?: string;
    postalCode?: string;
    countryCode?: string;
    classification?: string;
  }[];
}

export function formatAddressValidation(data: unknown): CallToolResult {
  const result = data as { output?: { resolvedAddresses?: ResolvedAddress[] } };
  const addresses = result?.output?.resolvedAddresses;

  if (!addresses || addresses.length === 0)
    return text("Address could not be validated. Please check the address and try again.");

  const addr = addresses[0];
  const resolved = addr.resolvedAddresses?.[0];

  if (!resolved) return text("No resolved address returned.");

  const street = resolved.streetLinesToken?.join(", ") ?? "";
  const city = [resolved.city, resolved.stateOrProvinceCode, resolved.postalCode]
    .filter(Boolean)
    .join(", ");
  const country = resolved.countryCode ?? "";
  const classification = resolved.classification ?? "UNKNOWN";
  const isResidential = classification === "RESIDENTIAL";

  const lines = [
    "✅ Address Validated",
    `  ${street}`,
    `  ${city} ${country}`.trim(),
    `  Type: ${classification} ${isResidential ? "(residential surcharge may apply)" : ""}`,
  ];

  return text(lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Shipment Creation
// ---------------------------------------------------------------------------

interface ShipmentOutput {
  transactionShipments?: {
    masterTrackingNumber?: string;
    serviceType?: string;
    shipDatestamp?: string;
    completedShipmentDetail?: {
      completedPackageDetails?: {
        trackingIds?: { trackingNumber?: string }[];
        label?: { encodedLabel?: string };
      }[];
    };
    pieceResponses?: {
      trackingNumber?: string;
      packageDocuments?: { encodedLabel?: string; url?: string }[];
    }[];
  }[];
}

export function formatShipmentResult(data: unknown): CallToolResult {
  const result = data as { output?: ShipmentOutput };
  const shipment = result?.output?.transactionShipments?.[0];

  if (!shipment) return text("Shipment creation failed — no response data.");

  const tracking =
    shipment.masterTrackingNumber ??
    shipment.completedShipmentDetail?.completedPackageDetails?.[0]?.trackingIds?.[0]?.trackingNumber ??
    "Unknown";

  const labelUrl = shipment.pieceResponses?.[0]?.packageDocuments?.[0]?.url;

  const lines = [
    "✅ Shipment Created",
    `  Tracking Number: ${tracking}`,
    `  Service: ${shipment.serviceType ?? "Unknown"}`,
    `  Ship Date: ${shipment.shipDatestamp ?? "Unknown"}`,
  ];

  if (labelUrl) {
    lines.push(`  Label URL: ${labelUrl}`);
  } else {
    lines.push("  Label: Encoded in response (base64 PDF/PNG)");
  }

  return text(lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Service Availability
// ---------------------------------------------------------------------------

interface ServiceOption {
  serviceType?: string;
  serviceName?: string;
  packagingTypes?: { packagingType?: string; packagingDescription?: string }[];
  commit?: { transitDays?: string };
  astraDescription?: string;
}

export function formatServiceAvailability(data: unknown): CallToolResult {
  const result = data as {
    output?: { serviceOptions?: ServiceOption[] };
  };
  const options = result?.output?.serviceOptions;

  if (!options || options.length === 0)
    return text("No services available for this origin/destination combination.");

  const lines = ["🚚 Available FedEx Services:\n"];
  options.forEach((svc) => {
    const name = svc.serviceName ?? svc.serviceType ?? "Unknown";
    const transit = svc.commit?.transitDays ? ` (${svc.commit.transitDays} day transit)` : "";
    lines.push(`• ${name}${transit}`);
    if (svc.packagingTypes && svc.packagingTypes.length > 0) {
      const pkgs = svc.packagingTypes.map((p) => p.packagingDescription ?? p.packagingType).join(", ");
      lines.push(`  Packaging: ${pkgs}`);
    }
  });

  return text(lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
