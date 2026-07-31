# skillscan

Audit agent instruction files for risky directives, secret-looking content, and missing trust-boundary language.

## Status

This repository is early-stage. Confirm the current support, release, and
security posture before using it in production.

## Install

Install from a checked-out copy while the package is pre-release:

```sh
npm install
npm link
```

## Use

Scan one file or a directory of Markdown and agent instruction files:

```sh
skillscan check AGENTS.md
skillscan json .
skillscan init
```

`check` prints a human-readable report. `json` prints stable JSON for CI. `init`
writes `skillscan.config.json` in the current directory:

```json
{
  "include": ["AGENTS.md", "SKILL.md", "README.md"]
}
```

When a directory is scanned, skillscan uses the config in that directory and
scans only the listed files. Entries are file paths relative to the scanned
directory; they must exist, be files, and stay inside that directory. An absent
config preserves the default behavior of recursively scanning Markdown files
while skipping `.git` and `node_modules`. Invalid JSON, an invalid `include`
value, a missing included file, or an escaping path exits with status 2 and a
clear error.

A direct file target is always scanned and does not load an adjacent config:

```sh
skillscan check OTHER.md
```

Trust-boundary language must appear on the external-context instruction's line
or an immediately adjacent line. Explicit language such as `untrusted`,
`prompt injection`, `do not trust`, or `treat ... as data` counts as a
mitigation; unrelated verification instructions do not suppress a finding.

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

## Release readiness

Use [docs/release-readiness.md](docs/release-readiness.md) before opening release PRs or tagging a release.
Run `npm run release:check` to combine syntax checks, tests, CLI smoke, and an
npm package dry-run that asserts the CLI, docs, agent guidance, and support
files are present in the tarball.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## License

MIT

## Limitations

skillscan is a local-first helper for preparing reviewable evidence. It does not replace human review, live system validation, or project-specific policy checks, and generated output should be inspected before use in release or operational decisions.
