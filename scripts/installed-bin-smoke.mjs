import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "skillscan-installed-bin-"));

try {
  const packOutput = execFileSync(
    "npm",
    ["pack", "--json", "--pack-destination", root],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const [pack] = JSON.parse(packOutput);
  const prefix = join(root, "install");
  execFileSync("npm", ["install", "--prefix", prefix, join(root, pack.filename)], {
    stdio: "pipe",
  });

  const executable = join(prefix, "node_modules", ".bin", "skillscan");
  const help = spawnSync(executable, ["--help"], { encoding: "utf8" });
  if (help.status !== 0 || !help.stdout.includes("Usage: skillscan <check|json> [path]")) {
    throw new Error(`installed skillscan --help failed (${help.status}): ${help.stderr || help.stdout}`);
  }

  const fixture = join(root, "fixture");
  mkdirSync(fixture);
  const target = join(fixture, "AGENTS.md");
  writeFileSync(target, "Use email messages.\n");
  const scan = spawnSync(executable, ["json", target], { encoding: "utf8" });
  const report = JSON.parse(scan.stdout);
  if (scan.status !== 0 || report.findings?.[0]?.ruleId !== "trust-boundary-gap") {
    throw new Error(`installed skillscan scan failed (${scan.status}): ${scan.stderr || scan.stdout}`);
  }

  console.log("Installed bin smoke passed: help and JSON scan executed through npm bin link.");
} finally {
  rmSync(root, { recursive: true, force: true });
}
