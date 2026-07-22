"""Vikunja task-comment operations."""

from __future__ import annotations

from typing import Any


async def add_task_comment(api: Any, task_id: int, comment: str) -> None:
    """Add a non-empty comment to a task."""
    text = comment.strip()
    if not text:
        raise ValueError("Comment cannot be empty")
    await api._request("PUT", f"/tasks/{task_id}/comments", data={"comment": text})


async def delete_task_comment(api: Any, task_id: int, comment_id: int) -> None:
    """Delete one comment from a task."""
    await api._request("DELETE", f"/tasks/{task_id}/comments/{comment_id}")


async def get_task_comments(api: Any, task_id: int) -> list[dict[str, Any]]:
    """Return a task's comments through the authenticated Vikunja client."""
    comments = []
    page = 1
    while True:
        response = await api._request(
            "GET",
            f"/tasks/{task_id}/comments",
            params={"page": page, "per_page": 50},
        )
        comments.extend(response.get("data", []) or [])
        total_pages = int(response.get("headers", {}).get("x-pagination-total-pages", 1))
        if page >= total_pages:
            break
        page += 1
    return [
        {
            "id": comment.get("id"),
            "comment": str(comment.get("comment") or ""),
            "created": comment.get("created"),
            "author": str(
                (comment.get("author") or {}).get("name")
                or (comment.get("author") or {}).get("username")
                or ""
            ),
        }
        for comment in comments
        if isinstance(comment, dict)
    ]
