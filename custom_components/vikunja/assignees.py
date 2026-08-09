"""Vikunja task-assignee compatibility operations."""

from __future__ import annotations

from typing import Any


def user_metadata(user: dict[str, Any]) -> dict[str, Any] | None:
    """Return only the non-sensitive user fields required by the dashboard."""
    if not isinstance(user, dict) or user.get("id") is None:
        return None
    return {
        "id": int(user["id"]),
        "name": str(user.get("name") or ""),
        "username": str(user.get("username") or ""),
    }


def task_assignees(task: Any) -> list[dict[str, Any]]:
    """Return sanitized assignees embedded in a task response."""
    return [
        metadata
        for user in (task.data.get("assignees", []) or [])
        if (metadata := user_metadata(user)) is not None
    ]


async def get_current_user(api: Any) -> dict[str, Any] | None:
    """Return the authenticated Vikunja user without sensitive account fields."""
    response = await api._request("GET", "/user")
    user = response.get("data", response) if isinstance(response, dict) else None
    return user_metadata(user)


async def get_project_users(api: Any, project_id: int) -> list[dict[str, Any]]:
    """Return all users eligible for assignment in one project."""
    users: dict[int, dict[str, Any]] = {}
    page = 1
    while True:
        response = await api._request(
            "GET",
            f"/projects/{project_id}/projectusers",
            params={"page": page, "per_page": 50},
        )
        for user in response.get("data", []) or []:
            metadata = user_metadata(user)
            if metadata is not None:
                users[metadata["id"]] = metadata
        total_pages = int(response.get("headers", {}).get("x-pagination-total-pages", 1))
        if page >= total_pages:
            return sorted(
                users.values(),
                key=lambda item: (item["name"] or item["username"]).casefold(),
            )
        page += 1


async def set_task_assignees(api: Any, task_id: int, user_ids: list[int]) -> None:
    """Replace a task's assignees through Vikunja's bulk relationship endpoint."""
    await api._request(
        "POST",
        f"/tasks/{task_id}/assignees/bulk",
        data={"assignees": [{"id": user_id} for user_id in dict.fromkeys(user_ids)]},
    )
