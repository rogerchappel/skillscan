# SkillScan PRD

Status: in-progress

## Summary

SkillScan is a local CLI that audits `AGENTS.md`, `SKILL.md`, and similar agent-instruction files for risky directives, stale tool assumptions, secret-looking content, and trust-boundary problems. It produces a human-readable report and a JSON findings file suitable for CI.

The point is not to police style. The point is to catch instruction files that accidentally grant too much authority, leak private context, or invite agents to trust untrusted inputs.

## Why now

Agent systems increasingly rely on repo-local and workspace-local instruction files. OpenClaw-style skills, Codex `AGENTS.md`, and MCP-adjacent tool descriptions can materially change agent behavior. Recent research highlights skill files and local content as prompt-injection channels, while developer surveys report difficulty tracking what agents are doing across multiple tools.

Sources/inspiration:

- ClawGuard prompt-injection channel taxonomy: https://arxiv.org/abs/2604.11790
- 2026 developer-agent survey snippet reporting that many developers use multiple coding tools and struggle to track agent behavior: https://ivern.ai/blog/state-of-ai-agents-developer-survey-2026
- OpenClaw skill-file convention as public ecosystem context.

## Users

- Maintainers of repos with agent instructions.
- Local-first agent users managing personal skills.
- Security reviewers doing lightweight checks before sharing an agent workspace.

## MVP

- CLI commands:
  - `skillscan check <path>` scans one file or directory.
  - `skillscan json <path>` emits stable JSON.
  - `skillscan init` writes a commented local config.
- Rule categories:
  - Secrets and private data patterns.
  - Dangerous external-action permissions.
  - Unbounded destructive-command permissions.
  - Trust-boundary omissions for web/MCP/group chat contexts.
  - Stale tool references and missing skill metadata.
- Exit codes suitable for CI.
- Tests with fixture workspaces.
- README with examples for pre-commit and CI.

## Non-goals

- No hosted scanning.
- No model-based security judgement.
- No automatic rewrites in V1.

## Success criteria

- Running `skillscan check fixtures/risky-skill` flags concrete findings with line numbers.
- JSON output is stable enough for tests and automation.
- Documentation is honest about false positives and local-only design.

