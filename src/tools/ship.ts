import { z } from "zod";
import { fedexClient } from "../utils/fedex-client.js";
import { formatShipmentResult } from "../utils/formatters.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const partySchema = z.object({
  personName: z.string().describe("Contact name"),
  phoneNumber: z.string().describe("Phone number"),
  streetLines: z.array(z.string()).min(1).describe("Street address lines"),
  city: z.string().describe("City"),
  stateOrProvinceCode: z.string().describe("Two-letter state code"),
  postalCode: z.string().describe("ZIP code"),
  countryCode: z.string().default("US").describe("Country code (default: US)"),
  companyName: z.string().optional().describe("Company name (optional)"),
});

export function registerShipTool(server: McpServer): void {
  server.registerTool(
    "create_shipment",
    {
      title: "Create Shipment",
      description:
        "Create a FedEx shipment and generate a shipping label. " +
        "IMPORTANT: This tool requires human confirmation before executing — it will first present a shipment summary and wait for approval. " +
        "Set confirmed=true only after the user has explicitly approved the shipment details.",
      inputSchema: {
        shipper: partySchema.describe("Sender information and address"),
        recipient: partySchema.describe("Recipient information and address"),
        serviceType: z
          .string()
          .describe(
            "FedEx service type (e.g. FEDEX_GROUND, FEDEX_2_DAY, STANDARD_OVERNIGHT, PRIORITY_OVERNIGHT)"
          ),
        weight: z
          .object({
            value: z.number().describe("Weight value"),
            units: z.enum(["LB", "KG"]).default("LB"),
          })
          .describe("Package weight"),
        dimensions: z
          .object({
            length: z.number(),
            width: z.number(),
            height: z.number(),
            units: z.enum(["IN", "CM"]).default("IN"),
          })
          .optional()
          .describe("Package dimensions in inches (optional)"),
        shipDate: z
          .string()
          .optional()
          .describe("Ship date in YYYY-MM-DD format (defaults to today)"),
        labelFormat: z
          .enum(["PDF", "PNG", "URL_ONLY"])
          .default("URL_ONLY")
          .describe("Label output format (default: URL_ONLY)"),
        confirmed: z
          .boolean()
          .default(false)
          .describe(
            "Set to true only after the user has explicitly confirmed the shipment details. " +
            "If false (default), returns a summary for confirmation without creating the shipment."
          ),
      },
    },
    async ({
      shipper,
      recipient,
      serviceType,
      weight,
      dimensions,
      shipDate,
      labelFormat,
      confirmed,
    }) => {
      // --- Confirmation gate ---
      if (!confirmed) {
        const fromAddr = [
          shipper.streetLines.join(", "),
          `${shipper.city}, ${shipper.stateOrProvinceCode} ${shipper.postalCode}`,
          shipper.countryCode,
        ].join("\n      ");

        const toAddr = [
          recipient.streetLines.join(", "),
          `${recipient.city}, ${recipient.stateOrProvinceCode} ${recipient.postalCode}`,
          recipient.countryCode,
        ].join("\n      ");

        const dimStr = dimensions
          ? `${dimensions.length}x${dimensions.width}x${dimensions.height} ${dimensions.units}`
          : "Not specified";

        const summary = [
          "⚠️  SHIPMENT CONFIRMATION REQUIRED",
          "",
          "Please review the shipment details below and confirm before proceeding.",
          "This will create a real FedEx shipment.",
          "",
          `  Service:    ${serviceType}`,
          `  Ship Date:  ${shipDate ?? "Today"}`,
          "",
          `  FROM: ${shipper.personName}${shipper.companyName ? ` (${shipper.companyName})` : ""}`,
          `      ${fromAddr}`,
          `      Phone: ${shipper.phoneNumber}`,
          "",
          `  TO:   ${recipient.personName}${recipient.companyName ? ` (${recipient.companyName})` : ""}`,
          `      ${toAddr}`,
          `      Phone: ${recipient.phoneNumber}`,
          "",
          `  Weight:     ${weight.value} ${weight.units}`,
          `  Dimensions: ${dimStr}`,
          "",
          'To proceed, call this tool again with confirmed=true.',
        ].join("\n");

        return { content: [{ type: "text", text: summary }] };
      }

      // --- Execute shipment ---
      try {
        const accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;
        if (!accountNumber) {
          throw new Error("FEDEX_ACCOUNT_NUMBER environment variable is not set");
        }

        const requestedPackageLineItems: Record<string, unknown>[] = [
          {
            weight: { units: weight.units, value: weight.value },
            ...(dimensions && {
              dimensions: {
                length: dimensions.length,
                width: dimensions.width,
                height: dimensions.height,
                units: dimensions.units,
              },
            }),
          },
        ];

        const payload = {
          labelResponseOptions: labelFormat === "URL_ONLY" ? "URL_ONLY" : "LABEL",
          requestedShipment: {
            shipper: {
              contact: {
                personName: shipper.personName,
                phoneNumber: shipper.phoneNumber,
                ...(shipper.companyName && { companyName: shipper.companyName }),
              },
              address: {
                streetLines: shipper.streetLines,
                city: shipper.city,
                stateOrProvinceCode: shipper.stateOrProvinceCode,
                postalCode: shipper.postalCode,
                countryCode: shipper.countryCode,
              },
            },
            recipients: [
              {
                contact: {
                  personName: recipient.personName,
                  phoneNumber: recipient.phoneNumber,
                  ...(recipient.companyName && { companyName: recipient.companyName }),
                },
                address: {
                  streetLines: recipient.streetLines,
                  city: recipient.city,
                  stateOrProvinceCode: recipient.stateOrProvinceCode,
                  postalCode: recipient.postalCode,
                  countryCode: recipient.countryCode,
                  residential: false,
                },
              },
            ],
            serviceType,
            packagingType: "YOUR_PACKAGING",
            pickupType: "USE_SCHEDULED_PICKUP",
            ...(shipDate && { shipDatestamp: shipDate }),
            shippingChargesPayment: {
              paymentType: "SENDER",
              payor: {
                responsibleParty: {
                  accountNumber: { value: accountNumber },
                },
              },
            },
            labelSpecification: {
              labelFormatType: "COMMON2D",
              imageType: labelFormat === "PDF" ? "PDF" : "PNG",
              labelStockType: "PAPER_4X6",
            },
            requestedPackageLineItems,
          },
          accountNumber: { value: accountNumber },
        };

        const response = await fedexClient.post("/ship/v1/shipments", payload);
        return formatShipmentResult(response.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            { type: "text", text: `Failed to create shipment: ${msg}` },
          ],
          isError: true,
        };
      }
    }
  );
}
