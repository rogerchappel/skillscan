# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Fixed

- Reject surplus `check` and `json` positional arguments instead of silently
  ignoring requested scan targets.
- Reject arguments to `init` instead of silently ignoring them and writing a
  config in the current directory.

### Added

- Adopted the repository-owned `@rogerchappel/skillscan` npm identity, declared
  Node.js 22 support, and added deterministic installs and registry collision
  checks to the release path.

- Added a release-readiness checklist for local verification and package review.

- Initial project setup.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/skillscan/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/skillscan/releases/latest`

Replace placeholder links once the first release tag exists.
