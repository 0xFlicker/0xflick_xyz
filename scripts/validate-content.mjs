import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ignoredDirectories = new Set([".git", ".next", "node_modules", "output"]);
const publicTextExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);
const sourceCodeExtensions = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(absolute)));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files;
}

function normalizeRoute(route) {
  const withoutSuffix = route.split("#")[0].split("?")[0];
  return withoutSuffix.length > 1
    ? withoutSuffix.replace(/\/+$/, "")
    : withoutSuffix;
}

export function routeFromPageFile(appRoot, pageFile) {
  const relative = path.relative(appRoot, pageFile);
  const segments = relative.split(path.sep).slice(0, -1);
  const routeSegments = segments.filter(
    (segment) => !/^\(.*\)$/.test(segment) && !segment.startsWith("@")
  );

  return routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
}

export function findLiteralInternalHrefs(contents) {
  const hrefs = [];
  const hrefPattern =
    /\bhref\s*(?:=\s*(?:\{\s*)?|:\s*)["'](\/(?!\/)[^"']*)["'](?:\s*\})?/g;

  for (const match of contents.matchAll(hrefPattern)) {
    hrefs.push(match[1]);
  }

  return hrefs;
}

export function isForbiddenArtifact(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === ".pdf") return true;

  const basename = path.basename(file, extension);
  const namesResume = /(?:^|[-_.\s])(resume|résumé)(?:[-_.\s]|$)/i.test(
    basename
  );

  return namesResume && !sourceCodeExtensions.has(extension);
}

function findMatchingBrace(source, openingBrace) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function careerRoleSource(careerSource, id) {
  const careerArrayStart = careerSource.indexOf("export const careerRoles = [");
  const careerArrayEnd = careerSource.indexOf("] as const satisfies", careerArrayStart);
  if (careerArrayStart === -1 || careerArrayEnd === -1) return null;

  const careerArray = careerSource.slice(careerArrayStart, careerArrayEnd);
  const idPattern = new RegExp(`\\bid:\\s*["']${id}["']`, "g");
  const matches = [...careerArray.matchAll(idPattern)];
  if (matches.length !== 1) return null;

  const idIndex = matches[0].index;
  const objectStart = careerArray.lastIndexOf("{", idIndex);
  const objectEnd = findMatchingBrace(careerArray, objectStart);
  if (objectStart === -1 || objectEnd === -1) return null;

  return careerArray.slice(objectStart, objectEnd + 1);
}

function stringField(record, field) {
  const match = record.match(
    new RegExp(`(?:^|[,{]\\s*)${field}:\\s*["']([^"']*)["']`, "m")
  );
  return match?.[1];
}

export function validateStableCareerRecords(careerSource) {
  const failures = [];
  const stableRecords = [
    {
      id: "giphy-2024",
      company: "GIPHY",
      displayTitle: "Principal Architect",
      start: "2024",
      end: undefined,
    },
    {
      id: "shutterstock-2022",
      company: "Shutterstock",
      displayTitle: "Software Engineer",
      start: "2022",
      end: "2024",
    },
    {
      id: "shutterstock-2015",
      company: "Shutterstock",
      displayTitle: "Software Developer",
      start: "November 2015",
      end: "July 2019",
    },
    {
      id: "verta-2020",
      company: "Verta",
      displayTitle: undefined,
      roleContext: "Employee #6",
      start: "2020",
      end: "2022",
    },
    {
      id: "sandbox-vr-2019",
      company: "Sandbox VR",
      displayTitle: undefined,
      roleContext: "US salaried technical employee #4",
      start: "July 2019",
      end: "April 2020",
    },
    {
      id: "metrowerks-2000",
      company: "Metrowerks / Motorola / Freescale",
      displayTitle: "Software Test Engineer / Factory Test Engineer",
      start: "March 2000",
      end: "October 2005",
    },
  ];

  for (const expected of stableRecords) {
    const record = careerRoleSource(careerSource, expected.id);
    if (!record) {
      failures.push(
        `Career record ${expected.id} is missing, duplicated, or outside careerRoles`
      );
      continue;
    }

    for (const [field, expectedValue] of Object.entries(expected)) {
      if (field === "id") continue;

      const actualValue = stringField(record, field);
      if (actualValue !== expectedValue) {
        failures.push(
          `Career record ${expected.id} has ${field}=${actualValue ?? "<absent>"}; expected ${expectedValue ?? "<absent>"}`
        );
      }
    }
  }

  return failures;
}

export async function validateContent(root = process.cwd()) {
  const sourceRoot = path.join(root, "src");
  const appRoot = path.join(sourceRoot, "app");
  const publicTextRoots = [sourceRoot, path.join(root, "docs"), path.join(root, "public")];
  const sourceFiles = (await filesUnder(sourceRoot)).filter((file) =>
    /\.(?:ts|tsx)$/.test(file)
  );
  const sourceEntries = await Promise.all(
    sourceFiles.map(async (file) => ({ file, contents: await readFile(file, "utf8") }))
  );
  const source = sourceEntries.map(({ contents }) => contents).join("\n");
  const failures = [];

  const requireText = (text, reason) => {
    if (!source.includes(text)) failures.push(`${reason}: missing ${text}`);
  };

  requireText("John Dean", "Professional identity");
  requireText("0xFlicker", "Publishing identity");
  requireText("CaptEmulation", "Original GitHub identity");
  requireText("The University of Texas at Austin", "Education identity");

  const careerFile = path.join(sourceRoot, "lib", "career.ts");
  const careerSource = await readFile(careerFile, "utf8");
  failures.push(...validateStableCareerRecords(careerSource));

  const publicTextFiles = (
    await Promise.all(publicTextRoots.map((directory) => filesUnder(directory)))
  )
    .flat()
    .filter((file) => publicTextExtensions.has(path.extname(file).toLowerCase()));
  const publicTextEntries = await Promise.all(
    publicTextFiles.map(async (file) => ({ file, contents: await readFile(file, "utf8") }))
  );
  const forbiddenText = [
    [/Employer anonymized/i, "An anonymized employer label remains"],
    [/soapbubble\.online/i, "The lost Soap Bubble domain remains"],
    [/\bTelegram\b/i, "Telegram is still presented"],
    [/\bofficialTitle\b/, "The removed official-title field remains"],
    [
      /historical\s+(?:official\s+|résumé\s+|resume\s+)?title/i,
      "A removed historical-title annotation remains",
    ],
    [/\bTODO\b/, "An internal TODO is present"],
    [
      /\bhref\s*(?:=\s*(?:\{\s*)?|:\s*)["'][^"']*(?:\/resume|\.pdf)[^"']*["']/i,
      "A résumé or PDF link remains",
    ],
    [
      /(?:\$\s*\d|\b\d+(?:\.\d+)?\s+million\s+dollars?\b)/i,
      "A résumé-only employer revenue amount is present",
    ],
  ];

  for (const { file, contents } of publicTextEntries) {
    for (const [pattern, reason] of forbiddenText) {
      if (pattern.test(contents)) {
        failures.push(`${reason} in ${path.relative(root, file)}`);
      }
    }
  }

  const repositoryFiles = await filesUnder(root);
  for (const file of repositoryFiles.filter(isForbiddenArtifact)) {
    failures.push(
      `Forbidden résumé/PDF artifact: ${path.relative(root, file)}`
    );
  }

  const pageFiles = sourceFiles.filter(
    (file) => path.basename(file) === "page.tsx" && file.startsWith(`${appRoot}${path.sep}`)
  );
  const knownRoutes = new Set(pageFiles.map((file) => routeFromPageFile(appRoot, file)));

  for (const { file, contents } of sourceEntries) {
    for (const href of findLiteralInternalHrefs(contents)) {
      const route = normalizeRoute(href);
      if (!knownRoutes.has(route)) {
        failures.push(
          `Unknown internal route ${href} in ${path.relative(root, file)}`
        );
      }
    }
  }

  return {
    failures,
    sourceFileCount: sourceFiles.length,
    routeCount: knownRoutes.size,
    publicTextFileCount: publicTextFiles.length,
  };
}

async function main() {
  const result = await validateContent();
  if (result.failures.length > 0) {
    console.error(result.failures.map((failure) => `- ${failure}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(
    `Validated identity, stable chronology, privacy markers, and ${result.routeCount} discovered routes across ${result.sourceFileCount} source files and ${result.publicTextFileCount} public text files.`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
