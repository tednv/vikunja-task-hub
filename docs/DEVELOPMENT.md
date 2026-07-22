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
node scripts/build_card_translations.mjs --check
node --check custom_components/vikunja/frontend/vikunja-todo-card-translations.js
node tests/test_card_runtime.mjs
ruff check custom_components/vikunja tests
ruff format --check custom_components/vikunja tests
```

Also run `git diff --check` and inspect staged changes for tokens, private URLs, task content, personal information, and deployment-specific details.

## Adding a language

The dashboard card and the Home Assistant setup flow use separate translation files. A new language should support both surfaces so users receive a consistent experience.

1. Choose the locale code Home Assistant uses for the language. Most languages use the same code in both locations. When Home Assistant uses a regional or script-specific code, follow that convention for the setup translation. For example, Simplified Chinese uses `zh.json` for the card and `zh-Hans.json` for Home Assistant.
2. Copy `custom_components/vikunja/frontend/translations/en.json` to a new card locale file and translate every value. Keep all key names unchanged, retain placeholders exactly, and save the file as UTF-8 JSON.
3. Copy `custom_components/vikunja/translations/en.json` to the matching Home Assistant locale file and translate every setup, reconfiguration, field, success, and error value. Keep its structure identical to `custom_components/vikunja/strings.json`.
4. Add the card locale code to `EXPECTED_LOCALES` in `scripts/build_card_translations.mjs`.
5. Add the Home Assistant locale code to `EXPECTED_SETUP_LOCALES` in `scripts/validate_repository.py`. If the card uses a different code, update `EXPECTED_CARD_LOCALES` there as well.
6. Generate the browser module:

   ```powershell
   node scripts/build_card_translations.mjs
   ```

7. Run the translation and repository checks:

   ```powershell
   node scripts/build_card_translations.mjs --check
   node --check custom_components/vikunja/frontend/vikunja-todo-card-translations.js
   python scripts/validate_repository.py
   ```

Do not edit `frontend/vikunja-todo-card-translations.js` directly; it is generated from the card locale JSON files. English is the fallback language, and validation rejects missing, extra, or empty card strings and setup files whose schema differs from English.

## Home Assistant validation

For backend changes:

1. Back up the installed integration.
2. Install an immutable local commit.
3. Run Home Assistant configuration validation.
4. Prefer a config-entry reload when it can re-import every changed module.
5. Restart Core only for startup-only registrations or when targeted reload is insufficient.
6. Check startup logs and the affected card behavior.

Frontend-only changes should use a new resource version and a cache-bypassing browser reload without restarting Core.

## Privacy-safe screenshots

Repository screenshots must come from `docs/demo.html`, which uses invented projects, tasks, comments, attachments, identities, dates, and the neutral `example.com` Vikunja URL. Its `view` query supports `overview`, `bulk`, `timer`, `editor`, and `editor-comments` release captures.

Never capture screenshots from a live Home Assistant or Vikunja session. Before publishing generated images, visually inspect every frame and verify image metadata does not contain local paths, usernames, hostnames, URLs, or capture-tool details. Replace superseded screenshots so outdated labels do not remain in the public tree.

## Style

- Python follows Home Assistant conventions and is formatted/linted with Ruff.
- Frontend code is dependency-free browser JavaScript and follows the repository's formatting configuration.
- User-visible terms are project, category, task, active, completed, and attachment.
- Keep API compatibility shims isolated from command and UI logic.
