"""Vikunja task-list compatibility operations."""

from __future__ import annotations

from pyvikunja.models.task import Task


def _items(response) -> list[dict]:
    data = response.get("data", []) if isinstance(response, dict) else response
    return data if isinstance(data, list) else []


def _dedupe_tasks(api, items: list[dict]) -> list[Task]:
    unique = {}
    for item in items:
        task_id = item.get("id")
        if task_id is not None and task_id not in unique:
            unique[task_id] = Task(api, item)
    return list(unique.values())


async def _paged_request(api, endpoint: str, **params) -> list[dict]:
    items = []
    page = 1
    while True:
        response = await api._request(
            "GET", endpoint, params={"page": page, "per_page": 50, **params}
        )
        items.extend(_items(response))
        total_pages = int(response.get("headers", {}).get("x-pagination-total-pages", 1))
        if page >= total_pages:
            return items
        page += 1


async def get_project_tasks_with_comment_counts(api, project_id: int) -> list[Task]:
    """Return project tasks with lightweight comment counts expanded."""
    items = await _paged_request(api, f"/projects/{project_id}/tasks", expand="comment_count")
    return _dedupe_tasks(api, items)


async def get_project_dashboard_tasks(api, project_id: int) -> tuple[list[Task], dict]:
    """Return deduplicated tasks and primary Kanban buckets."""
    tasks = await get_project_tasks_with_comment_counts(api, project_id)
    try:
        views_response = await api._request("GET", f"/projects/{project_id}/views")
        views = _items(views_response)
    except Exception:
        return tasks, {}

    kanban_view = next((view for view in views if view.get("view_kind") == "kanban"), None)
    if not kanban_view:
        return tasks, {}

    bucket_items = []
    try:
        bucket_items = await _paged_request(
            api, f"/projects/{project_id}/views/{kanban_view['id']}/tasks"
        )
    except Exception:
        try:
            response = await api._request(
                "GET", f"/projects/{project_id}/views/{kanban_view['id']}/buckets"
            )
            bucket_items = _items(response)
        except Exception:
            return tasks, {}

    buckets = []
    task_buckets = {}
    for bucket in bucket_items:
        bucket_id = bucket.get("id")
        if bucket_id is None:
            continue
        buckets.append(
            {
                "id": int(bucket_id),
                "title": str(bucket.get("title") or ""),
            }
        )
        for item in bucket.get("tasks") or []:
            if item.get("id") is not None:
                task_buckets[int(item["id"])] = int(bucket_id)

    bucket_titles = {bucket["id"]: bucket["title"] for bucket in buckets}
    for task in tasks:
        bucket_id = task_buckets.get(int(task.id))
        task.data["dashboard_bucket_id"] = bucket_id
        task.data["dashboard_bucket_title"] = bucket_titles.get(bucket_id, "")

    return tasks, {
        "id": int(kanban_view["id"]),
        "title": str(kanban_view.get("title") or ""),
        "configuration_mode": str(kanban_view.get("bucket_configuration_mode") or "manual"),
        "default_bucket_id": kanban_view.get("default_bucket_id"),
        "done_bucket_id": kanban_view.get("done_bucket_id"),
        "buckets": buckets,
    }


async def move_task_to_bucket(
    api, project_id: int, view_id: int, bucket_id: int, task_id: int
) -> None:
    """Move a task within one manual Kanban view."""
    await api._request(
        "POST",
        f"/projects/{project_id}/views/{view_id}/buckets/{bucket_id}/tasks",
        data={
            "task_id": task_id,
            "bucket_id": bucket_id,
            "project_view_id": view_id,
        },
    )
