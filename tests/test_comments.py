"""Tests for task-comment compatibility helpers."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "custom_components" / "vikunja" / "comments.py"
SPEC = importlib.util.spec_from_file_location("vikunja_comments", MODULE_PATH)
assert SPEC and SPEC.loader
comments = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(comments)


class FakeAPI:
    """Return two paginated comment responses."""

    def __init__(self) -> None:
        self.requests = []

    async def _request(self, method, endpoint, params=None, data=None):
        self.requests.append((method, endpoint, params, data))
        if method != "GET":
            return {"data": {}, "headers": {}}
        page = params["page"]
        return {
            "data": [
                {
                    "id": page,
                    "comment": f"Comment {page}",
                    "author": {"username": f"person-{page}"},
                    "created": f"2026-07-2{page}T00:00:00Z",
                }
            ],
            "headers": {"x-pagination-total-pages": "2"},
        }


class CommentTests(unittest.IsolatedAsyncioTestCase):
    async def test_comments_are_paginated_and_sanitized(self):
        api = FakeAPI()

        result = await comments.get_task_comments(api, 42)

        self.assertEqual([item["id"] for item in result], [1, 2])
        self.assertEqual(result[0]["author"], "person-1")
        self.assertEqual(api.requests[0][1], "/tasks/42/comments")
        self.assertEqual(api.requests[0][2]["per_page"], 50)

    async def test_comment_create_and_delete_use_task_scoped_endpoints(self):
        api = FakeAPI()

        await comments.add_task_comment(api, 42, "  A useful note  ")
        await comments.delete_task_comment(api, 42, 9)

        self.assertEqual(
            api.requests[0],
            ("PUT", "/tasks/42/comments", None, {"comment": "A useful note"}),
        )
        self.assertEqual(api.requests[1], ("DELETE", "/tasks/42/comments/9", None, None))

    async def test_empty_comment_is_rejected(self):
        with self.assertRaises(ValueError):
            await comments.add_task_comment(FakeAPI(), 42, "   ")


if __name__ == "__main__":
    unittest.main()
