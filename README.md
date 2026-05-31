# skillscan

Local-first CLI for scanning agent instruction files for risky directives,
missing trust boundaries, hard-coded secrets, and destructive-command language.

## Status

This repository is early-stage. The scanner is deterministic and conservative:
it is useful for review gates, but it cannot prove an instruction file is safe.

## Install

```sh
npm install
npm run build
```

## Use

Scan a workspace or a single instruction file:

```sh
npm exec -- skillscan check .
```

Emit JSON for CI or another local tool:

```sh
npm exec -- skillscan json ./skills/my-skill
```

Create a config file:

```sh
npm exec -- skillscan init
```

Example config:

```jsonc
{
  "failOn": "warning",
  "ignorePaths": ["node_modules", "dist", ".git"],
  "ignoreRules": [],
  "includeNames": ["AGENTS.md", "SKILL.md", "CLAUDE.md", ".cursorrules"]
}
```

## Verify

Run the release check before opening a pull request:

```sh
npm run release:check
```

Run repository validation:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## License

MIT
