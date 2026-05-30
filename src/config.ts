import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { SkillScanConfig } from "./types.js";

export const configFileName = "skillscan.config.jsonc";

export const defaultConfig: SkillScanConfig = {
  failOn: "warning",
  ignorePaths: ["node_modules", "dist", ".git"],
  ignoreRules: [],
  includeNames: ["AGENTS.md", "SKILL.md", "CLAUDE.md", ".cursorrules"],
};

export function findConfig(startPath: string): string | null {
  let current = resolve(startPath);
  if (!existsSync(current) || !statSync(current).isDirectory()) {
    current = dirname(current);
  }

  while (true) {
    const candidate = join(current, configFileName);
    if (existsSync(candidate)) {
      return candidate;
    }

    const next = dirname(current);
    if (next === current) {
      return null;
    }
    current = next;
  }
}

export function loadConfig(scanPath: string, explicitConfig?: string): SkillScanConfig {
  const configPath = explicitConfig ? resolve(explicitConfig) : findConfig(scanPath);
  if (!configPath) {
    return { ...defaultConfig };
  }

  const parsed = JSON.parse(stripJsonComments(readFileSync(configPath, "utf8"))) as Partial<SkillScanConfig>;
  return {
    failOn: parsed.failOn === "error" ? "error" : defaultConfig.failOn,
    ignorePaths: parsed.ignorePaths ?? defaultConfig.ignorePaths,
    ignoreRules: parsed.ignoreRules ?? defaultConfig.ignoreRules,
    includeNames: parsed.includeNames ?? defaultConfig.includeNames,
  };
}

export function writeDefaultConfig(path = configFileName, force = false): void {
  if (existsSync(path) && !force) {
    throw new Error(`${path} already exists. Use --force to overwrite it.`);
  }

  writeFileSync(
    path,
    `{
  // Findings at this severity or higher cause exit code 1.
  "failOn": "warning",

  // Path segments to skip while walking directories.
  "ignorePaths": ["node_modules", "dist", ".git"],

  // Rule IDs to suppress when they are noisy for this workspace.
  "ignoreRules": [],

  // File names SkillScan treats as agent instruction files.
  "includeNames": ["AGENTS.md", "SKILL.md", "CLAUDE.md", ".cursorrules"]
}
`,
  );
}

function stripJsonComments(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1")
    .replace(/,\s*([}\]])/g, "$1");
}
