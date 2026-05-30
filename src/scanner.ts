import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, relative, resolve, sep } from "node:path";
import { loadConfig } from "./config.js";
import { scanDocument, scanLine } from "./rules.js";
import type { Finding, ScanResult, SkillScanConfig } from "./types.js";

export interface ScanOptions {
  configPath?: string;
  cwd?: string;
}

const version = "0.1.0";

export function scanPath(path: string, options: ScanOptions = {}): ScanResult {
  const cwd = resolve(options.cwd ?? process.cwd());
  const target = resolve(cwd, path);
  const config = loadConfig(target, options.configPath);
  const files = discoverFiles(target, config);
  const findings = files.flatMap((file) => scanFile(file, cwd, config));

  return {
    tool: "skillscan",
    version,
    root: relative(cwd, target) || ".",
    summary: {
      filesScanned: files.length,
      findings: findings.length,
      errors: findings.filter((finding) => finding.severity === "error").length,
      warnings: findings.filter((finding) => finding.severity === "warning").length,
      infos: findings.filter((finding) => finding.severity === "info").length,
    },
    findings,
  };
}

export function shouldFail(result: ScanResult, failOn: SkillScanConfig["failOn"]): boolean {
  if (failOn === "error") {
    return result.summary.errors > 0;
  }
  return result.summary.errors + result.summary.warnings > 0;
}

function discoverFiles(path: string, config: SkillScanConfig): string[] {
  const stat = statSync(path);
  if (stat.isFile()) {
    return [path];
  }

  const files: string[] = [];
  walk(path, config, files);
  return files.sort();
}

function walk(path: string, config: SkillScanConfig, files: string[]): void {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const fullPath = resolve(path, entry.name);
    if (isIgnored(fullPath, config)) {
      continue;
    }
    if (entry.isDirectory()) {
      walk(fullPath, config, files);
      continue;
    }
    if (entry.isFile() && shouldInclude(entry.name, config)) {
      files.push(fullPath);
    }
  }
}

function scanFile(file: string, cwd: string, config: SkillScanConfig): Finding[] {
  const relativeFile = relative(cwd, file);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const findings: Finding[] = [];

  lines.forEach((line, index) => {
    for (const match of scanLine(line)) {
      if (config.ignoreRules.includes(match.ruleId)) {
        continue;
      }
      findings.push({
        ...match,
        file: relativeFile,
        line: index + 1,
        excerpt: line.trim(),
      });
    }
  });

  for (const match of scanDocument(lines, basename(file))) {
    if (config.ignoreRules.includes(match.ruleId)) {
      continue;
    }
    findings.push({
      ...match,
      file: relativeFile,
      line: 1,
      excerpt: lines[0]?.trim() ?? "",
    });
  }

  return findings;
}

function isIgnored(path: string, config: SkillScanConfig): boolean {
  const segments = path.split(sep);
  return config.ignorePaths.some((ignored) => segments.includes(ignored));
}

function shouldInclude(name: string, config: SkillScanConfig): boolean {
  return config.includeNames.includes(name) || name.endsWith(".agents.md") || name.endsWith(".skill.md");
}
