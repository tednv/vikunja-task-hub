"""Vikunja task-list compatibility operations."""

from __future__ import annotations

from pyvikunja.models.task import Task


async def get_project_tasks_with_comment_counts(api, project_id: int) -> list[Task]:
    """Return project tasks with lightweight comment counts expanded."""
    tasks = []
    page = 1
    while True:
        response = await api._request(
            "GET",
            f"/projects/{project_id}/tasks",
            params={"page": page, "per_page": 20, "expand": "comment_count"},
        )
        tasks.extend(Task(api, item) for item in response.get("data", []) or [])
        total_pages = int(response.get("headers", {}).get("x-pagination-total-pages", 1))
        if page >= total_pages:
            return tasks
        page += 1
