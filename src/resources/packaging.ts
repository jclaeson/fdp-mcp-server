import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const PACKAGING_CATALOG = {
  packagingTypes: [
    {
      packagingType: "FEDEX_ENVELOPE",
      name: "FedEx Envelope",
      description: "For documents and papers up to 8oz. Includes a plastic sleeve with a FedEx airbill.",
      maxWeightLb: 0.5,
      dimensions: "9.5\" x 12.5\"",
      notes: "Express services only. Free from FedEx. Not for merchandise.",
    },
    {
      packagingType: "FEDEX_PAK",
      name: "FedEx Pak",
      description: "Water-resistant, tear-resistant poly envelope for heavier documents and non-fragile items.",
      maxWeightLb: 2.2,
      dimensions: "12\" x 15.5\" (small) or 14.75\" x 19.75\" (large)",
      notes: "Express services only. Free from FedEx.",
    },
    {
      packagingType: "FEDEX_BOX",
      name: "FedEx Box",
      description: "Sturdy cardboard boxes for packages that need extra protection.",
      maxWeightLb: 20,
      dimensions: "Various sizes (S, M, L, XL)",
      notes: "Express services only. Free from FedEx.",
    },
    {
      packagingType: "FEDEX_TUBE",
      name: "FedEx Tube",
      description: "Triangular tube for rolled documents, blueprints, and artwork.",
      maxWeightLb: 20,
      dimensions: "38\" x 6\" x 6\"",
      notes: "Express services only. Free from FedEx. Not for fragile items.",
    },
    {
      packagingType: "FEDEX_10KG_BOX",
      name: "FedEx 10kg Box",
      description: "Fixed-price box for international express shipments up to 10kg.",
      maxWeightLb: 22,
      dimensions: "15.8\" x 12.9\" x 10.2\"",
      notes: "International express only. Flat-rate pricing.",
    },
    {
      packagingType: "FEDEX_25KG_BOX",
      name: "FedEx 25kg Box",
      description: "Fixed-price box for international express shipments up to 25kg.",
      maxWeightLb: 55,
      dimensions: "21.6\" x 16.6\" x 13.4\"",
      notes: "International express only. Flat-rate pricing.",
    },
    {
      packagingType: "YOUR_PACKAGING",
      name: "Your Packaging",
      description: "Use your own box, envelope, or container. Most flexible option.",
      maxWeightLb: 150,
      dimensions: "Up to 165\" in combined length + girth",
      notes: "Available for all services. Dimensional weight may apply for large, light packages.",
    },
  ],
  surchargeNotes: [
    "Residential surcharge applies to deliveries to home addresses (typically $4–$6).",
    "Dimensional weight pricing applies when the package is large but light (L×W×H÷139).",
    "Additional handling surcharge applies to packages over 96\" in length or over 50lbs.",
    "Oversize surcharge applies to packages over 130\" in combined length + girth.",
    "Saturday delivery available for most express services (additional fee).",
    "Declared value fees apply when declaring value over $100.",
  ],
};

export function registerPackagingResource(server: McpServer): void {
  server.registerResource(
    "packaging-types",
    "fedex://packaging/types",
    {
      title: "FedEx Packaging Types",
      description:
        "Available FedEx packaging types with specifications, weight limits, and surcharge notes. Use this to recommend the right packaging.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "fedex://packaging/types",
          mimeType: "application/json",
          text: JSON.stringify(PACKAGING_CATALOG, null, 2),
        },
      ],
    })
  );
}
