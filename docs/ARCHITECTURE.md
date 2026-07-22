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

Vikunja remains the source of truth for projects, categories, tasks, and attachments. The card fetches those resources when it loads or completes an action, while Home Assistant provides the authenticated connection and dashboard experience.

## Components

### Integration setup

`custom_components/vikunja/__init__.py` registers integration-wide websocket commands and the frontend resource, then creates one authenticated `VikunjaAPI` client for each config entry.

### Configuration flow

`config_flow.py` validates the Vikunja URL, token, and TLS preference. Tokens are stored in the Home Assistant config entry and are never included in frontend payloads.

### Dashboard API

`dashboard.py` exposes two authenticated websocket commands:

- `vikunja/dashboard/get` returns the projects, categories, tasks, and attachment metadata visible to the configured token.
- `vikunja/dashboard/action` performs task, project, category, bulk, and attachment actions.

Vikunja is the primary data-authorization boundary. Home Assistant administrator status is additionally required for project and category creation/deletion.

### Compatibility adapters

`attachments.py` and `labels.py` contain API operations not exposed as stable high-level methods by the pinned `pyvikunja` release. Keeping these calls isolated makes a future client-library upgrade easier to audit.

### Frontend registration

`frontend/__init__.py` serves the card from a static integration path and maintains a versioned Lovelace resource in storage mode. YAML-managed Lovelace installations must declare the resource manually.

### Dashboard card

`frontend/vikunja-todo-card.js` is a dependency-free custom element. It owns transient UI state such as filters, selection, the open editor, and the last selected project. Persistent project selection uses browser local storage and contains no credentials or task content.

## Data refresh model

The card fetches a complete authorized dashboard payload on initial connection, manual refresh, and after a successful mutation. It does not subscribe to every Home Assistant state update, which avoids unnecessary rerenders and resize loops.

## Compatibility contracts

- Integration domain: `vikunja`
- Card type: `custom:vikunja-todo-card`
- Static resource path: `/vikunja-static/vikunja-todo-card.js`
- Config-entry version: `5`

Changing one of these requires an explicit migration plan.
