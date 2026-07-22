# Development and validation

## Repository layout

```text
custom_components/vikunja/   Home Assistant integration and bundled card
docs/                        Architecture, privacy, release, and session history
.github/workflows/           Repository validation and release automation
```

## Local checks

Run these checks before committing:

```powershell
python -m compileall custom_components/vikunja
python -m json.tool custom_components/vikunja/manifest.json
python -m json.tool custom_components/vikunja/strings.json
python -m json.tool custom_components/vikunja/translations/en.json
python -m json.tool hacs.json
node --check custom_components/vikunja/frontend/vikunja-todo-card.js
ruff check custom_components/vikunja
ruff format --check custom_components/vikunja
```

Also run `git diff --check` and inspect staged changes for tokens, private URLs, task content, personal information, and deployment-specific details.

## Home Assistant validation

For backend changes:

1. Back up the installed integration.
2. Install an immutable local commit.
3. Run Home Assistant configuration validation.
4. Prefer a config-entry reload when it can re-import every changed module.
5. Restart Core only for startup-only registrations or when targeted reload is insufficient.
6. Check startup logs and the affected card behavior.

Frontend-only changes should use a new resource version and a cache-bypassing browser reload without restarting Core.

## Style

- Python follows Home Assistant conventions and is formatted/linted with Ruff.
- Frontend code is dependency-free browser JavaScript and follows the repository's formatting configuration.
- User-visible terms are project, category, task, active, completed, and attachment.
- Keep API compatibility shims isolated from command and UI logic.
