export const selectedWorkIds = {
  theHouse: "the-house",
  morpheus: "morpheus",
  shutterstockEditor: "shutterstock-editor",
  shutterstockCreate: "shutterstock-create",
  openSource: "open-source",
} as const;

export type SelectedWorkId =
  (typeof selectedWorkIds)[keyof typeof selectedWorkIds];
