import { describe, it, expect } from "vitest";
import {
  formatTrackingResult,
  formatRateQuotes,
  formatAddressValidation,
  formatShipmentResult,
  formatServiceAvailability,
} from "../../src/utils/formatters.js";

describe("formatTrackingResult", () => {
  it("returns message when no results", () => {
    const result = formatTrackingResult({});
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as { type: string; text: string }).text).toContain("No tracking");
  });

  it("formats a tracking result with status and EDD", () => {
    const data = {
      output: {
        completeTrackResults: [
          {
            trackResults: [
              {
                trackingNumberInfo: { trackingNumber: "123456789" },
                latestStatusDetail: { description: "In transit" },
                dateAndTimes: [
                  { type: "ESTIMATED_DELIVERY", dateTime: "2026-03-10T14:00:00-05:00" },
                ],
                scanEvents: [
                  {
                    date: "2026-03-08",
                    time: "10:30:00",
                    eventDescription: "Picked up",
                    scanLocation: { city: "Memphis", stateOrProvinceCode: "TN" },
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const result = formatTrackingResult(data);
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("123456789");
    expect(text).toContain("In transit");
    expect(text).toContain("Picked up");
    expect(text).toContain("Memphis");
  });
});

describe("formatRateQuotes", () => {
  it("returns message when no rates", () => {
    const result = formatRateQuotes({ output: { rateReplyDetails: [] } });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("No rates");
  });

  it("formats rates sorted by price", () => {
    const data = {
      output: {
        rateReplyDetails: [
          {
            serviceType: "FEDEX_2_DAY",
            serviceName: "FedEx 2Day",
            commit: { transitDays: "2", dateDetail: { dayFormat: "Thursday, Mar 12" } },
            ratedShipmentDetails: [{ totalNetCharge: { amount: 45.5, currency: "USD" } }],
          },
          {
            serviceType: "FEDEX_GROUND",
            serviceName: "FedEx Ground",
            commit: { transitDays: "4", dateDetail: { dayFormat: "Monday, Mar 16" } },
            ratedShipmentDetails: [{ totalNetCharge: { amount: 12.75, currency: "USD" } }],
          },
        ],
      },
    };
    const result = formatRateQuotes(data);
    const text = (result.content[0] as { type: string; text: string }).text;
    // Cheapest should appear first
    expect(text.indexOf("FedEx Ground")).toBeLessThan(text.indexOf("FedEx 2Day"));
    expect(text).toContain("← cheapest");
    expect(text).toContain("$12.75");
    expect(text).toContain("$45.50");
  });
});

describe("formatAddressValidation", () => {
  it("handles empty response", () => {
    const result = formatAddressValidation({});
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("could not be validated");
  });

  it("formats a valid address result", () => {
    const data = {
      output: {
        resolvedAddresses: [
          {
            resolvedAddresses: [
              {
                streetLinesToken: ["123 MAIN ST"],
                city: "MEMPHIS",
                stateOrProvinceCode: "TN",
                postalCode: "38103",
                countryCode: "US",
                classification: "BUSINESS",
              },
            ],
          },
        ],
      },
    };
    const result = formatAddressValidation(data);
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("123 MAIN ST");
    expect(text).toContain("MEMPHIS");
    expect(text).toContain("BUSINESS");
  });
});

describe("formatShipmentResult", () => {
  it("handles empty response", () => {
    const result = formatShipmentResult({});
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("failed");
  });

  it("formats a successful shipment", () => {
    const data = {
      output: {
        transactionShipments: [
          {
            masterTrackingNumber: "794644790138",
            serviceType: "FEDEX_GROUND",
            shipDatestamp: "2026-03-08",
            pieceResponses: [
              {
                packageDocuments: [{ url: "https://example.com/label.pdf" }],
              },
            ],
          },
        ],
      },
    };
    const result = formatShipmentResult(data);
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("794644790138");
    expect(text).toContain("FEDEX_GROUND");
    expect(text).toContain("https://example.com/label.pdf");
  });
});

describe("formatServiceAvailability", () => {
  it("handles empty services", () => {
    const result = formatServiceAvailability({ output: { serviceOptions: [] } });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("No services");
  });

  it("formats available services", () => {
    const data = {
      output: {
        serviceOptions: [
          {
            serviceType: "FEDEX_GROUND",
            serviceName: "FedEx Ground",
            commit: { transitDays: "3" },
            packagingTypes: [{ packagingType: "YOUR_PACKAGING", packagingDescription: "Your Packaging" }],
          },
        ],
      },
    };
    const result = formatServiceAvailability(data);
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("FedEx Ground");
    expect(text).toContain("3 day transit");
    expect(text).toContain("Your Packaging");
  });
});
