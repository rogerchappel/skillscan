# SkillScan Orchestration Plan

SkillScan runs as a local CLI. It reads Markdown and agent-instruction files from a file or directory, applies deterministic rules, and writes either a text report or JSON findings.

No network calls, remote services, or model-based judgment are part of the release path. CI should run `npm run release:check`, which covers syntax checks, tests, a representative smoke scan, and package dry-run verification.

Maintainers should add new rules behind fixture-backed tests so findings stay stable for automation users.
