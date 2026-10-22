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
    id: selectedWorkIds.giphy,
    eyebrow: `${getCareerRoleLabel(giphyRole)} · ${formatCareerDateRange(giphyRole)}`,
    title: "GIPHY",
    summary:
      "Lead architecture and implementation for advertising networks and privacy-conscious targeting across GIPHY’s consumer product and partner channels.",
  },
  {
    id: selectedWorkIds.shutterstockCreate,
    eyebrow: `${formatCareerDateRange(firstShutterstockRole)} · ${formatCareerDateRange(secondShutterstockRole)}`,
    title: "Shutterstock",
    summary:
      "Helped build Editor and later Create. Led Editor’s partner SDK and cloud migration; contributed to the team behind Shutterstock’s first AI image-editing tool.",
  },
  {
    id: selectedWorkIds.verta,
    eyebrow: `${getCareerRoleLabel(vertaRole)} · ${formatCareerDateRange(vertaRole)}`,
    title: "Verta",
    summary:
      "Owned everything that touched the browser for an enterprise MLOps platform, from React and GraphQL to releases, customer support, and on-call.",
  },
] as const;
