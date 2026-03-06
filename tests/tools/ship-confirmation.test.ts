import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerShipTool } from "../../src/tools/ship.js";

// Mock the fedex client so no real HTTP calls are made
vi.mock("../../src/utils/fedex-client.js", () => ({
  fedexClient: {
    post: vi.fn(),
  },
}));

const VALID_PARTY = {
  personName: "John Doe",
  phoneNumber: "9015551234",
  streetLines: ["123 Main St"],
  city: "Memphis",
  stateOrProvinceCode: "TN",
  postalCode: "38103",
  countryCode: "US",
};

describe("create_shipment — confirmation gate", () => {
  it("returns a confirmation summary when confirmed=false", async () => {
    const server = new McpServer({ name: "test", version: "0.0.1" });
    registerShipTool(server);

    // Access the registered tool handler directly (SDK stores tools as a plain object)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools = (server as any)._registeredTools as Record<string, { handler: (args: unknown) => Promise<unknown> }>;
    const tool = tools["create_shipment"];
    expect(tool).toBeDefined();

    const result = await tool.handler({
      shipper: VALID_PARTY,
      recipient: { ...VALID_PARTY, city: "New York", stateOrProvinceCode: "NY", postalCode: "10001" },
      serviceType: "FEDEX_GROUND",
      weight: { value: 5, units: "LB" },
      confirmed: false,
    }) as { content: { type: string; text: string }[] };

    const text = result.content[0].text;
    expect(text).toContain("CONFIRMATION REQUIRED");
    expect(text).toContain("FEDEX_GROUND");
    expect(text).toContain("Memphis");
    expect(text).toContain("New York");
    expect(text).toContain("confirmed=true");
  });
});
