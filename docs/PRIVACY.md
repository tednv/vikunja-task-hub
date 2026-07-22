# Privacy and data handling

Vikunja Task Hub is designed to keep task data within Home Assistant, the configured Vikunja instance, and the user's browser.

## Data processed

The integration processes the Vikunja connection URL and API token, project and label metadata, task content and status, due dates, recurrence, priority, progress, color, comment counts, comments and their displayed author names, task attachments, and per-task elapsed-time state and optional notes. It also checks whether the current Home Assistant websocket user is an administrator for project/label management.

## Storage

- The connection URL, API token, and TLS preference are stored in the Home Assistant config entry.
- Tasks, comments, and attachments remain stored by Vikunja.
- Timer state stores the config-entry ID, task ID, elapsed seconds, status, start timestamp, optional future Start/Pause/Stop action deadlines, opaque local schedule identifiers, and optional user-entered notes in Home Assistant local storage. Stopping a timer writes its duration, date, and notes to Vikunja as a normal deletable comment. Cancelling the timer removes its locally stored state without creating a comment.
- The browser stores only the last selected project under the card's storage key.
- The integration does not create a separate task database, analytics profile, device, or entity registry.

## Network communication

Home Assistant communicates with the configured Vikunja instance. The browser communicates with Home Assistant using its authenticated websocket connection. No telemetry or third-party analytics are included.

## Attachments

Uploads and downloads are proxied through Home Assistant so the browser does not receive the Vikunja API token. Attachment contents may temporarily occupy browser and Home Assistant memory during websocket base64 transport. Individual files are limited to 20 MB.

## Diagnostics and support

Logs, screenshots, task names, descriptions, comments, author names, attachments, instance URLs, tokens, and infrastructure details may be sensitive. Redact them before sharing. Public documentation and bug reports should use neutral placeholders and invented sample data.

Public feature screenshots are generated from the offline sample in `docs/demo.html`; they must never be captured from a live dashboard. Release publication also excludes private checkpoint ancestry, session-history files, agent instructions, work cadence, deployment identifiers, and local environment metadata from both the public tree and reachable Git history.
