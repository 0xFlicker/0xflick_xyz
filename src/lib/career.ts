export type CareerRole = {
  id: CareerRoleId;
  company: string;
  productOrTeam?: string;
  displayTitle: string;
  officialTitle?: string;
  internalLevel?: string;
  start: string;
  end?: string;
  location?: string;
  summary: string;
  responsibilities?: readonly string[];
  outcomes?: readonly string[];
  technologies?: readonly string[];
  publicSafe: boolean;
  sourceNotes?: readonly string[];
  needsVerification?: readonly string[];
};

export type CareerRoleId =
  | "giphy-2024"
  | "shutterstock-2022"
  | "verta-2020"
  | "sandbox-vr-2019"
  | "shutterstock-2015"
  | "time-warner-cable-2013"
  | "accenture-2011"
  | "nokia-2005"
  | "metrowerks-2000";

export const careerRoles = [
  {
    id: "giphy-2024",
    company: "GIPHY",
    productOrTeam: "GIPHY, a Shutterstock company",
    displayTitle: "Principal Architect",
    start: "2024",
    location: "Colorado / Remote",
    summary:
      "Set technical direction across GIPHY’s monetization, advertising, search, delivery, partner, and platform systems, balancing product goals with reliability, infrastructure cost, and the constraints of a mature high-traffic product.",
    responsibilities: [
      "Architecture across advertising, monetization, search, content delivery, consumer, partner, API, and integration surfaces.",
      "Design review, migrations, reliability work, incident learning, and operational ownership.",
      "Hands-on validation of critical implementation paths.",
    ],
    publicSafe: true,
    sourceNotes: [
      "The Principal title begins with the move to GIPHY in 2024 and must not be backdated.",
    ],
    needsVerification: [
      "Exact month of the 2024 move.",
      "Confirm Principal Architect as the exact HR title.",
      "Public-safe, verified outcomes for GIPHY monetization work.",
    ],
  },
  {
    id: "shutterstock-2022",
    company: "Shutterstock",
    productOrTeam: "Shutterstock Create",
    displayTitle: "Software Engineer",
    start: "2022",
    end: "2024",
    location: "Colorado / Remote",
    summary:
      "Rejoined Shutterstock following the PicMonkey acquisition to help integrate and evolve the company’s browser-based creative platform. Helped deliver Shutterstock Create and transition away from the earlier Shutterstock Editor while working across product engineering, cloud infrastructure, Kubernetes, deployment, and production support.",
    responsibilities: [
      "Product engineering for browser-based creative tooling.",
      "Cloud infrastructure, Kubernetes, delivery, and production operations.",
    ],
    outcomes: [
      "Helped deliver Shutterstock Create.",
      "Helped transition away from and retire the earlier Shutterstock Editor platform.",
    ],
    publicSafe: true,
    needsVerification: [
      "Exact official title for the 2022 return.",
      "Exact month of the 2022 return.",
      "Public-safe, verified outcomes for Shutterstock Create.",
    ],
  },
  {
    id: "verta-2020",
    company: "Verta",
    productOrTeam: "Enterprise MLOps and model management",
    displayTitle: "Frontend Lead",
    officialTitle: "Webmaster",
    start: "2020",
    end: "2022",
    summary:
      "Took over customer-facing product and frontend ownership from the CTO for an enterprise MLOps platform. Led three frontend contractors and worked across React, GraphQL, release engineering, CI/CD, enterprise integrations, customer support, and production on-call.",
    responsibilities: [
      "Owned the React and GraphQL web stack and implemented product features and GraphQL resolvers.",
      "Led three overseas frontend contractors.",
      "Maintained tests, builds, releases, operations integrations, and customer delivery for the web stack.",
    ],
    publicSafe: true,
    sourceNotes: [
      "Frontend Lead is the approved functional title; Webmaster is preserved as the historical official title.",
    ],
    needsVerification: [
      "Whether public surfaces should show Frontend Lead, Webmaster, or both.",
      "Public-safe, verified product outcomes.",
    ],
  },
  {
    id: "sandbox-vr-2019",
    company: "Sandbox VR",
    productOrTeam: "Location-based multiplayer VR platform",
    displayTitle: "Web Tech Lead",
    officialTitle: "Senior Developer",
    start: "July 2019",
    end: "April 2020",
    summary:
      "Owned major parts of the web platform supporting Sandbox VR’s live multiplayer venues, including global leaderboards, scheduling, payments, experimentation, deployment, and operational support. The role ended when the location-based business shut down during the COVID-19 pandemic.",
    responsibilities: [
      "Web product delivery across scheduling, payments, leaderboards, experimentation, and social sharing.",
      "Builds, deployments, and 24/7 production on-call for online services.",
    ],
    technologies: [
      "TypeScript",
      "React",
      "GraphQL",
      "Google Cloud",
      "Kubernetes",
      "Cloudflare Workers",
      "Firebase",
      "Stripe",
    ],
    publicSafe: true,
    sourceNotes: [
      "Web Tech Lead is the approved functional title; Senior Developer is preserved as the historical official title.",
    ],
    needsVerification: [
      "Whether public surfaces should show Web Tech Lead, Senior Developer, or both.",
    ],
  },
  {
    id: "shutterstock-2015",
    company: "Shutterstock",
    productOrTeam: "Shutterstock Editor and core marketplace",
    displayTitle: "Software Developer",
    officialTitle: "Senior Developer",
    start: "November 2015",
    end: "July 2019",
    summary:
      "Helped build Shutterstock Editor, the company’s browser-based image-editing product. Led internationalization efforts, partner SDK development, and migration to AWS and Kubernetes, while also contributing to cart, checkout, and legacy Perl-to-Node modernization on the core marketplace.",
    responsibilities: [
      "Full-stack feature development across JavaScript, React, HTML Canvas, WebGL, and Node.js.",
      "Lead engineering work for internationalization, a partner SDK, and the AWS and Kubernetes migration.",
      "Rotating 24/7 production on-call.",
    ],
    publicSafe: true,
    sourceNotes: [
      "Software Developer is the approved generic public display title; Senior Developer is preserved as the historical résumé title.",
    ],
    needsVerification: [
      "Public-safe, verified outcomes for Editor and its partner SDK.",
    ],
  },
  {
    id: "time-warner-cable-2013",
    company: "Time Warner Cable",
    productOrTeam: "Consumer Technology Group · Multi-room HTML5 DVR",
    displayTitle: "Senior Developer / Feature Technical Lead",
    officialTitle: "Senior Developer",
    start: "November 2013",
    end: "November 2015",
    summary:
      "Built core features for Time Warner Cable’s multi-room HTML5 DVR platform, serving as a feature technical lead across an onshore/offshore team and contributing to release tooling and Tier 4 beta support.",
    responsibilities: [
      "Core product features in a performance-constrained embedded browser environment.",
      "Feature technical leadership, build and release scripting, and Tier 4 beta support.",
    ],
    publicSafe: true,
  },
  {
    id: "accenture-2011",
    company: "Accenture",
    productOrTeam: "Embedded television and mobile client systems",
    displayTitle: "Developer / Application Architect",
    start: "October 2011",
    end: "November 2013",
    summary:
      "Delivered embedded television and mobile systems for Accenture clients, spanning an HTML5 DVR interface and a native iOS operational-data application backed by a secure .NET service.",
    responsibilities: [
      "End-to-end HTML, CSS, and JavaScript features with automated unit and integration tests for an embedded DVR interface.",
      "Objective-C, Core Plot, and Core Data work for a native iOS application.",
      "Designed a .NET WCF service to transform and securely serve operational data.",
    ],
    publicSafe: true,
    needsVerification: ["Exact official title or title sequence at Accenture."],
  },
  {
    id: "nokia-2005",
    company: "Nokia",
    productOrTeam: "Carbide.c++ Development Tools",
    displayTitle: "Software Test Engineer",
    start: "October 2005",
    end: "October 2011",
    summary:
      "Built automated testing and CI systems for Nokia’s Carbide.c++ smartphone-development tools, led a test team of up to six engineers, and developed Linux toolchain support for Qt/Symbian projects.",
    responsibilities: [
      "Supported Hudson/Jenkins continuous-integration systems and designed automated tests.",
      "Led a test team of up to six engineers.",
      "Developed Linux toolchain components for Qt/Symbian projects.",
    ],
    publicSafe: true,
  },
  {
    id: "metrowerks-2000",
    company: "Metrowerks / Motorola / Freescale",
    productOrTeam: "CodeWarrior and embedded development boards",
    displayTitle: "Software Test Engineer / Factory Test Engineer",
    start: "March 2000",
    end: "October 2004",
    summary:
      "Began at Metrowerks working on CodeWarrior and embedded development-board tooling, continuing through Motorola’s acquisition and the Freescale spin-off. Built automated IDE, SDK, framework, and factory-acceptance tests across Mac and embedded platforms.",
    responsibilities: [
      "Automated testing for Mac applications, IDE plug-ins, templates, examples, and application frameworks.",
      "Factory and system-integration tests for microcontroller development boards using C and assembly.",
    ],
    publicSafe: true,
    sourceNotes: [
      "The historical résumé records an October 2004 end date; the later transition path into Nokia needs reconciliation.",
    ],
    needsVerification: [
      "Exact Metrowerks/Freescale end date and Nokia transition timing.",
    ],
  },
] as const satisfies readonly CareerRole[];

export const publicCareerRoles = careerRoles.filter(
  ({ publicSafe }) => publicSafe
);

export function getCareerRole(id: CareerRoleId): CareerRole {
  const role = careerRoles.find((candidate) => candidate.id === id);
  if (!role) {
    throw new Error(`Unknown career role: ${id}`);
  }
  return role;
}

export function formatCareerDateRange(role: CareerRole) {
  return `${role.start}–${role.end ?? "Present"}`;
}

export const education = {
  institution: "The University of Texas at Austin",
  degree: "Bachelor of Science in Computer Engineering",
  start: "1995",
  end: "2000",
} as const;
