"""Tests for Vikunja assignee compatibility helpers."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "custom_components" / "vikunja" / "assignees.py"
SPEC = importlib.util.spec_from_file_location("vikunja_assignees", MODULE_PATH)
assert SPEC and SPEC.loader
assignees = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(assignees)


class FakeAPI:
    def __init__(self) -> None:
        self.calls = []

    async def _request(self, method, endpoint, params=None, data=None):
        self.calls.append((method, endpoint, params, data))
        if endpoint == "/user":
            return {
                "data": {
                    "id": 8,
                    "name": "Current Person",
                    "username": "current",
                    "email": "private@example.invalid",
                }
            }
        if method == "GET":
            page = params["page"]
            return {
                "data": [
                    {
                        "id": page,
                        "name": "" if page == 1 else "Example Person",
                        "username": "alpha" if page == 1 else "beta",
                        "email": "private@example.invalid",
                    }
                ],
                "headers": {"x-pagination-total-pages": "2"},
            }
        return {"data": {}}


class FakeTask:
    data = {
        "assignees": [
            {
                "id": 4,
                "name": "Example Person",
                "username": "example",
                "email": "private@example.invalid",
            }
        ]
    }


class AssigneeTests(unittest.IsolatedAsyncioTestCase):
    async def test_current_user_is_sanitized(self):
        result = await assignees.get_current_user(FakeAPI())

        self.assertEqual(
            result,
            {"id": 8, "name": "Current Person", "username": "current"},
        )

    async def test_project_users_are_paginated_sorted_and_sanitized(self):
        api = FakeAPI()

        result = await assignees.get_project_users(api, 7)

        self.assertEqual([user["id"] for user in result], [1, 2])
        self.assertTrue(all(set(user) == {"id", "name", "username"} for user in result))
        self.assertEqual([call[2]["page"] for call in api.calls], [1, 2])

    async def test_bulk_assignment_replaces_and_deduplicates_users(self):
        api = FakeAPI()

        await assignees.set_task_assignees(api, 9, [3, 3, 5])

        self.assertEqual(
            api.calls,
            [
                (
                    "POST",
                    "/tasks/9/assignees/bulk",
                    None,
                    {"assignees": [{"id": 3}, {"id": 5}]},
                )
            ],
        )

    def test_task_assignees_do_not_expose_email(self):
        self.assertEqual(
            assignees.task_assignees(FakeTask()),
            [{"id": 4, "name": "Example Person", "username": "example"}],
        )


if __name__ == "__main__":
    unittest.main()
