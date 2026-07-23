import {
  formatCareerDateRange,
  getCareerRole,
  getCareerRoleLabel,
} from "@/lib/career";

const giphyRole = getCareerRole("giphy-2024");
const secondShutterstockRole = getCareerRole("shutterstock-2022");
const firstShutterstockRole = getCareerRole("shutterstock-2015");
const vertaRole = getCareerRole("verta-2020");

export const selectedWorkIds = {
  theHouse: "the-house",
  giphy: "giphy",
  shutterstockCreate: "shutterstock-create",
  shutterstockEditor: "shutterstock-editor",
  verta: "verta",
  morpheus: "morpheus",
  openSource: "open-source",
} as const;

export type SelectedWorkId =
  (typeof selectedWorkIds)[keyof typeof selectedWorkIds];

export const selectedWork = [
  {
    id: selectedWorkIds.theHouse,
    eyebrow: "Independent platform · Public",
    title: "The House / Influence",
    summary:
      "The House is the platform. Influence is its first production game: persistent agents, multiplayer orchestration, scoped tools, replay, analysis, and operations.",
    focus: ["Production AI agents", "MCP + OAuth", "Event-backed runtime"],
  },
  {
    id: selectedWorkIds.giphy,
    eyebrow: `${getCareerRoleLabel(giphyRole)} · ${formatCareerDateRange(giphyRole)}`,
    title: "GIPHY",
    summary:
      "Technical direction and hands-on delivery across multi-partner advertising networks, privacy-conscious targeting, search, content delivery, partner, API, reliability, cost, and platform systems.",
    focus: ["Monetization systems", "Privacy + trust", "Reliability + cost"],
  },
  {
    id: selectedWorkIds.shutterstockCreate,
    eyebrow: `Two tenures · ${formatCareerDateRange(firstShutterstockRole)} and ${formatCareerDateRange(secondShutterstockRole)}`,
    title: "Shutterstock Editor → Shutterstock Create",
    summary:
      "Browser-based creative products, Shutterstock’s first AI image-editing tool, partner integrations, marketplace modernization, cloud migrations, Kubernetes, delivery, and production support.",
    focus: ["Creative + AI tooling", "Partner SDK", "Cloud + operations"],
  },
  {
    id: selectedWorkIds.verta,
    eyebrow: `Enterprise MLOps · ${formatCareerDateRange(vertaRole)}`,
    title: "Verta",
    summary:
      "Employee #6 with end-to-end ownership of everything that touched the browser: React, GraphQL, contractors, releases, enterprise integrations, support, and on-call.",
    focus: ["Browser ownership", "GraphQL", "Delivery + support"],
  },
  {
    id: selectedWorkIds.morpheus,
    eyebrow: "Cross-platform adventure game",
    title: "Morpheus",
    summary:
      "A data-driven graphical adventure game modernized for the browser, with desktop and mobile releases in its cross-platform history and a current playable web release.",
    focus: ["Game runtime", "Cross-platform delivery", "Playable web release"],
  },
  {
    id: selectedWorkIds.openSource,
    eyebrow: "CaptEmulation → 0xFlicker",
    title: "Selected open source",
    summary:
      "Developer libraries, autonomous game agents, serverless systems, protocol tooling, and smart contracts across two public GitHub chapters.",
    focus: ["Developer tools", "Autonomous systems", "Onchain infrastructure"],
  },
] as const;

export const capabilityAreas = [
  {
    title: "Production AI systems",
    description:
      "Agent identity, orchestration, tool boundaries, permissions, durable state, and the product systems around models.",
  },
  {
    title: "Platforms and distributed systems",
    description:
      "APIs, developer tooling, service boundaries, reliability, cost, and systems that teams can operate.",
  },
  {
    title: "Consumer + monetization systems",
    description:
      "Architecture that reaches the interface while respecting revenue, experimentation, partner, and customer consequences.",
  },
  {
    title: "Developer experience + operations",
    description:
      "Platforms, CI/CD, observability, standards, and paths that let teams ship and operate systems safely.",
  },
] as const;
