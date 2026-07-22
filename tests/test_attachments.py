"""Tests for Vikunja attachment compatibility helpers."""

from __future__ import annotations

import base64
import importlib.util
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

MODULE_PATH = (
    Path(__file__).resolve().parents[1] / "custom_components" / "vikunja" / "attachments.py"
)
SPEC = importlib.util.spec_from_file_location("vikunja_attachments", MODULE_PATH)
assert SPEC and SPEC.loader
attachments = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(attachments)


class AttachmentMetadataTests(unittest.TestCase):
    """Verify attachment payload normalization."""

    def test_only_card_fields_are_exposed(self) -> None:
        task = SimpleNamespace(
            data={
                "attachments": [
                    {
                        "id": 7,
                        "created_by": {"email": "private@example.invalid"},
                        "file": {
                            "name": "example.txt",
                            "mime": "text/plain",
                            "size": 12,
                        },
                    }
                ]
            }
        )

        self.assertEqual(
            attachments.attachment_metadata(task),
            [
                {
                    "id": 7,
                    "name": "example.txt",
                    "mime": "text/plain",
                    "size": 12,
                }
            ],
        )


class AttachmentRequestTests(unittest.IsolatedAsyncioTestCase):
    """Verify attachment request behavior."""

    async def test_upload_uses_authenticated_client(self) -> None:
        response = SimpleNamespace(raise_for_status=Mock())
        api = SimpleNamespace(
            api_base_url="https://example.invalid/api/v1",
            headers={"Authorization": "Bearer REDACTED"},
            client=SimpleNamespace(request=AsyncMock(return_value=response)),
        )

        await attachments.upload_attachments(
            api,
            5,
            [
                {
                    "name": "example.txt",
                    "mime": "text/plain",
                    "data": base64.b64encode(b"content").decode("ascii"),
                }
            ],
        )

        api.client.request.assert_awaited_once()
        response.raise_for_status.assert_called_once()

    async def test_upload_rejects_oversized_attachment(self) -> None:
        with patch.object(attachments, "MAX_ATTACHMENT_SIZE", 3):
            with self.assertRaisesRegex(ValueError, "20 MB or smaller"):
                await attachments.upload_attachments(
                    SimpleNamespace(),
                    5,
                    [
                        {
                            "name": "large.bin",
                            "mime": "application/octet-stream",
                            "data": base64.b64encode(b"four").decode("ascii"),
                        }
                    ],
                )


if __name__ == "__main__":
    unittest.main()
