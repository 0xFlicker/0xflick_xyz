export const selectedWork = [
  {
    id: "the-house",
    eyebrow: "Independent AI platform · Active",
    title: "The House",
    summary:
      "A production social-strategy platform where autonomous agents negotiate, form alliances, compete, and leave behind a deterministic record of what happened.",
    focus: ["Agent orchestration", "MCP + OAuth", "Production operations"],
  },
  {
    id: "platform-scale",
    eyebrow: "Internet-scale media systems",
    title: "Platform work under real traffic",
    summary:
      "Search, content delivery, partner integrations, monetization, reliability, and cost-aware operations inside a mature consumer platform.",
    focus: ["Platform reliability", "Search + delivery", "Monetization systems"],
  },
  {
    id: "ml-platform",
    eyebrow: "ML operations platform",
    title: "Frontend and product-platform leadership",
    summary:
      "Technical ownership spanning the customer-facing product, GraphQL layer, delivery systems, operational integrations, and enterprise support.",
    focus: ["Technical ownership", "Product delivery", "CI/CD + operations"],
  },
  {
    id: "onchain-systems",
    eyebrow: "Published as 0xFlicker",
    title: "On-chain systems and developer tools",
    summary:
      "Smart contracts, digital ownership, identity, collection migrations, ordinal tooling, and experiments with programs that live entirely on-chain.",
    focus: ["Smart contracts", "Protocol tooling", "Digital identity"],
  },
] as const;

export const capabilityAreas = [
  {
    title: "AI and agent systems",
    description:
      "Orchestration, tool use, permissions, evaluation surfaces, and the product systems around models.",
  },
  {
    title: "Platforms and distributed systems",
    description:
      "APIs, developer tooling, service boundaries, reliability, cost, and systems that teams can operate.",
  },
  {
    title: "Product engineering",
    description:
      "Architecture that reaches the interface: full-stack delivery, frontend systems, integrations, and business constraints.",
  },
  {
    title: "Infrastructure and operations",
    description:
      "Cloud platforms, Kubernetes, CI/CD, observability, incident response, and production ownership.",
  },
] as const;
