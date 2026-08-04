#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RULES = [
  {
    id: 'secret-looking-content',
    severity: 'high',
    pattern: /\b(?:api[_-]?key|token|secret|password)\b\s*[:=]\s*['"]?[A-Za-z0-9_./+=-]{12,}/i,
    message: 'Secret-looking assignment found in instruction content.',
  },
  {
    id: 'destructive-permission',
    severity: 'high',
    pattern: /\b(?:rm\s+-rf|git\s+reset\s+--hard|delete\s+everything|wipe\s+the)\b/i,
    message: 'Destructive command or broad deletion permission needs explicit guardrails.',
  },
  {
    id: 'unbounded-autonomy',
    severity: 'medium',
    pattern: /\b(?:without asking|no approval needed|always approve|ignore safety)\b/i,
    message: 'Unbounded autonomy language can bypass review or approval boundaries.',
  },
  {
    id: 'trust-boundary-gap',
    severity: 'medium',
    pattern: /\b(?:web|browser|mcp|slack|email|chat)\b/i,
    message: 'External-context instructions should state how untrusted content is handled.',
    requireNearby: /\b(?:untrusted|prompt injection|do not trust|treat [^\n]* as data)\b/i,
    nearbyLineRadius: 1,
  },
];

const TARGET_NAMES = new Set(['AGENTS.md', 'SKILL.md', 'README.md']);

export function scanText(text, filePath = '<input>') {
  const findings = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (!rule.pattern.test(line)) continue;
      if (rule.requireNearby) {
        const radius = rule.nearbyLineRadius ?? 0;
        const nearby = lines
          .slice(Math.max(0, index - radius), Math.min(lines.length, index + radius + 1))
          .join('\n');
        if (rule.requireNearby.test(nearby)) continue;
      }

      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        file: filePath,
        line: index + 1,
        message: rule.message,
        excerpt: line.trim().slice(0, 160),
      });
    }
  });

  return findings;
}

export function scanPath(targetPath) {
  const absolute = path.resolve(targetPath);
  const stat = fs.statSync(absolute);
  const files = stat.isFile() ? [absolute] : collectDirectoryFiles(absolute);
  return files.flatMap((file) => scanText(fs.readFileSync(file, 'utf8'), file));
}

function collectDirectoryFiles(targetPath) {
  const configPath = path.join(targetPath, 'skillscan.config.json');
  if (fs.existsSync(configPath)) {
    return readConfigIncludes(configPath, targetPath);
  }

  return collectFiles(targetPath);
}

function readConfigIncludes(configPath, targetPath) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`invalid ${configPath}: ${error.message}`);
  }

  if (
    !config ||
    typeof config !== 'object' ||
    !Array.isArray(config.include) ||
    config.include.length === 0 ||
    config.include.some(
      (entry) => typeof entry !== 'string' || entry.length === 0 || path.isAbsolute(entry),
    )
  ) {
    throw new Error(`invalid ${configPath}: "include" must be a non-empty array of relative file paths`);
  }

  const root = `${path.resolve(targetPath)}${path.sep}`;
  return config.include.map((entry) => {
    const file = path.resolve(targetPath, entry);
    if (!file.startsWith(root)) {
      throw new Error(`invalid ${configPath}: include path must stay within the scan directory: ${entry}`);
    }

    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      throw new Error(`invalid ${configPath}: included file does not exist: ${entry}`);
    }
    if (!stat.isFile()) {
      throw new Error(`invalid ${configPath}: included path is not a file: ${entry}`);
    }
    return file;
  });
}

function collectFiles(targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) return [targetPath];

  const files = [];
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;

    const child = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(child));
    } else if (TARGET_NAMES.has(entry.name) || entry.name.endsWith('.md')) {
      files.push(child);
    }
  }
  return files;
}

function printText(findings) {
  if (findings.length === 0) {
    console.log('skillscan: no findings');
    return;
  }

  for (const finding of findings) {
    console.log(`${finding.severity.toUpperCase()} ${finding.ruleId} ${finding.file}:${finding.line}`);
    console.log(`  ${finding.message}`);
    if (finding.excerpt) console.log(`  ${finding.excerpt}`);
  }
}

export function writeConfig(directory = '.') {
  const root = path.resolve(directory);
  const target = path.join(root, 'skillscan.config.json');
  if (fs.existsSync(target)) {
    throw new Error('skillscan.config.json already exists');
  }

  const include = [...TARGET_NAMES].filter((name) => {
    try {
      return fs.statSync(path.join(root, name)).isFile();
    } catch {
      return false;
    }
  });
  if (include.length === 0) {
    throw new Error('no supported target files found; create AGENTS.md, SKILL.md, or README.md first');
  }

  fs.writeFileSync(target, `${JSON.stringify({ include }, null, 2)}\n`);
  console.log(`Created ${target}`);
}

function usage() {
  return [
    'Usage: skillscan <check|json|init> [path]',
    '',
    'Commands:',
    '  check <path>  Print findings. Directory scans honor skillscan.config.json.',
    '  json <path>   Print JSON. Directory scans honor skillscan.config.json.',
    '  init          Include supported target files present in the current directory.',
    '',
    'Init requires at least one of AGENTS.md, SKILL.md, or README.md.',
    'Direct file targets are always scanned, independent of directory config.',
  ].join('\n');
}

function main(argv) {
  const [command, target = '.'] = argv;
  if (!command || command === '--help' || command === '-h') {
    console.log(usage());
    return 0;
  }

  if (command === 'init') {
    writeConfig();
    return 0;
  }

  if (command !== 'check' && command !== 'json') {
    console.error(usage());
    return 2;
  }

  const findings = scanPath(target);
  if (command === 'json') {
    console.log(JSON.stringify({ findings }, null, 2));
  } else {
    printText(findings);
  }

  return findings.some((finding) => finding.severity === 'high') ? 1 : 0;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`skillscan: ${error.message}`);
    process.exitCode = 2;
  }
}
