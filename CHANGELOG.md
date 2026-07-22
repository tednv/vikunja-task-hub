# Changelog

All notable changes to Vikunja Task Hub are documented here.

The project uses semantic versioning. Dates use ISO 8601 format.

## [Unreleased]

### Changed

- Align attachment documentation with the current **Add photo** and **Add video** controls and clarify that direct capture is a browser-controlled HTML media-capture hint.
- Update architecture, privacy, repository-settings, and release-process documentation for the current three-command dashboard API, recurring-task data, protected-main workflow, and detailed release-note requirements.
- Reconcile the public roadmap with the remaining project-renaming, customization, and mobile-focused ideas while keeping completed recurrence and footer work in the feature documentation.

## [0.25.1] - 2026-07-22

### Added

- Add complete card localization that follows Home Assistant's selected language and falls back to English. Supported dictionaries are English, Spanish, French, German, Italian, Greek, Serbian, Hungarian, Romanian, Irish, Russian, Ukrainian, Polish, Dutch, Turkish, Persian, Simplified Chinese, Japanese, Korean, Hindi, Bengali, Urdu, Arabic, Portuguese, Indonesian, Vietnamese, and Thai.
- Localize the main workspace, task editor, attachment actions, confirmation dialogs, formatting controls, local error messages, recurrence controls, and footer links.
- Add recurring-task controls to the detailed editor with daily, weekly, monthly, and custom hour/day/week intervals.
- Let recurring tasks advance from either their scheduled date or their completion date.
- Show a compact `↻` indicator before recurring task titles in the main list.
- Copy selected task titles and descriptions to the clipboard as readable plain text, with localized success feedback.
- Create a new project for selected tasks, move the full selection into it, and select the returned project automatically in one action.
- Add a localized project-support link, About / Repository link, and connected-Vikunja link to the card footer.
- Add a full-width Sections dashboard example while retaining the minimal manual-card configuration.
- Add refreshed privacy-safe branded screenshots covering the overview, bulk actions, footer links, and recurring-task editor.

### Changed

- Keep project and category selectors compact with their related controls positioned alongside them.
- Select projects by the exact ID returned from Vikunja after creation instead of matching by title.
- Use clear **Add photo**, **Add video**, and **Choose files** attachment captions across supported languages.
- Keep recurring schedule editing in the detailed task editor while presenting only the compact recurrence indicator in the main list.
- Update the README with dedicated recurring-task documentation and a complete language list using English and native names.

### Reliability and safeguards

- Protect the default Inbox project from deletion in both the dashboard interface and authenticated backend action handler.
- Load the connected Vikunja web URL through an independent request so URL discovery cannot interrupt project or task loading.
- Validate connected web links as HTTP or HTTPS before displaying them.
- Preserve existing task fields, including recurrence, when updating or completing tasks through the pinned Vikunja client.
- Attempt to restore already moved tasks and remove a newly created project if a bulk create-and-move workflow fails partway through.
- Advance the versioned Lovelace resource whenever frontend behavior changes so Home Assistant clients receive the current card instead of a stale cached asset.

## [0.24.1] - 2026-07-21

- Keep the task-title search field focused while filtering and update the visible task list without rebuilding the card on every keystroke.
- Add privacy-safe sample screenshots and an expanded feature tour to the README.

## [0.24.0] - 2026-07-20

Initial standalone-repository release. It includes the direct dashboard card,
project and category management, task filtering and bulk actions, Markdown task
details, completed-task support, attachments, and native media capture.

This release also rebrands the project as Vikunja Task Hub, focuses the integration
on its direct dashboard experience, isolates attachment and task-label transport,
and introduces maintained validation and release automation.
