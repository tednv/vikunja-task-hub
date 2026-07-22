# Security policy

## Supported versions

Security fixes are applied to the latest published release. Users should update before reporting a problem that may already be resolved.

## Reporting a vulnerability

Use GitHub's private security-advisory reporting for the standalone repository. Do not open a public issue containing exploit details, API tokens, private URLs, task content, or Home Assistant diagnostics.

Include only the minimum information required to reproduce the issue:

- affected version;
- Home Assistant and Vikunja versions;
- a redacted description of the request and response path;
- impact and reproduction steps using neutral sample data;
- any proposed mitigation.

## Security boundaries

- Vikunja API-token permissions determine which Vikunja data and operations are available.
- Home Assistant authenticates dashboard websocket callers.
- Project and category creation/deletion additionally require a Home Assistant administrator session.
- The frontend never receives the configured Vikunja API token.
- Attachments pass through authenticated Home Assistant websocket operations and are stored by Vikunja.
- Strict TLS verification is enabled by default.
