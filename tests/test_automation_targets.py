"""Static contracts for Home Assistant automation entities and actions."""

from __future__ import annotations

import ast
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "vikunja"

EXPECTED_SERVICES = {
    "create_task",
    "complete_task",
    "reopen_task",
    "assign_task_to_me",
    "unassign_task_from_me",
    "move_task",
    "set_task_due_date",
    "set_task_priority",
    "add_task_category",
    "remove_task_category",
}


class AutomationTargetTests(unittest.TestCase):
    def test_service_metadata_covers_every_registered_action(self):
        source = (INTEGRATION / "services.py").read_text(encoding="utf-8")
        ast.parse(source)
        metadata = (INTEGRATION / "services.yaml").read_text(encoding="utf-8")
        metadata_services = set(re.findall(r"^([a-z][a-z0-9_]+):$", metadata, re.MULTILINE))

        self.assertEqual(metadata_services, EXPECTED_SERVICES)
        for service in EXPECTED_SERVICES:
            self.assertIn(f'"{service}"', source)

    def test_event_targets_have_no_task_device_plumbing(self):
        source = (INTEGRATION / "event.py").read_text(encoding="utf-8")
        ast.parse(source)

        self.assertIn("VikunjaAutomationTarget", source)
        self.assertIn("for event_type in CLEAN_EVENT_TYPES", source)
        self.assertNotIn("DeviceInfo", source)
        self.assertNotIn("device_info", source)


if __name__ == "__main__":
    unittest.main()
