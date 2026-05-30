export type Severity = "info" | "warning" | "error";

export type Category =
  | "secrets"
  | "external-action"
  | "destructive-command"
  | "trust-boundary"
  | "stale-tool"
  | "metadata";

export interface Finding {
  ruleId: string;
  category: Category;
  severity: Severity;
  message: string;
  file: string;
  line: number;
  column: number;
  excerpt: string;
}

export interface RuleMatch {
  ruleId: string;
  category: Category;
  severity: Severity;
  message: string;
  column: number;
}

export interface SkillScanConfig {
  failOn: "warning" | "error";
  ignorePaths: string[];
  ignoreRules: string[];
  includeNames: string[];
}

export interface ScanSummary {
  filesScanned: number;
  findings: number;
  errors: number;
  warnings: number;
  infos: number;
}

export interface ScanResult {
  tool: "skillscan";
  version: string;
  root: string;
  summary: ScanSummary;
  findings: Finding[];
}
