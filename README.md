# FedEx MCP Server

A Model Context Protocol (MCP) server that exposes FedEx Developer Portal APIs as tools for AI agents. Enables natural language shipping interactions — "Track my package", "What's the cheapest way to ship this by Friday?" — using any MCP-compatible client (Claude Desktop, Claude Code, etc.).

## What's Included

### Tools
| Tool | Description | Confirmation Required |
|------|-------------|----------------------|
| `track_package` | Track a FedEx package by tracking number | No |
| `get_rates` | Get rate quotes across all FedEx services | No |
| `validate_address` | Validate a shipping address | No |
| `check_services` | Check available services for a route | No |
| `create_shipment` | Create a shipment and generate a label | **Yes** |

### Resources (Reference Data)
- `fedex://services/catalog` — All FedEx service types with descriptions and specs
- `fedex://packaging/types` — Packaging options and surcharge notes

### Prompts (Pre-Built Workflows)
- `optimize_shipping_cost` — Find cheapest service meeting a deadline
- `international_shipment_wizard` — Step-by-step international shipping guide
- `shipment_exception_handler` — Diagnose and resolve tracking exceptions
- `bulk_shipping_assistant` — Plan batch shipments

---

## Prerequisites

- Node.js 18+
- FedEx Developer Portal account: [developer.fedex.com](https://developer.fedex.com)
- A project created in FDP with access to: Track, Rate, Address Validation, Ship, Service Availability APIs
- Client ID, Client Secret, and Account Number from your FDP project

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd fedex-mcp-server
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

Edit `.env`:
```
FEDEX_CLIENT_ID=your_client_id
FEDEX_CLIENT_SECRET=your_client_secret
FEDEX_ACCOUNT_NUMBER=your_account_number
FEDEX_ENV=sandbox   # Change to "production" when ready
```

### 3. Verify it compiles

```bash
npm run typecheck
```

### 4. Run tests

```bash
npm test
```

---

## Using with Claude Desktop

Add the server to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fedex": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/fedex-mcp-server/src/index.ts"],
      "env": {
        "FEDEX_CLIENT_ID": "your_client_id",
        "FEDEX_CLIENT_SECRET": "your_client_secret",
        "FEDEX_ACCOUNT_NUMBER": "your_account_number",
        "FEDEX_ENV": "sandbox"
      }
    }
  }
}
```

Restart Claude Desktop. You should see the FedEx tools available.

---

## Using with Claude Code

Run the server inline from any Claude Code session:

```bash
FEDEX_CLIENT_ID=... FEDEX_CLIENT_SECRET=... FEDEX_ACCOUNT_NUMBER=... npx tsx src/index.ts
```

Or add it to your Claude Code MCP config:

```bash
claude mcp add fedex --command "npx tsx /path/to/fedex-mcp-server/src/index.ts" \
  --env FEDEX_CLIENT_ID=... \
  --env FEDEX_CLIENT_SECRET=... \
  --env FEDEX_ACCOUNT_NUMBER=... \
  --env FEDEX_ENV=sandbox
```

---

## Example Interactions

```
You: Track FedEx package 794644790138
Claude: [calls track_package] 📦 Tracking: 794644790138
        Status: In Transit
        Estimated Delivery: Thu, Mar 12 by 8:00 PM
        ...

You: What's the cheapest way to ship a 5lb box from Memphis TN 38103
     to Brooklyn NY 11201 that arrives by Friday?
Claude: [calls check_services, get_rates]
        💰 Rate Quotes (sorted by price):
        FedEx Ground — $12.75 (arrives Friday) ← cheapest
        FedEx 2Day — $28.50 (arrives Thursday)
        ...

You: Ship it using FedEx Ground
Claude: [calls create_shipment with confirmed=false]
        ⚠️ SHIPMENT CONFIRMATION REQUIRED
        Service: FEDEX_GROUND | Ship Date: Today
        FROM: ... TO: ... Weight: 5 LB
        To proceed, confirm and I'll create the shipment.

You: Yes, confirmed
Claude: [calls create_shipment with confirmed=true]
        ✅ Shipment Created
        Tracking Number: 794644790999
        Label URL: https://...
```

---

## Safety: Human-in-the-Loop

The `create_shipment` tool has a built-in confirmation gate:

- **Default** (`confirmed=false`): Returns a shipment summary. No API call is made.
- **Confirmed** (`confirmed=true`): Creates the real shipment after the user approves.

All read-only tools (track, rate, address, services) require no confirmation and can be called freely by AI agents.

---

## Development

```bash
# Type-check in watch mode
npm run typecheck -- --watch

# Run dev server with live reload (for testing stdio manually)
npm run dev

# Run tests
npm test
npm run test:watch

# Build for production
npm run build
node dist/index.js
```

---

## Project Structure

```
src/
├── index.ts              # Entry point — connects stdio transport
├── server.ts             # McpServer creation and tool/resource/prompt registration
├── auth/
│   └── fedex-oauth.ts    # OAuth 2.0 token manager (cached, auto-refresh)
├── tools/
│   ├── track.ts          # track_package
│   ├── rate.ts           # get_rates
│   ├── address.ts        # validate_address
│   ├── ship.ts           # create_shipment (with confirmation gate)
│   └── service.ts        # check_services
├── resources/
│   ├── services.ts       # FedEx service catalog
│   └── packaging.ts      # Packaging types and surcharge notes
├── prompts/
│   └── shipping-wizard.ts # Pre-built shipping workflow prompts
└── utils/
    ├── fedex-client.ts   # Axios HTTP client with auth injection and retry
    └── formatters.ts     # Response formatters for AI-readable output
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FEDEX_CLIENT_ID` | Yes | FDP project Client ID |
| `FEDEX_CLIENT_SECRET` | Yes | FDP project Client Secret |
| `FEDEX_ACCOUNT_NUMBER` | Yes (for ship/rate) | FedEx account number |
| `FEDEX_ENV` | No (default: sandbox) | `sandbox` or `production` |
