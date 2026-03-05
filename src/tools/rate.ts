import { z } from "zod";
import { fedexClient } from "../utils/fedex-client.js";
import { formatRateQuotes } from "../utils/formatters.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const addressSchema = z.object({
  streetLines: z
    .array(z.string())
    .optional()
    .describe("Street address lines"),
  city: z.string().optional().describe("City name"),
  stateOrProvinceCode: z
    .string()
    .optional()
    .describe("Two-letter state/province code (e.g. TN, NY)"),
  postalCode: z.string().describe("ZIP or postal code"),
  countryCode: z
    .string()
    .default("US")
    .describe("Two-letter country code (default: US)"),
});

export function registerRateTool(server: McpServer): void {
  server.registerTool(
    "get_rates",
    {
      title: "Get Shipping Rates",
      description:
        "Get FedEx rate quotes for a shipment. Returns all available services sorted by price, with transit times and delivery dates.",
      inputSchema: {
        shipFrom: addressSchema.describe("Origin address"),
        shipTo: addressSchema.describe("Destination address"),
        weight: z
          .object({
            value: z.number().describe("Weight value"),
            units: z.enum(["LB", "KG"]).default("LB").describe("Weight units"),
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
          .describe("Package dimensions (optional but improves accuracy)"),
        shipDate: z
          .string()
          .optional()
          .describe("Requested ship date in YYYY-MM-DD format (defaults to today)"),
        serviceType: z
          .string()
          .optional()
          .describe("Filter to a specific service type (e.g. FEDEX_GROUND, FEDEX_2_DAY)"),
      },
    },
    async ({ shipFrom, shipTo, weight, dimensions, shipDate, serviceType }) => {
      try {
        const accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;

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

        const requestedShipment: Record<string, unknown> = {
          shipper: { address: shipFrom },
          recipient: { address: shipTo },
          pickupType: "USE_SCHEDULED_PICKUP",
          rateRequestType: ["LIST", "ACCOUNT"],
          requestedPackageLineItems,
          ...(shipDate && { shipDateStamp: shipDate }),
          ...(serviceType && { serviceType }),
        };

        const payload: Record<string, unknown> = {
          requestedShipment,
          ...(accountNumber && { accountNumber: { value: accountNumber } }),
        };

        const response = await fedexClient.post(
          "/rate/v1/rates/quotes",
          payload
        );
        return formatRateQuotes(response.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Failed to get rates: ${msg}` }],
          isError: true,
        };
      }
    }
  );
}
