import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

// Load environment variables from .env if present (dev convenience)
// In production (Claude Desktop), env vars are injected via the config
try {
  const { config } = await import("dotenv");
  config();
} catch {
  // dotenv is optional — ignore if not installed or .env missing
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with the stdio MCP protocol
  process.stderr.write("FedEx MCP Server running (stdio transport)\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
