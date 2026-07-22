# Changelog

All notable changes to Vikunja Task Hub are documented here.

The project uses semantic versioning. Dates use ISO 8601 format.

## [Unreleased]

No changes yet.

## [0.32.1] - 2026-07-22

### Added

- Add Home Assistant setup and reconfiguration translations matching all 27 dashboard languages.
- Add priority, progress, color, and label controls to task details, with priority-aware sorting and compact list indicators.
- Add viewport-safe right-click and long-press task actions for completion, priority, color, copying, native sharing, timer creation, and deletion.
- Add collapsed, timestamped task comments plus comment creation and individual deletion in task details.
- Add a bundled language-matched Tips & Documentation page with plain-language guidance for editing, selection, bulk actions, comments, attachments, indicators, and timers.
- Add persistent per-task timers shared across devices and Home Assistant restarts. Start and Pause act immediately; Stop writes a removable dated duration-and-Notes comment; Cancel removes the timer without creating a comment.
- Add any number of persisted future Start, Pause, and Stop actions using minutes, seconds, or an exact timestamp. Each saved action is independently cancellable and runs server-side without an open dashboard.
- Add privacy-safe release screenshots generated from an invented offline workspace covering the overview, bulk actions, task details, attachments, comments, and timer scheduling.

### Changed

- Store card translations in validated per-language JSON dictionaries and generate the browser translation module from those sources.
- Hide zero-selection status until needed and provide one-tap **Cancel** to clear a bulk selection.
- Open the connected Vikunja instance directly to the selected project.
- Keep task color dots and checkboxes aligned, omit color space when no displayed task has a color, and clear colors only through right-click or touch hold.
- Use the device-native color picker instead of hexadecimal entry.
- Keep timer controls inside a compact collapsible **Timer (status and elapsed time)** section; the task context menu exposes only **Add timer** for timer creation.
- Use provider-neutral **Buy me some LLM tokens** support wording.
- Align README, architecture, privacy, development, translation, attachment-capture, and release documentation with the shipped behavior.

### Reliability and safeguards

- Persist timer state and scheduled actions through Home Assistant storage and restore server-side jobs after restart.
- Keep comment bodies out of the normal dashboard payload and fetch them only when comments are expanded.
- Preserve task fields during focused updates and isolate API compatibility adapters for comments, tasks, labels, and attachments.
- Keep context menus inside the visible viewport, including tasks near the lower and right edges.
- Validate exact translation-key parity, setup translation schemas, version declarations, repository metadata, and generated browser translations.

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
