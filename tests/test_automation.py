"""Tests for Home Assistant automation-event payloads."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "custom_components" / "vikunja" / "automation.py"
SPEC = importlib.util.spec_from_file_location("vikunja_automation", MODULE_PATH)
assert SPEC and SPEC.loader
automation = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(automation)


class FakeBus:
    def __init__(self) -> None:
        self.events = []

    def async_fire(self, event_type, data) -> None:
        self.events.append((event_type, data))


class FakeHass:
    bus = FakeBus()


class AutomationTests(unittest.TestCase):
    def test_event_payload_omits_free_form_private_content(self):
        result = automation.event_data(
            "entry",
            "task_update",
            {
                "task_id": 7,
                "done": True,
                "description": "private description",
                "comment": "private comment",
                "timer_note": "private note",
                "files": [{"name": "private.txt"}],
            },
            done_changed=True,
            task_title="Example task",
            unexpected_private_field="must not escape",
        )

        self.assertNotIn("unexpected_private_field", result)

        self.assertEqual(
            result,
            {
                "entry_id": "entry",
                "action": "task_update",
                "task_id": 7,
                "done": True,
                "done_changed": True,
                "task_title": "Example task",
            },
        )

    def test_events_use_one_documented_event_type(self):
        hass = FakeHass()
        event = {"action": "task_create", "task_id": 4}

        automation.fire_events(hass, [event])

        self.assertEqual(hass.bus.events[-1], (automation.AUTOMATION_EVENT, event))

    def test_details_can_supply_allowlisted_task_identifiers(self):
        result = automation.event_data(
            "entry",
            "task_create",
            {"title": "not included"},
            task_id=9,
            project_id=3,
        )

        self.assertEqual(result["task_id"], 9)
        self.assertEqual(result["project_id"], 3)

    def test_assignment_to_current_user_has_clean_event_type(self):
        events = automation.clean_entity_events(
            {
                "action": "task_update",
                "task_id": 9,
                "task_title": "Example task",
                "added_assignee_ids": [7],
                "removed_assignee_ids": [],
                "done_changed": False,
            },
            current_user_id=7,
        )

        self.assertEqual(
            events,
            [("assigned_to_me", {"task_id": 9, "task_title": "Example task"})],
        )

    def test_one_action_can_emit_completion_and_movement_targets(self):
        events = automation.clean_entity_events(
            {
                "action": "task_bulk_update",
                "task_id": 9,
                "done": True,
                "done_changed": True,
                "project_id": 4,
                "previous_project_id": 3,
            },
            current_user_id=None,
        )

        self.assertEqual(
            [event_type for event_type, _ in events],
            ["task_completed", "task_moved"],
        )

    def test_unrelated_user_assignment_becomes_general_update(self):
        events = automation.clean_entity_events(
            {
                "action": "task_update",
                "task_id": 9,
                "added_assignee_ids": [8],
            },
            current_user_id=7,
        )

        self.assertEqual(events[0][0], "task_updated")


if __name__ == "__main__":
    unittest.main()
