import { z } from "zod";
import { fedexClient } from "../utils/fedex-client.js";
import { formatAddressValidation } from "../utils/formatters.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerAddressTool(server: McpServer): void {
  server.registerTool(
    "validate_address",
    {
      title: "Validate Address",
      description:
        "Validate a shipping address with FedEx. Checks if the address is valid, corrects minor errors, and identifies residential vs commercial addresses.",
      inputSchema: {
        streetLines: z
          .array(z.string())
          .min(1)
          .describe("Street address lines (e.g. ['123 Main St', 'Suite 400'])"),
        city: z.string().optional().describe("City name"),
        stateOrProvinceCode: z
          .string()
          .optional()
          .describe("Two-letter state/province code"),
        postalCode: z.string().optional().describe("ZIP or postal code"),
        countryCode: z
          .string()
          .default("US")
          .describe("Two-letter country code (default: US)"),
      },
    },
    async ({ streetLines, city, stateOrProvinceCode, postalCode, countryCode }) => {
      try {
        const response = await fedexClient.post(
          "/address/v1/addresses/resolve",
          {
            addressesToValidate: [
              {
                address: {
                  streetLines,
                  ...(city && { city }),
                  ...(stateOrProvinceCode && { stateOrProvinceCode }),
                  ...(postalCode && { postalCode }),
                  countryCode,
                },
              },
            ],
          }
        );
        return formatAddressValidation(response.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            { type: "text", text: `Failed to validate address: ${msg}` },
          ],
          isError: true,
        };
      }
    }
  );
}
