"""Tests for expanded task-list compatibility helpers."""

from __future__ import annotations

import importlib.util
import sys
import types
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock


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
    def test_due_date_only_uses_home_assistant_timezone(self):
        with mock.patch.object(
            tasks, "ZoneInfo", return_value=timezone(timedelta(hours=-5))
        ) as zone_info:
            self.assertEqual(
                tasks.due_date_to_rfc3339("2030-07-15", "America/Chicago"),
                "2030-07-15T00:00:00-05:00",
            )
        zone_info.assert_called_once_with("America/Chicago")

    def test_naive_due_datetime_uses_home_assistant_timezone(self):
        with mock.patch.object(tasks, "ZoneInfo", return_value=timezone(timedelta(hours=-6))):
            self.assertEqual(
                tasks.due_date_to_rfc3339(datetime(2030, 1, 15, 12, 30), "America/Chicago"),
                "2030-01-15T12:30:00-06:00",
            )

    def test_aware_due_datetime_preserves_its_offset(self):
        value = datetime(2030, 7, 15, 12, 30, tzinfo=timezone(timedelta(hours=2)))

        self.assertEqual(
            tasks.due_date_to_rfc3339(value, "America/Chicago"),
            "2030-07-15T12:30:00+02:00",
        )

    def test_due_date_can_be_cleared(self):
        self.assertIsNone(tasks.due_date_to_rfc3339(None, "America/Chicago"))
        self.assertIsNone(tasks.due_date_to_rfc3339("", "America/Chicago"))

    def test_due_date_rejects_invalid_input(self):
        with self.assertRaisesRegex(ValueError, "valid ISO 8601"):
            tasks.due_date_to_rfc3339("not-a-date", "America/Chicago")

    def test_due_date_update_paths_use_shared_normalizer(self):
        root = Path(__file__).resolve().parents[1] / "custom_components" / "vikunja"
        services = (root / "services.py").read_text(encoding="utf-8")
        dashboard = (root / "dashboard.py").read_text(encoding="utf-8")

        self.assertIn("due_date_to_rfc3339(due, hass.config.time_zone)", services)
        self.assertIn('due_date_to_rfc3339(msg["due"], hass.config.time_zone)', dashboard)

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
