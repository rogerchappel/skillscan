# Release readiness

Use this checklist before cutting a release or asking for a release review.

## Local verification

```sh
npm install
npm run test
npm run smoke
npm run package:smoke
npm run release:check
```

## Package contents

Run `npm run package:smoke` when available and review the dry-run file list for only the built runtime, README, license, and other intentional release assets.

## Notes

- Ensure GitHub Actions workflow dependencies use current supported major versions (`actions/checkout@v7`, `actions/setup-node@v7`).
- Keep README examples aligned with the fixture-backed smoke command.
- Do not publish until CI is green on the release branch.
- Update CHANGELOG.md with user-facing changes before tagging.
