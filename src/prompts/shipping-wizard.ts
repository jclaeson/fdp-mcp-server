import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerShippingPrompts(server: McpServer): void {
  // ------------------------------------------------------------------
  // 1. Optimize Shipping Cost
  // ------------------------------------------------------------------
  server.registerPrompt(
    "optimize_shipping_cost",
    {
      title: "Optimize Shipping Cost",
      description:
        "Find the cheapest FedEx service that meets a delivery deadline. Validates address, checks available services, compares rates, and recommends the best option.",
      argsSchema: {
        originPostalCode: z.string().describe("Origin ZIP code"),
        destinationPostalCode: z.string().describe("Destination ZIP code"),
        weightLb: z.string().describe("Package weight in pounds"),
        deliveryDeadline: z
          .string()
          .describe(
            "Required delivery date or description (e.g. 'Friday', '2026-03-10', 'by end of week')"
          ),
      },
    },
    ({ originPostalCode, destinationPostalCode, weightLb, deliveryDeadline }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `I need to ship a ${weightLb}lb package from ZIP ${originPostalCode} to ZIP ${destinationPostalCode}.`,
              `It must arrive by: ${deliveryDeadline}.`,
              "",
              "Please help me find the cheapest FedEx service that meets my deadline:",
              "1. First, check which FedEx services are available between these ZIPs",
              "2. Get rate quotes for all available services",
              "3. Identify which services can meet my delivery deadline",
              "4. Recommend the cheapest option that meets my deadline",
              "5. Also show the fastest option in case I need it",
            ].join("\n"),
          },
        },
      ],
    })
  );

  // ------------------------------------------------------------------
  // 2. International Shipment Wizard
  // ------------------------------------------------------------------
  server.registerPrompt(
    "international_shipment_wizard",
    {
      title: "International Shipment Wizard",
      description:
        "Step-by-step guidance for international FedEx shipments. Covers service selection, customs requirements, rates, and documentation.",
      argsSchema: {
        originCountry: z.string().describe("Origin country (name or 2-letter code)"),
        destinationCountry: z.string().describe("Destination country (name or 2-letter code)"),
        commodityDescription: z
          .string()
          .describe("What are you shipping? (e.g. 'electronics', 'clothing', 'documents')"),
        weightLb: z.string().optional().describe("Approximate weight in pounds"),
      },
    },
    ({ originCountry, destinationCountry, commodityDescription, weightLb }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `I need to ship ${commodityDescription} internationally.`,
              `From: ${originCountry}`,
              `To: ${destinationCountry}`,
              weightLb ? `Weight: approximately ${weightLb} lbs` : "",
              "",
              "Please walk me through the international shipping process step by step:",
              "1. Check which FedEx international services are available for this route",
              "2. Explain customs and trade document requirements for this commodity and destination",
              "3. Get rate quotes for available international services",
              "4. Recommend the best service based on speed, cost, and reliability",
              "5. List any restrictions or special requirements I should know about",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    })
  );

  // ------------------------------------------------------------------
  // 3. Shipment Exception Handler
  // ------------------------------------------------------------------
  server.registerPrompt(
    "shipment_exception_handler",
    {
      title: "Shipment Exception Handler",
      description:
        "Diagnose tracking exceptions and delays. Tracks the package, analyzes the issue, and suggests corrective actions.",
      argsSchema: {
        trackingNumber: z.string().describe("FedEx tracking number"),
      },
    },
    ({ trackingNumber }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `I have a problem with FedEx tracking number: ${trackingNumber}`,
              "",
              "Please help me diagnose and resolve the issue:",
              "1. Track the package and get the full scan history",
              "2. Identify any exceptions, delays, or problems in the tracking history",
              "3. Explain what the current status means in plain language",
              "4. Assess whether the package will arrive on time",
              "5. Suggest specific next steps to resolve any issues",
              "   (e.g. contact FedEx, file a trace, request redirect, update delivery address)",
            ].join("\n"),
          },
        },
      ],
    })
  );

  // ------------------------------------------------------------------
  // 4. Bulk Shipping Assistant
  // ------------------------------------------------------------------
  server.registerPrompt(
    "bulk_shipping_assistant",
    {
      title: "Bulk Shipping Assistant",
      description:
        "Help plan and optimize a batch of shipments. Validates addresses, gets rates, and recommends cost-saving strategies.",
      argsSchema: {
        numberOfShipments: z.string().describe("How many packages need to be shipped"),
        originPostalCode: z.string().describe("Shipping origin ZIP code"),
        serviceRequirement: z
          .string()
          .describe(
            "Delivery speed requirement (e.g. 'overnight', '2-day', 'ground', 'cheapest possible')"
          ),
      },
    },
    ({ numberOfShipments, originPostalCode, serviceRequirement }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `I need to ship ${numberOfShipments} packages from ZIP ${originPostalCode}.`,
              `Service requirement: ${serviceRequirement}`,
              "",
              "Please help me plan this bulk shipping operation:",
              "1. What FedEx services are available from my origin that meet the service requirement?",
              "2. What information do I need for each shipment (address, weight, dimensions)?",
              "3. Are there any FedEx bulk shipping programs or discounts I should know about?",
              "4. What's the most efficient way to process these shipments?",
              "5. What are common pitfalls to avoid with bulk shipments?",
            ].join("\n"),
          },
        },
      ],
    })
  );
}
