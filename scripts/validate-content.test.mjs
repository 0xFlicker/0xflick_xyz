import assert from "node:assert/strict";
import test from "node:test";

import {
  findLiteralInternalHrefs,
  isForbiddenArtifact,
  routeFromPageFile,
  validateStableCareerRecords,
} from "./validate-content.mjs";

test("derives routes from App Router page files", () => {
  const appRoot = "/project/src/app";

  assert.equal(routeFromPageFile(appRoot, `${appRoot}/page.tsx`), "/");
  assert.equal(
    routeFromPageFile(appRoot, `${appRoot}/(site)/~/projects/page.tsx`),
    "/~/projects"
  );
});

test("finds literal internal hrefs in JSX and object properties", () => {
  const source = `
    <Link href="/connect">Connect</Link>
    <Link href={'/~/projects#work'}>Work</Link>
    const item = { href: "/~/about", label: "About" };
    <Link href={profileLinks.github}>GitHub</Link>
  `;

  assert.deepEqual(findLiteralInternalHrefs(source), [
    "/connect",
    "/~/projects#work",
    "/~/about",
  ]);
});

test("identifies PDF and résumé artifacts without treating source as an artifact", () => {
  assert.equal(isForbiddenArtifact("public/john-dean.pdf"), true);
  assert.equal(isForbiddenArtifact("public/john-dean-resume.docx"), true);
  assert.equal(isForbiddenArtifact("public/resume.html"), true);
  assert.equal(isForbiddenArtifact("scripts/resume-generator.ts"), false);
  assert.equal(isForbiddenArtifact("src/app/~/cv/page.tsx"), false);
});

test("keeps employer, displayed role, and dates coupled to stable career IDs", () => {
  const validCareerSource = `
    export const careerRoles = [
      { id: "giphy-2024", company: "GIPHY", displayTitle: "Principal Architect", start: "2024" },
      { id: "shutterstock-2022", company: "Shutterstock", displayTitle: "Software Engineer", start: "2022", end: "2024" },
      { id: "shutterstock-2015", company: "Shutterstock", displayTitle: "Software Developer", start: "November 2015", end: "July 2019" },
      { id: "verta-2020", company: "Verta", roleContext: "Employee #6", start: "2020", end: "2022" },
      { id: "sandbox-vr-2019", company: "Sandbox VR", roleContext: "US salaried technical employee #4", start: "July 2019", end: "April 2020" },
      { id: "metrowerks-2000", company: "Metrowerks / Motorola / Freescale", displayTitle: "Software Test Engineer / Factory Test Engineer", start: "March 2000", end: "October 2005" },
    ] as const satisfies readonly CareerRole[];
  `;

  assert.deepEqual(validateStableCareerRecords(validCareerSource), []);
  assert.match(
    validateStableCareerRecords(
      validCareerSource.replace('end: "2024"', 'end: "2025"')
    ).join("\n"),
    /shutterstock-2022 has end=2025; expected 2024/
  );
  assert.match(
    validateStableCareerRecords(
      validCareerSource.replace(
        'roleContext: "Employee #6"',
        'displayTitle: "Invented", roleContext: "Employee #6"'
      )
    ).join("\n"),
    /verta-2020 has displayTitle=Invented; expected <absent>/
  );
  assert.match(
    validateStableCareerRecords(
      validCareerSource.replace('end: "October 2005"', 'end: "October 2004"')
    ).join("\n"),
    /metrowerks-2000 has end=October 2004; expected October 2005/
  );
});
