import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { assertInstallDocumentation } from "./release-install-docs-lib.mjs";

const packageName = "@rogerchappel/skillscan";
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
let packageIsPublished = true;

try {
  execFileSync("npm", ["view", packageName, "name"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
} catch (error) {
  const stderr = error?.stderr?.toString() ?? "";
  if (error?.status === 1 && /E404|404 Not Found/.test(stderr)) {
    packageIsPublished = false;
  } else {
    throw error;
  }
}

assertInstallDocumentation(readme, packageIsPublished);
console.log(`Install documentation passed: npm package is ${packageIsPublished ? "published" : "not yet published"}.`);
