# Contributing

Contributions are welcome when they keep the integration focused, private by default, and compatible with supported Home Assistant and Vikunja releases.

## Before opening an issue

- Search existing issues.
- Reproduce the behavior with the latest release.
- Remove API tokens, private URLs, task content, personal information, and unique infrastructure details from logs and screenshots.
- For security-sensitive reports, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Development workflow

1. Create a focused branch.
2. Keep the `vikunja` integration domain and `custom:vikunja-todo-card` type compatible unless a migration is included.
3. Update user documentation and `CHANGELOG.md` for user-visible changes.
4. Add or update tests and validation where practical.
5. Run the checks in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
6. Submit a pull request describing behavior, validation, compatibility impact, and rollback considerations.

Do not include real task data or private deployment diagnostics in fixtures, documentation, commits, issues, or pull requests.
