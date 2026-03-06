import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Tools
import { registerTrackTool } from "./tools/track.js";
import { registerRateTool } from "./tools/rate.js";
import { registerAddressTool } from "./tools/address.js";
import { registerShipTool } from "./tools/ship.js";
import { registerServiceTool } from "./tools/service.js";

// Resources
import { registerServiceCatalogResource } from "./resources/services.js";
import { registerPackagingResource } from "./resources/packaging.js";

// Prompts
import { registerShippingPrompts } from "./prompts/shipping-wizard.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fedex-mcp-server",
    version: "1.0.0",
  });

  // --- Tools (Phase 1) ---
  registerTrackTool(server);
  registerRateTool(server);
  registerAddressTool(server);
  registerShipTool(server);
  registerServiceTool(server);

  // --- Resources ---
  registerServiceCatalogResource(server);
  registerPackagingResource(server);

  // --- Prompts ---
  registerShippingPrompts(server);

  return server;
}
