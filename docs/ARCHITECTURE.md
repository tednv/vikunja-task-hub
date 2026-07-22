# Architecture

## Overview

Vikunja Task Hub is a Home Assistant custom integration that combines a connection/config flow, an authenticated websocket API, and a self-registered custom dashboard card.

```text
Browser card
    │ Home Assistant authenticated websocket
    ▼
Dashboard command layer
    │ shared authenticated async HTTP client
    ▼
Vikunja API
```

Vikunja remains the source of truth for projects, labels, tasks, comments, and attachments. Home Assistant stores only active or paused per-task stopwatch state so elapsed work survives restarts and synchronizes across dashboards. The card fetches Vikunja resources when it loads or completes an action, while Home Assistant provides the authenticated connection and dashboard experience.

## Components

### Integration setup

`custom_components/vikunja/__init__.py` registers integration-wide websocket commands and the frontend resource, then creates one authenticated `VikunjaAPI` client for each config entry.

### Configuration flow

`config_flow.py` validates the Vikunja URL, token, and TLS preference. Tokens are stored in the Home Assistant config entry and are never included in frontend payloads.

### Dashboard API

`dashboard.py` exposes four authenticated websocket commands:

- `vikunja/dashboard/get` returns the projects, labels, tasks, recurrence, priority, progress, color, comment-count, attachment metadata, and current task-stopwatch state visible to the configured connection.
- `vikunja/dashboard/web_url` returns a validated HTTP(S) link to the configured Vikunja web interface independently of task loading.
- `vikunja/dashboard/comments` loads one task's comments on demand.
- `vikunja/dashboard/action` performs task, project, label, bulk, recurrence, priority, progress, color, comment, attachment, and time-tracking actions.

Vikunja is the primary data-authorization boundary. Home Assistant administrator status is additionally required for project and category creation/deletion.

### Compatibility adapters

`attachments.py`, `comments.py`, `labels.py`, and `tasks.py` contain API operations or expanded reads not exposed as stable high-level methods by the pinned `pyvikunja` release. Keeping these calls isolated makes a future client-library upgrade easier to audit.

### Frontend registration

`frontend/__init__.py` serves the card from a static integration path and maintains a versioned Lovelace resource in storage mode. YAML-managed Lovelace installations must declare the resource manually.

`time_tracking.py` maintains independent elapsed-time stopwatches keyed by config entry and task ID. State, including optional notes and an ordered list of future actions, is stored through Home Assistant's storage helper after each transition. Stopping a stopwatch freezes its value, writes the duration and notes to a Vikunja comment, and clears the stored state after that write succeeds. Cancelling clears the stopwatch without creating a comment.

Future Start, Pause, and Stop actions are independent and may be combined in any order. Minutes and Seconds are converted to absolute UTC deadlines when saved; Timestamp is converted from the browser's local selection. Each action has an opaque local identifier so it can be cancelled without changing the stopwatch or other saved actions. Server-side jobs restore from storage after restart and execute without an open dashboard.

### Dashboard card

`frontend/vikunja-todo-card.js` is a dependency-free custom element. It owns transient UI state such as filters, selection, the open editor, and the last selected project. Persistent project selection uses browser local storage and contains no credentials or task content.

Card copy is maintained as named keys in `frontend/translations/*.json`. `scripts/build_card_translations.mjs` validates exact English-key parity and produces the generated `frontend/vikunja-todo-card-translations.js` module imported by the card. Home Assistant setup and reconfiguration copy remains in `translations/*.json`, following Home Assistant's integration translation layout.

## Data refresh model

The card fetches a complete authorized dashboard payload on initial connection, manual refresh, and after a successful mutation. Task-list requests expand only comment counts; comment content is fetched when its task's comments section is opened. The card does not subscribe to every Home Assistant state update, which avoids unnecessary rerenders and resize loops.

## Compatibility contracts

- Integration domain: `vikunja`
- Card type: `custom:vikunja-todo-card`
- Static resource path: `/vikunja-static/vikunja-todo-card.js`
- Config-entry version: `5`

Changing one of these requires an explicit migration plan.
