# Changelog

All notable changes to Vikunja Task Hub are documented here.

The project uses semantic versioning. Dates use ISO 8601 format.

## [Unreleased]

## [0.38.15] - 2026-10-05

### Fixed

- Refresh shared task and timer state when returning to a previously disconnected dashboard view.
- Show newly created and existing timer controls directly beneath tasks in Table view.
- Let Escape close the detailed task editor and confirmation dialogs as well as context and view menus.
- Keep right-click targets in view after Home Assistant's deferred layout and add Escape-key dismissal for task, column, and View Options menus.
- Preserve page and table scroll positions when opening View Options or column menus by right-click or long press.
- Restore Table rendering for tasks with due dates and keep desktop view-button clicks separate from touch long-press options.
- Keep the selected Compact or Table layout consistent across dashboard cards and views while preserving independent project selections.
- Dismiss open task and column context menus when clicking or tapping empty dashboard space outside the card.
- Keep a context-menu task visibly highlighted and preserve page and table scrolling while opening or dismissing its menu.
- Make safe web links in Compact and Table task-description previews directly clickable without opening the task editor.
- Serialize dashboard and automation due-date updates as timezone-aware RFC 3339 values accepted by current Vikunja releases.
- Interpret date-only card values and naive automation date-times in Home Assistant's configured timezone, while preserving explicit offsets and allowing due dates to be cleared.

## [0.38.4] - 2026-08-17

### Added

- Add Kanban bucket display and sorting to Table view, plus bucket assignment from task details and task quick actions for manual Kanban views.
- Add ordered multi-column sorting with numbered precedence indicators and controls to add, remove, reverse, and reprioritize each sort rule.
- Add local column aliases with per-column controls and a conditional **Clear all aliases** action.
- Add appearance settings for custom colors, alternating rows, and blue or green dot matrix report-paper themes.
- Apply card themes to Table view by default, with an optional setting and YAML key to include Compact view.
- Add translated controls and messages for every supported dashboard language.

### Changed

- Replace the internal Position column with the user-facing Kanban Bucket column.
- Keep active and completed tasks in separate Table sections and provide a persistent option to hide completed tasks.
- Let a normal heading click cycle through ascending, descending, and unsorted states, while right-click or long-press opens advanced column and sort controls.
- Allow columns to shrink to 32 pixels, including when a short custom alias is used, while retaining drag-to-resize and numeric width controls.
- Show assignees as normal table-cell text while preserving the compact italic parenthesized presentation in Compact view.

### Fixed

- Deduplicate tasks returned through overlapping Vikunja result sets so assigned tasks appear only once.
- Keep column quick menus anchored and hidden until their final viewport-safe position is known.
- Preserve task fields when changing buckets and treat filter-generated buckets as read-only.

### Using this release

- Click the view button beside Search to switch between Compact and Table. Right-click or long-press it to open View Options.
- In View Options, show or hide columns, reorder them, enter exact widths, adjust title and description line limits, show or hide completed tasks, manage the full sort stack, choose an appearance, or reset the table defaults.
- Drag a table heading to move its column and drag the heading's right edge to resize it. Columns can be reduced to 32 pixels, allowing short headings or aliases such as `Pri`.
- Click a heading to sort ascending, click again for descending, and click a third time to remove that sort. Right-click or long-press a heading to set an alias or add the column to a multi-column sort, then move its sort priority up or down as needed.
- Enable the Bucket column to display and sort by the task's primary Kanban bucket. Move a task from its details or task quick-action menu; filter-generated buckets remain read-only.
- Active and completed tasks stay in separate table sections. Turn off **Show completed tasks** in View Options when only active work should be visible.
- Choose custom colors or a blue or green dot matrix theme under Appearance. Themes apply to Table view by default; enable **Apply theme to Compact view** to use the same appearance in Compact view.
- Card preferences are saved in the browser. Dashboard YAML can also provide theme, Compact-theme behavior, aliases, widths, visible columns, line limits, completed-task visibility, and initial sort settings as documented in the README.

## [0.36.8] - 2026-08-14

### Added

- Add an optional sortable table view while retaining Compact as the default.
- Add columns for title, project, priority, status, due date, assignees, categories, progress, creation time, and Vikunja position.
- Add clear P0 through P5 priority badges and a dedicated column for multiple assignees.
- Add translated table controls for all 27 supported dashboard languages.
- Add persistent View Options for columns, ordering, widths, sorting, and title and description line limits.
- Let users drag headings to reorder columns and drag heading edges to resize them, with equivalent controls available through right-click or long-press.

### Changed

- Place the compact view button beside Search and use it to switch between Compact and Table modes.
- Keep active and completed tasks naturally grouped when no custom sorting is selected.
- Wrap long table titles and descriptions, limit them to three lines by default, and allow limits from one through ten lines.
- Show Project automatically in All Projects while keeping Vikunja position available as an optional sortable column.

### Fixed

- Let users clear an active table sort by clicking its highlighted arrow again.
- Make table widths predictable and expose effective default or saved widths in View Options.
- Add runtime coverage for table configuration, column widths, sorting, assignees, and responsive view behavior.

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
