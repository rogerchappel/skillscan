#!/usr/bin/env node
import { loadConfig, scanPath, shouldFail, writeDefaultConfig } from "./index.js";
import type { Finding, ScanResult } from "./types.js";

interface ParsedArgs {
  command: "check" | "json" | "init" | "help" | "version";
  path: string;
  configPath?: string;
  force: boolean;
}

const usage = `Usage:
  skillscan check <path> [--config <file>]
  skillscan json <path> [--config <file>]
  skillscan init [--force]

Commands:
  check   Print a human-readable report and exit non-zero on configured findings.
  json    Emit stable JSON and exit non-zero on configured findings.
  init    Write skillscan.config.jsonc in the current directory.
`;

async function main(argv: string[]): Promise<number> {
  try {
    const args = parseArgs(argv);

    if (args.command === "help") {
      console.log(usage.trimEnd());
      return 0;
    }

    if (args.command === "version") {
      console.log("0.1.0");
      return 0;
    }

    if (args.command === "init") {
      writeDefaultConfig(undefined, args.force);
      console.log("Wrote skillscan.config.jsonc");
      return 0;
    }

    const config = loadConfig(args.path, args.configPath);
    const result = scanPath(args.path, { configPath: args.configPath });

    if (args.command === "json") {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatReport(result));
    }

    return shouldFail(result, config.failOn) ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    return { command: "help", path: ".", force: false };
  }

  if (command === "--version" || command === "-v" || command === "version") {
    return { command: "version", path: ".", force: false };
  }

  if (!["check", "json", "init"].includes(command)) {
    throw new Error(`Unknown command: ${command}\n\n${usage}`);
  }

  const parsed: ParsedArgs = {
    command: command as ParsedArgs["command"],
    path: ".",
    force: false,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value === "--force") {
      parsed.force = true;
      continue;
    }
    if (value === "--config") {
      const configPath = rest[index + 1];
      if (!configPath) {
        throw new Error("--config requires a file path.");
      }
      parsed.configPath = configPath;
      index += 1;
      continue;
    }
    if (value.startsWith("-")) {
      throw new Error(`Unknown option: ${value}`);
    }
    parsed.path = value;
  }

  if (parsed.command !== "init" && !parsed.path) {
    throw new Error(`${parsed.command} requires a path.`);
  }

  return parsed;
}

function formatReport(result: ScanResult): string {
  const lines = [
    `SkillScan ${result.version}`,
    `Scanned: ${result.root}`,
    `Files: ${result.summary.filesScanned}`,
    `Findings: ${result.summary.findings} (${result.summary.errors} error, ${result.summary.warnings} warning, ${result.summary.infos} info)`,
  ];

  if (result.findings.length === 0) {
    lines.push("", "No findings.");
    return lines.join("\n");
  }

  lines.push("");

  for (const finding of result.findings) {
    lines.push(formatFinding(finding));
  }

  return lines.join("\n");
}

function formatFinding(finding: Finding): string {
  return [
    `[${finding.severity}] ${finding.ruleId} (${finding.category})`,
    `  ${finding.file}:${finding.line}:${finding.column}`,
    `  ${finding.message}`,
    finding.excerpt ? `  > ${finding.excerpt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

main(process.argv.slice(2)).then((exitCode) => {
  process.exitCode = exitCode;
});
