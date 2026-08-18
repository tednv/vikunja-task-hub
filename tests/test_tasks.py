"""Tests for expanded task-list compatibility helpers."""

from __future__ import annotations

import importlib.util
import sys
import types
import unittest
from pathlib import Path


class FakeTask:
    """Minimal replacement for the pinned client's task model."""

    def __init__(self, api, data) -> None:
        self.api = api
        self.data = data
        self.id = data.get("id")


task_module = types.ModuleType("pyvikunja.models.task")
task_module.Task = FakeTask
sys.modules.setdefault("pyvikunja", types.ModuleType("pyvikunja"))
sys.modules.setdefault("pyvikunja.models", types.ModuleType("pyvikunja.models"))
sys.modules["pyvikunja.models.task"] = task_module

MODULE_PATH = Path(__file__).resolve().parents[1] / "custom_components" / "vikunja" / "tasks.py"
SPEC = importlib.util.spec_from_file_location("vikunja_tasks", MODULE_PATH)
assert SPEC and SPEC.loader
tasks = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(tasks)


class FakeAPI:
    def __init__(self) -> None:
        self.params = []

    async def _request(self, _method, _endpoint, params=None):
        self.params.append(params)
        return {
            "data": [{"id": params["page"], "comment_count": params["page"]}],
            "headers": {"x-pagination-total-pages": "2"},
        }


class TaskTests(unittest.IsolatedAsyncioTestCase):
    async def test_comment_counts_are_expanded_on_every_page(self):
        api = FakeAPI()

        result = await tasks.get_project_tasks_with_comment_counts(api, 7)

        self.assertEqual([task.data["comment_count"] for task in result], [1, 2])
        self.assertEqual([params["page"] for params in api.params], [1, 2])
        self.assertTrue(all(params["expand"] == "comment_count" for params in api.params))

    async def test_dashboard_tasks_have_buckets_and_no_duplicates(self):
        class ViewAPI:
            async def _request(self, method, endpoint, params=None, data=None):
                self.last_request = (method, endpoint, data)
                if endpoint.endswith("/projects/4/tasks"):
                    return {
                        "data": [
                            {"id": 9, "title": "Example"},
                            {"id": 9, "title": "Example"},
                        ],
                        "headers": {},
                    }
                if endpoint.endswith("/views"):
                    return {
                        "data": [
                            {
                                "id": 3,
                                "title": "Board",
                                "view_kind": "kanban",
                                "bucket_configuration_mode": "manual",
                            },
                        ],
                        "headers": {},
                    }
                if endpoint.endswith("/views/3/tasks"):
                    return {
                        "data": [{"id": 11, "title": "Doing", "tasks": [{"id": 9}]}],
                        "headers": {},
                    }
                raise AssertionError(endpoint)

        result, view = await tasks.get_project_dashboard_tasks(ViewAPI(), 4)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].data["dashboard_bucket_id"], 11)
        self.assertEqual(result[0].data["dashboard_bucket_title"], "Doing")
        self.assertEqual(view["configuration_mode"], "manual")

    async def test_move_task_uses_view_bucket_endpoint(self):
        class MoveAPI:
            async def _request(self, method, endpoint, params=None, data=None):
                self.request = (method, endpoint, data)
                return {"data": {}, "headers": {}}

        api = MoveAPI()
        await tasks.move_task_to_bucket(api, 4, 3, 11, 9)

        self.assertEqual(
            api.request,
            (
                "POST",
                "/projects/4/views/3/buckets/11/tasks",
                {"task_id": 9, "bucket_id": 11, "project_view_id": 3},
            ),
        )


if __name__ == "__main__":
    unittest.main()
