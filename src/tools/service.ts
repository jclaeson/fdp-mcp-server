import { z } from "zod";
import { fedexClient } from "../utils/fedex-client.js";
import { formatServiceAvailability } from "../utils/formatters.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerServiceTool(server: McpServer): void {
  server.registerTool(
    "check_services",
    {
      title: "Check Available Services",
      description:
        "Check which FedEx services are available between an origin and destination. Returns available service types, packaging options, and transit times.",
      inputSchema: {
        originPostalCode: z.string().describe("Origin ZIP/postal code"),
        originCountryCode: z
          .string()
          .default("US")
          .describe("Origin country code (default: US)"),
        destinationPostalCode: z.string().describe("Destination ZIP/postal code"),
        destinationCountryCode: z
          .string()
          .default("US")
          .describe("Destination country code (default: US)"),
        shipDate: z
          .string()
          .optional()
          .describe("Ship date in YYYY-MM-DD format (defaults to today)"),
        weight: z
          .object({
            value: z.number(),
            units: z.enum(["LB", "KG"]).default("LB"),
          })
          .optional()
          .describe("Package weight (optional, helps refine results)"),
      },
    },
    async ({
      originPostalCode,
      originCountryCode,
      destinationPostalCode,
      destinationCountryCode,
      shipDate,
      weight,
    }) => {
      try {
        const payload: Record<string, unknown> = {
          requestedShipment: {
            shipper: {
              address: { postalCode: originPostalCode, countryCode: originCountryCode },
            },
            recipients: [
              {
                address: {
                  postalCode: destinationPostalCode,
                  countryCode: destinationCountryCode,
                },
              },
            ],
            ...(shipDate && { shipDateStamp: shipDate }),
            packagingType: "YOUR_PACKAGING",
            ...(weight && {
              requestedPackageLineItems: [
                { weight: { units: weight.units, value: weight.value } },
              ],
            }),
          },
          carrierCodes: ["FDXE", "FDXG"],
        };

        const response = await fedexClient.post(
          "/availability/v1/packageandserviceoptions",
          payload
        );
        return formatServiceAvailability(response.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            { type: "text", text: `Failed to check service availability: ${msg}` },
          ],
          isError: true,
        };
      }
    }
  );
}
