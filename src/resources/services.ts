import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const SERVICE_CATALOG = {
  services: [
    {
      serviceType: "FEDEX_FIRST_OVERNIGHT",
      name: "FedEx First Overnight®",
      description: "Earliest morning delivery by 8, 8:30, 9, or 10 AM to most US addresses.",
      maxWeightLb: 150,
      typicalTransitDays: 1,
      notes: "Delivers Monday–Saturday. Best for urgent documents and packages.",
    },
    {
      serviceType: "PRIORITY_OVERNIGHT",
      name: "FedEx Priority Overnight®",
      description: "Next-business-morning delivery by 10:30 AM to most US addresses.",
      maxWeightLb: 150,
      typicalTransitDays: 1,
      notes: "Delivers Monday–Saturday. Fastest standard overnight.",
    },
    {
      serviceType: "STANDARD_OVERNIGHT",
      name: "FedEx Standard Overnight®",
      description: "Next-business-afternoon delivery by 3 PM to most US addresses.",
      maxWeightLb: 150,
      typicalTransitDays: 1,
      notes: "Cost-effective overnight option when morning delivery isn't required.",
    },
    {
      serviceType: "FEDEX_2_DAY_AM",
      name: "FedEx 2Day® AM",
      description: "Second-business-day delivery by 10:30 AM to most US addresses.",
      maxWeightLb: 150,
      typicalTransitDays: 2,
      notes: "AM delivery commitment for time-sensitive shipments.",
    },
    {
      serviceType: "FEDEX_2_DAY",
      name: "FedEx 2Day®",
      description: "Second-business-day delivery by 4:30 PM to most US addresses.",
      maxWeightLb: 150,
      typicalTransitDays: 2,
      notes: "Reliable 2-day option. Good balance of speed and cost.",
    },
    {
      serviceType: "FEDEX_EXPRESS_SAVER",
      name: "FedEx Express Saver®",
      description: "Third-business-day delivery by 4:30 PM to most US addresses.",
      maxWeightLb: 150,
      typicalTransitDays: 3,
      notes: "Economy express. Faster than ground for longer distances.",
    },
    {
      serviceType: "FEDEX_GROUND",
      name: "FedEx Ground®",
      description: "Day-definite delivery in 1–5 business days within the contiguous US.",
      maxWeightLb: 150,
      typicalTransitDays: "1–5",
      notes: "Cost-effective for non-urgent shipments. Best value for heavier packages.",
    },
    {
      serviceType: "FEDEX_HOME_DELIVERY",
      name: "FedEx Home Delivery®",
      description: "Residential ground delivery in 1–5 business days. Delivers Tuesday–Saturday.",
      maxWeightLb: 150,
      typicalTransitDays: "1–5",
      notes: "Optimized for residential addresses. Includes evening and appointment options.",
    },
    {
      serviceType: "GROUND_HOME_DELIVERY",
      name: "FedEx Ground® Economy",
      description: "Delivery in 2–7 business days. Cost-effective for non-urgent residential shipments.",
      maxWeightLb: 70,
      typicalTransitDays: "2–7",
      notes: "Formerly FedEx SmartPost. Best for high-volume, low-weight residential deliveries.",
    },
    {
      serviceType: "INTERNATIONAL_PRIORITY",
      name: "FedEx International Priority®",
      description: "Time-definite international delivery in 1–3 business days.",
      maxWeightLb: 150,
      typicalTransitDays: "1–3",
      notes: "Best for urgent international shipments. Includes customs clearance.",
    },
    {
      serviceType: "INTERNATIONAL_ECONOMY",
      name: "FedEx International Economy®",
      description: "Cost-effective international delivery in 2–5 business days.",
      maxWeightLb: 150,
      typicalTransitDays: "2–5",
      notes: "More affordable international option when speed is not critical.",
    },
  ],
};

export function registerServiceCatalogResource(server: McpServer): void {
  server.registerResource(
    "service-catalog",
    "fedex://services/catalog",
    {
      title: "FedEx Service Catalog",
      description:
        "Complete catalog of FedEx shipping services with descriptions, max weights, and typical transit times. Use this to help choose the right service type.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "fedex://services/catalog",
          mimeType: "application/json",
          text: JSON.stringify(SERVICE_CATALOG, null, 2),
        },
      ],
    })
  );
}
