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
    requireNearby: /\b(?:untrusted|prompt injection|verify|do not trust|treat .* as data)\b/i,
  },
];

const TARGET_NAMES = new Set(['AGENTS.md', 'SKILL.md', 'README.md']);

export function scanText(text, filePath = '<input>') {
  const findings = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (!rule.pattern.test(line)) continue;
      if (rule.requireNearby && rule.requireNearby.test(text)) continue;

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
  const files = collectFiles(absolute);
  return files.flatMap((file) => scanText(fs.readFileSync(file, 'utf8'), file));
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

function writeConfig() {
  const target = path.resolve('skillscan.config.json');
  if (fs.existsSync(target)) {
    throw new Error('skillscan.config.json already exists');
  }

  fs.writeFileSync(target, `${JSON.stringify({ include: ['AGENTS.md', 'SKILL.md', 'README.md'] }, null, 2)}\n`);
  console.log(`Created ${target}`);
}

function usage() {
  return [
    'Usage: skillscan <check|json|init> [path]',
    '',
    'Commands:',
    '  check <path>  Print human-readable findings for a file or directory.',
    '  json <path>   Print stable JSON findings for a file or directory.',
    '  init          Write a starter skillscan.config.json file.',
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
