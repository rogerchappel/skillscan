import { execFileSync } from "node:child_process";

const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const [pack] = JSON.parse(output);
const packedFiles = new Set(pack.files.map((file) => file.path));

const requiredFiles = [
  "package.json",
  "src/index.js",
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "AGENTS.md",
  "docs/README.md",
  "docs/release-readiness.md",
];

const missing = requiredFiles.filter((file) => !packedFiles.has(file));

if (missing.length > 0) {
  console.error(`Missing expected package files:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log(`Package smoke passed: ${pack.files.length} files, ${pack.size} bytes.`);
