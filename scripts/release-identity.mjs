import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const expectedName = "@rogerchappel/skillscan";
const expectedRepository = "github.com/rogerchappel/skillscan";
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));

if (packageJson.name !== expectedName) {
  throw new Error(`Expected package name ${expectedName}, received ${packageJson.name}.`);
}

try {
  const output = execFileSync("npm", ["view", expectedName, "name", "repository.url", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const registry = JSON.parse(output);
  const repository = typeof registry.repository === "string" ? registry.repository : registry.repository?.url;

  if (registry.name !== expectedName || !repository?.includes(expectedRepository)) {
    throw new Error(`${expectedName} has an unexpected registry identity (${repository ?? "no repository"}).`);
  }
  console.log(`Release identity passed: ${expectedName} is owned by ${expectedRepository}.`);
} catch (error) {
  const stderr = error?.stderr?.toString() ?? "";
  if (error?.status === 1 && /E404|404 Not Found/.test(stderr)) {
    console.log(`Release identity passed: ${expectedName} is available on npm.`);
  } else {
    throw error;
  }
}
