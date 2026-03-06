import { z } from "zod";
import { fedexClient } from "../utils/fedex-client.js";
import { formatTrackingResult } from "../utils/formatters.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerTrackTool(server: McpServer): void {
  server.registerTool(
    "track_package",
    {
      title: "Track Package",
      description:
        "Track a FedEx package by tracking number. Returns current status, location, estimated delivery date, and scan history.",
      inputSchema: {
        trackingNumber: z
          .string()
          .describe("FedEx tracking number (e.g. 794644790138)"),
        includeHistory: z
          .boolean()
          .optional()
          .describe("Include full scan event history (default: true)"),
      },
    },
    async ({ trackingNumber, includeHistory = true }) => {
      try {
        const response = await fedexClient.post("/track/v1/trackingnumbers", {
          trackingInfo: [
            {
              trackingNumberInfo: { trackingNumber },
            },
          ],
          includeDetailedScans: includeHistory,
        });
        return formatTrackingResult(response.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: `Failed to track package ${trackingNumber}: ${msg}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
