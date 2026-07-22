# Standalone repository setup

This project is prepared for an independent GitHub repository named `vikunja-task-hub`. Creating or publishing that repository is intentionally a separate, explicit action.

## Recommended GitHub settings

- Description: `Direct Vikunja project and task management for Home Assistant`
- Topics: `home-assistant`, `hacs`, `vikunja`, `task-management`, `lovelace`, `custom-integration`
- Default branch: `main`
- Enable issues, private vulnerability reporting, and Dependabot alerts.
- Require the Validate workflow on pull requests.
- Protect release tags from modification or deletion.
- Disable the wiki unless it will be actively maintained; repository documentation is canonical.

## Create the independent repository

Create a new empty repository rather than using GitHub's fork button. Do not initialize it with a README, license, or `.gitignore`; those files already exist here.

Before adding a remote:

1. Confirm the working tree is clean.
2. Confirm no secrets or private deployment details are tracked.
3. Confirm the default branch is named `main`.
4. Run every check in [DEVELOPMENT.md](DEVELOPMENT.md).
5. Review the full history and attribution in `NOTICE`.

Then add the new repository as the intended remote and push only after explicit publication authorization.

## First release

1. Confirm repository validation passes on `main`.
2. Add suitable brand assets through the Home Assistant brands process if HACS default inclusion is planned.
3. Finalize the 0.24.0 changelog date.
4. Create and push annotated tag `v0.24.0`.
5. Review and publish the draft release created by the Release workflow.
6. Test installation through HACS as a custom Integration repository before requesting default inclusion.
