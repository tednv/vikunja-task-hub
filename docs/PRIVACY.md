# Privacy and data handling

Vikunja Task Hub is designed to keep task data within Home Assistant, the configured Vikunja instance, and the user's browser.

## Data processed

The integration processes the Vikunja connection URL and API token, project and category metadata, task content and status, due dates, recurrence settings, and task attachments. It also checks whether the current Home Assistant websocket user is an administrator for project/category management.

## Storage

- The connection URL, API token, and TLS preference are stored in the Home Assistant config entry.
- Tasks and attachments remain stored by Vikunja.
- The browser stores only the last selected project under the card's storage key.
- The integration does not create a separate task database, analytics profile, device, or entity registry.

## Network communication

Home Assistant communicates with the configured Vikunja instance. The browser communicates with Home Assistant using its authenticated websocket connection. No telemetry or third-party analytics are included.

## Attachments

Uploads and downloads are proxied through Home Assistant so the browser does not receive the Vikunja API token. Attachment contents may temporarily occupy browser and Home Assistant memory during websocket base64 transport. Individual files are limited to 20 MB.

## Diagnostics and support

Logs, screenshots, task names, descriptions, attachments, instance URLs, tokens, and infrastructure details may be sensitive. Redact them before sharing. Public documentation and bug reports should use neutral placeholders and invented sample data.
