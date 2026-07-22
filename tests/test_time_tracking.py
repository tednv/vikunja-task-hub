"""Tests for persistent task time tracking."""

from __future__ import annotations

import importlib.util
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

MODULE_PATH = (
    Path(__file__).resolve().parents[1] / "custom_components" / "vikunja" / "time_tracking.py"
)
SPEC = importlib.util.spec_from_file_location("vikunja_time_tracking", MODULE_PATH)
assert SPEC and SPEC.loader
time_tracking = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(time_tracking)


class FakeStore:
    def __init__(self, saved=None):
        self.saved = saved

    async def async_load(self):
        return self.saved

    async def async_save(self, value):
        self.saved = value


class Clock:
    def __init__(self):
        self.value = datetime(2026, 7, 22, 12, 0, tzinfo=UTC)

    def now(self):
        return self.value


class TimeTrackingTests(unittest.IsolatedAsyncioTestCase):
    async def test_start_pause_resume_and_restart_restore(self):
        store = FakeStore()
        clock = Clock()
        tracker = time_tracking.TaskTimeTracker(store, clock.now)
        await tracker.async_load()

        await tracker.start("entry", 42)
        clock.value += timedelta(seconds=65)
        await tracker.pause("entry", 42)
        clock.value += timedelta(seconds=30)
        self.assertEqual((await tracker.snapshot("entry"))["42"]["elapsed"], 65)

        restored = time_tracking.TaskTimeTracker(store, clock.now)
        await restored.async_load()
        await restored.start("entry", 42)
        clock.value += timedelta(seconds=5)
        self.assertEqual((await restored.snapshot("entry"))["42"]["elapsed"], 70)

    async def test_done_is_committed_or_restored(self):
        store = FakeStore()
        clock = Clock()
        tracker = time_tracking.TaskTimeTracker(store, clock.now)
        await tracker.async_load()
        await tracker.start("entry", 7)
        clock.value += timedelta(seconds=90)

        await tracker.set_note("entry", 7, "  Drafted the plan  ")
        elapsed, completed_at, previous, pause_at, complete_at, note = await tracker.begin_done(
            "entry", 7
        )
        self.assertEqual(elapsed, 90)
        self.assertEqual(completed_at, clock.value)
        self.assertEqual(note, "Drafted the plan")
        await tracker.restore_after_error("entry", 7, previous, pause_at, complete_at)
        self.assertEqual((await tracker.snapshot("entry"))["7"]["state"], "active")

        await tracker.begin_done("entry", 7)
        await tracker.finish("entry", 7)
        self.assertEqual(await tracker.snapshot("entry"), {})

    async def test_expired_limit_is_restored_as_paused(self):
        clock = Clock()
        started = clock.value
        clock.value += timedelta(minutes=10)
        store = FakeStore(
            {
                "entry": {
                    "42": {
                        "state": "active",
                        "elapsed": 0,
                        "started_at": started.isoformat(),
                        "pause_at": (started + timedelta(minutes=5)).isoformat(),
                    }
                }
            }
        )
        tracker = time_tracking.TaskTimeTracker(store, clock.now)
        await tracker.async_load()

        snapshot = await tracker.snapshot("entry")
        self.assertEqual(snapshot["42"]["state"], "paused")
        self.assertEqual(snapshot["42"]["elapsed"], 300)

    async def test_create_and_schedule_start_remain_paused(self):
        store = FakeStore()
        clock = Clock()
        tracker = time_tracking.TaskTimeTracker(store, clock.now)
        await tracker.async_load()

        await tracker.create("entry", 8)
        self.assertEqual((await tracker.snapshot("entry"))["8"]["state"], "paused")
        start_at = clock.value + timedelta(hours=1)
        await tracker.schedule_start("entry", 8, start_at, limit_seconds=120, complete_seconds=300)
        snapshot = (await tracker.snapshot("entry"))["8"]
        self.assertEqual(snapshot["state"], "paused")
        self.assertEqual(snapshot["start_at"], start_at.isoformat())
        self.assertEqual(snapshot["scheduled_pause_seconds"], 120)
        self.assertEqual(snapshot["scheduled_complete_seconds"], 300)
        await tracker.clear_terminal_schedule("entry", 8, "pause")
        snapshot = (await tracker.snapshot("entry"))["8"]
        self.assertEqual(snapshot["start_at"], start_at.isoformat())
        self.assertIsNone(snapshot["scheduled_pause_seconds"])
        self.assertEqual(snapshot["scheduled_complete_seconds"], 300)
        await tracker.finish("entry", 8)

    async def test_auto_complete_callback_receives_frozen_session(self):
        store = FakeStore()
        clock = Clock()
        completed = []

        async def on_complete(entry_id, task_id, elapsed, completed_at, note):
            completed.append((entry_id, task_id, elapsed, completed_at, note))

        tracker = time_tracking.TaskTimeTracker(store, clock.now, on_complete=on_complete)
        await tracker.async_load()
        await tracker.start("entry", 9, note="Review", complete_seconds=120)
        clock.value += timedelta(seconds=120)
        await tracker._auto_complete("entry", "9", clock.value)

        self.assertEqual(completed, [("entry", 9, 120, clock.value, "Review")])
        self.assertEqual((await tracker.snapshot("entry"))["9"]["state"], "paused")
        await tracker.finish("entry", 9)

    async def test_clear_terminal_schedule_keeps_active_timer_running(self):
        store = FakeStore()
        clock = Clock()
        tracker = time_tracking.TaskTimeTracker(store, clock.now)
        await tracker.async_load()
        await tracker.start("entry", 10, limit_seconds=300, complete_seconds=600)
        clock.value += timedelta(seconds=30)
        first_pause_at = (await tracker.snapshot("entry"))["10"]["pause_at"]
        await tracker.start("entry", 10, complete_seconds=700)
        self.assertEqual((await tracker.snapshot("entry"))["10"]["pause_at"], first_pause_at)

        await tracker.clear_terminal_schedule("entry", 10, "pause")
        snapshot = (await tracker.snapshot("entry"))["10"]
        self.assertEqual(snapshot["state"], "active")
        self.assertEqual(snapshot["elapsed"], 30)
        self.assertIsNone(snapshot["pause_at"])
        self.assertIsNotNone(snapshot["complete_at"])
        await tracker.clear_terminal_schedule("entry", 10, "complete")
        self.assertIsNone((await tracker.snapshot("entry"))["10"]["complete_at"])
        await tracker.finish("entry", 10)

    async def test_auto_pause_then_auto_complete_combination(self):
        store = FakeStore()
        clock = Clock()
        completed = []

        async def on_complete(entry_id, task_id, elapsed, completed_at, note):
            completed.append((task_id, elapsed, completed_at))

        tracker = time_tracking.TaskTimeTracker(store, clock.now, on_complete=on_complete)
        await tracker.async_load()
        await tracker.start("entry", 11, limit_seconds=60, complete_seconds=120)
        clock.value += timedelta(seconds=60)
        await tracker._auto_pause("entry", "11", clock.value)
        snapshot = (await tracker.snapshot("entry"))["11"]
        self.assertEqual(snapshot["state"], "paused")
        self.assertEqual(snapshot["elapsed"], 60)
        self.assertIsNotNone(snapshot["complete_at"])

        clock.value += timedelta(seconds=60)
        await tracker._auto_complete("entry", "11", clock.value)
        self.assertEqual(completed, [(11, 60, clock.value)])
        await tracker.finish("entry", 11)

    async def test_generic_start_pause_stop_schedule(self):
        store = FakeStore()
        clock = Clock()
        completed = []

        async def on_complete(entry_id, task_id, elapsed, completed_at, note):
            completed.append((task_id, elapsed, completed_at, note))

        tracker = time_tracking.TaskTimeTracker(store, clock.now, on_complete=on_complete)
        await tracker.async_load()
        await tracker.create("entry", 12)
        await tracker.set_note("entry", 12, "Focused work")
        for action, offset in (("start", 10), ("pause", 20), ("stop", 30)):
            await tracker.schedule_action(
                "entry", 12, action, clock.value + timedelta(seconds=offset)
            )
        scheduled = (await tracker.snapshot("entry"))["12"]["scheduled_actions"]
        self.assertEqual([item["action"] for item in scheduled], ["start", "pause", "stop"])

        for expected_action in ("start", "pause", "stop"):
            clock.value += timedelta(seconds=10)
            current = (await tracker.snapshot("entry"))["12"]["scheduled_actions"][0]
            self.assertEqual(current["action"], expected_action)
            await tracker._run_scheduled_action("entry", "12", current)
        self.assertEqual(completed, [(12, 10, clock.value, "Focused work")])
        await tracker.finish("entry", 12)

    async def test_cancel_one_generic_schedule(self):
        store = FakeStore()
        clock = Clock()
        tracker = time_tracking.TaskTimeTracker(store, clock.now)
        await tracker.async_load()
        await tracker.create("entry", 13)
        first = await tracker.schedule_action(
            "entry", 13, "start", clock.value + timedelta(minutes=1)
        )
        await tracker.schedule_action("entry", 13, "stop", clock.value + timedelta(minutes=2))
        tracker._cancel_job("entry", 13)
        restored = time_tracking.TaskTimeTracker(store, clock.now)
        await restored.async_load()
        self.assertEqual(len((await restored.snapshot("entry"))["13"]["scheduled_actions"]), 2)
        await restored.cancel_scheduled_action("entry", 13, first)
        scheduled = (await restored.snapshot("entry"))["13"]["scheduled_actions"]
        self.assertEqual([item["action"] for item in scheduled], ["stop"])
        await restored.finish("entry", 13)

    def test_duration_format(self):
        self.assertEqual(time_tracking.format_duration(0), "0s")
        self.assertEqual(time_tracking.format_duration(3665), "1h 1m 5s")


if __name__ == "__main__":
    unittest.main()
