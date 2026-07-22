"""Vikunja task-label relationship operations."""

from __future__ import annotations

from typing import Any


async def add_task_label(api: Any, task_id: int, label_id: int) -> None:
    """Add a label to a task."""
    await api._request("PUT", f"/tasks/{task_id}/labels", data={"label_id": label_id})


async def remove_task_label(api: Any, task_id: int, label_id: int) -> None:
    """Remove a label from a task."""
    await api._request("DELETE", f"/tasks/{task_id}/labels/{label_id}")
