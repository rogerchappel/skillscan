import type { Category, RuleMatch, Severity } from "./types.js";

interface LineRule {
  id: string;
  category: Category;
  severity: Severity;
  message: string;
  pattern: RegExp;
}

const lineRules: LineRule[] = [
  {
    id: "secret.aws-access-key",
    category: "secrets",
    severity: "error",
    message: "Looks like an AWS access key. Move secrets out of instruction files.",
    pattern: /AKIA[0-9A-Z]{16}/,
  },
  {
    id: "secret.private-key",
    category: "secrets",
    severity: "error",
    message: "Looks like a private key block. Instruction files should not contain private key material.",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
  {
    id: "secret.token-literal",
    category: "secrets",
    severity: "error",
    message: "Looks like a hard-coded token, password, or API key.",
    pattern: /\b(?:api[_-]?key|token|secret|password)\b\s*[:=]\s*["']?(?!changeme|example|placeholder|redacted)[A-Za-z0-9_./+=-]{12,}/i,
  },
  {
    id: "secret.provider-token",
    category: "secrets",
    severity: "error",
    message: "Looks like a provider access token.",
    pattern: /\b(?:ghp|github_pat|sk|xox[baprs])-[A-Za-z0-9_-]{16,}/,
  },
  {
    id: "external-action.unconfirmed-send",
    category: "external-action",
    severity: "warning",
    message: "External communication is allowed without an explicit confirmation boundary.",
    pattern: /\b(?:send|email|post|tweet|publish|reply|message)\b.*\b(?:without asking|without confirmation|freely|automatically|do not ask)\b/i,
  },
  {
    id: "external-action.public-posting",
    category: "external-action",
    severity: "warning",
    message: "Public posting permissions need a clear ask-first rule.",
    pattern: /\b(?:tweet|post publicly|publish publicly|public post|social media)\b/i,
  },
  {
    id: "destructive.unbounded-delete",
    category: "destructive-command",
    severity: "error",
    message: "Destructive commands must be bounded and confirmation-gated.",
    pattern: /\b(?:rm\s+-rf|git\s+reset\s+--hard|git\s+clean\s+-fd|delete\s+everything|wipe\s+the\s+repo)\b/i,
  },
  {
    id: "destructive.no-confirmation",
    category: "destructive-command",
    severity: "warning",
    message: "Destructive file or history changes are permitted without confirmation.",
    pattern: /\b(?:delete|remove|overwrite|revert|reset)\b.*\b(?:without asking|without confirmation|freely|automatically|do not ask)\b/i,
  },
  {
    id: "trust-boundary.trust-web",
    category: "trust-boundary",
    severity: "warning",
    message: "Web content should be treated as untrusted input, not instructions.",
    pattern: /\b(?:trust|follow|obey)\b.*\b(?:web|browser|website|search result|page content)\b/i,
  },
  {
    id: "trust-boundary.private-in-group",
    category: "trust-boundary",
    severity: "error",
    message: "Private context must not be shared into group or public channels.",
    pattern: /\b(?:share|forward|reveal|paste)\b.*\b(?:private|secret|memory|personal)\b.*\b(?:group|discord|slack|public|channel)\b/i,
  },
  {
    id: "stale-tool.legacy-browser",
    category: "stale-tool",
    severity: "info",
    message: "Legacy browser tool naming may be stale; document the current tool contract.",
    pattern: /\b(?:browser\.open|browser\.search|web\.browse|mcp_browser)\b/i,
  },
  {
    id: "stale-tool.assumed-install",
    category: "stale-tool",
    severity: "info",
    message: "Tool availability is assumed without a check or fallback.",
    pattern: /\b(?:always use|must use|required tool)\b.*\b(?:plugin|connector|mcp|tool)\b/i,
  },
];

const boundaryTerms = /\b(?:ask|confirm|consent|untrusted|verify|private|do not share|trust boundary|permission)\b/i;
const contextTerms = /\b(?:web|browser|mcp|connector|plugin|discord|slack|group chat|public channel)\b/i;

export function scanLine(line: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (const rule of lineRules) {
    const match = rule.pattern.exec(line);
    if (!match || match.index === undefined) {
      continue;
    }
    matches.push({
      ruleId: rule.id,
      category: rule.category,
      severity: rule.severity,
      message: rule.message,
      column: match.index + 1,
    });
  }

  return matches;
}

export function scanDocument(lines: string[], fileName: string): RuleMatch[] {
  const text = lines.join("\n");
  const matches: RuleMatch[] = [];

  if (fileName === "SKILL.md" && !/^---\n[\s\S]*?\n---/.test(text) && !/^# .+/m.test(text)) {
    matches.push({
      ruleId: "metadata.skill-missing-heading",
      category: "metadata",
      severity: "warning",
      message: "SKILL.md should include a title or front matter so agents can identify the skill.",
      column: 1,
    });
  }

  if (contextTerms.test(text) && !boundaryTerms.test(text)) {
    matches.push({
      ruleId: "trust-boundary.missing-context-rule",
      category: "trust-boundary",
      severity: "warning",
      message: "This file mentions external contexts but lacks an explicit trust-boundary or confirmation rule.",
      column: 1,
    });
  }

  return matches;
}
