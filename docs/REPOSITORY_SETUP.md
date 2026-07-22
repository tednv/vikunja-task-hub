# Repository settings

Vikunja Task Hub is maintained in its standalone GitHub repository. This document records the expected repository configuration for ongoing development and releases.

## Repository metadata

- Description: `Direct Vikunja project and task management for Home Assistant`
- Topics: `home-assistant`, `hacs`, `vikunja`, `task-management`, `lovelace`, `custom-integration`
- Default branch: `main`
- Keep issues, private vulnerability reporting, and Dependabot alerts enabled.
- Keep the wiki disabled unless it is actively maintained; repository documentation is canonical.

## Branch and tag protection

- Require pull requests for changes to `main`.
- Require repository validation, Hassfest, and HACS checks before merge.
- Protect published release tags from modification or deletion.
- Delete merged topic branches after their work is preserved on `main`.
- Never publish private session history, deployment records, credentials, service URLs, or real task data.

## Release readiness

Before preparing a release:

1. Confirm the working tree is clean and the release branch contains only intended public files.
2. Inspect the complete diff for secrets, private deployment details, personal information, and real task content.
3. Run every check in [DEVELOPMENT.md](DEVELOPMENT.md).
4. Update both version declarations and move user-visible changes into a dated changelog section.
5. Merge the release preparation through the protected `main` branch before creating its version tag.
6. Follow [RELEASING.md](RELEASING.md) for tag and GitHub release publication.
