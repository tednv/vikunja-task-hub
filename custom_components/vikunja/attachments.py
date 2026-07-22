"""Task attachment operations not implemented by pyvikunja."""

from __future__ import annotations

import base64
from typing import Any

MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024


def attachment_metadata(task: Any) -> list[dict[str, Any]]:
    """Return the attachment fields required by the dashboard card."""
    attachments = task.data.get("attachments", []) or []
    return [
        {
            "id": attachment["id"],
            "name": attachment.get("file", {}).get("name", "Attachment"),
            "mime": attachment.get("file", {}).get("mime", "application/octet-stream"),
            "size": attachment.get("file", {}).get("size", 0),
        }
        for attachment in attachments
        if attachment.get("id") is not None
    ]


async def upload_attachments(api: Any, task_id: int, items: list[dict[str, str]]) -> None:
    """Upload one or more base64-encoded files to a Vikunja task."""
    files = []
    for item in items:
        content = base64.b64decode(item["data"], validate=True)
        if len(content) > MAX_ATTACHMENT_SIZE:
            raise ValueError("Each attachment must be 20 MB or smaller")
        files.append(("files", (item["name"], content, item["mime"])))

    if not files:
        raise ValueError("Choose at least one file")

    response = await api.client.request(
        "PUT",
        f"{api.api_base_url}/tasks/{task_id}/attachments",
        headers=api.headers,
        files=files,
    )
    response.raise_for_status()


async def delete_attachment(api: Any, task_id: int, attachment_id: int) -> None:
    """Delete an attachment from a Vikunja task."""
    response = await api.client.request(
        "DELETE",
        f"{api.api_base_url}/tasks/{task_id}/attachments/{attachment_id}",
        headers=api.headers,
    )
    response.raise_for_status()


async def download_attachment(
    api: Any, task_id: int, attachment_id: int, filename: str
) -> dict[str, str]:
    """Download an attachment and encode it for websocket transport."""
    response = await api.client.request(
        "GET",
        f"{api.api_base_url}/tasks/{task_id}/attachments/{attachment_id}",
        headers=api.headers,
    )
    response.raise_for_status()
    return {
        "name": filename,
        "mime": response.headers.get("content-type", "application/octet-stream"),
        "data": base64.b64encode(response.content).decode("ascii"),
    }
