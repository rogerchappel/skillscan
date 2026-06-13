# SkillScan Task Breakdown

## Current Slice

- Provide a minimal `skillscan check <path>` command for local instruction-file scans.
- Provide `skillscan json <path>` for CI-friendly findings.
- Keep rules deterministic and local-only so results are reviewable without model calls.

## Next Tasks

- Add fixture directories for risky and clean agent instruction examples.
- Add configurable include/exclude paths.
- Document common false positives before broad release.
