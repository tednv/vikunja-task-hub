"""Persistent per-task elapsed-time tracking."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4


def _now() -> datetime:
    return datetime.now(UTC)


class TaskTimeTracker:
    """Store restart-safe stopwatch state for Vikunja tasks."""

    def __init__(
        self,
        store: Any,
        now: Callable[[], datetime] = _now,
        on_change: Callable[[str, int], None] | None = None,
        on_complete: Callable[[str, int, int, datetime, str], Awaitable[None]] | None = None,
    ) -> None:
        self._store = store
        self._now = now
        self._on_change = on_change
        self._on_complete = on_complete
        self._records: dict[str, dict[str, dict[str, Any]]] = {}
        self._lock = asyncio.Lock()
        self._jobs: dict[tuple[str, str, str], asyncio.Task] = {}

    async def async_load(self) -> None:
        """Load saved stopwatch records once during integration setup."""
        saved = await self._store.async_load()
        if isinstance(saved, dict):
            self._records = saved
            changed = False
            now = self._now()
            for entry_id, records in self._records.items():
                for task_id, record in records.items():
                    if record.get("state") == "finishing":
                        record.update(
                            state="paused",
                            started_at=None,
                            pause_at=None,
                            complete_at=None,
                        )
                        changed = True
                    start_at = record.get("start_at")
                    if record.get("state") == "paused" and start_at:
                        deadline = datetime.fromisoformat(start_at)
                        if deadline > now:
                            self._schedule_start(entry_id, task_id, deadline)
                            continue
                        record.update(
                            state="active", started_at=deadline.isoformat(), start_at=None
                        )
                        self._set_terminal_deadline(record, deadline)
                        changed = True
                    pause_at = record.get("pause_at")
                    if record.get("state") == "active" and pause_at:
                        deadline = datetime.fromisoformat(pause_at)
                        if deadline <= now:
                            record.update(
                                state="paused",
                                elapsed=self._elapsed(record, deadline),
                                started_at=None,
                                pause_at=None,
                            )
                            changed = True
                        else:
                            self._schedule_pause(entry_id, task_id, deadline)
                    complete_at = record.get("complete_at")
                    if record.get("state") in {"active", "paused"} and complete_at:
                        self._schedule_complete(
                            entry_id, task_id, datetime.fromisoformat(complete_at)
                        )
                    for scheduled in record.get("scheduled_actions", []):
                        self._schedule_action_job(entry_id, task_id, scheduled)
            if changed:
                await self._store.async_save(self._records)

    def _entry(self, entry_id: str) -> dict[str, dict[str, Any]]:
        return self._records.setdefault(entry_id, {})

    def _elapsed(self, record: dict[str, Any], now: datetime) -> int:
        elapsed = max(0, int(record.get("elapsed", 0)))
        started_at = record.get("started_at")
        if record.get("state") == "active" and started_at:
            pause_at = record.get("pause_at")
            complete_at = record.get("complete_at")
            deadlines = [
                datetime.fromisoformat(value) for value in (pause_at, complete_at) if value
            ]
            end = min([now, *deadlines])
            elapsed += max(0, int((end - datetime.fromisoformat(started_at)).total_seconds()))
        return elapsed

    def _cancel_job(self, entry_id: str, task_id: int | str, kind: str | None = None) -> None:
        keys = [
            key
            for key in self._jobs
            if key[:2] == (entry_id, str(task_id)) and (kind is None or key[2] == kind)
        ]
        for key in keys:
            job = self._jobs.pop(key)
            if job is not asyncio.current_task():
                job.cancel()

    def _schedule_pause(self, entry_id: str, task_id: int | str, deadline: datetime) -> None:
        self._cancel_job(entry_id, task_id, "pause")
        self._jobs[(entry_id, str(task_id), "pause")] = asyncio.create_task(
            self._auto_pause(entry_id, str(task_id), deadline)
        )

    def _schedule_complete(self, entry_id: str, task_id: int | str, deadline: datetime) -> None:
        self._cancel_job(entry_id, task_id, "complete")
        self._jobs[(entry_id, str(task_id), "complete")] = asyncio.create_task(
            self._auto_complete(entry_id, str(task_id), deadline)
        )

    def _schedule_start(self, entry_id: str, task_id: int | str, deadline: datetime) -> None:
        self._cancel_job(entry_id, task_id, "start")
        self._jobs[(entry_id, str(task_id), "start")] = asyncio.create_task(
            self._auto_start(entry_id, str(task_id), deadline)
        )

    def _schedule_action_job(
        self, entry_id: str, task_id: int | str, scheduled: dict[str, Any]
    ) -> None:
        schedule_id = str(scheduled["id"])
        kind = f"action:{schedule_id}"
        self._cancel_job(entry_id, task_id, kind)
        self._jobs[(entry_id, str(task_id), kind)] = asyncio.create_task(
            self._run_scheduled_action(entry_id, str(task_id), scheduled)
        )

    async def _run_scheduled_action(
        self, entry_id: str, task_id: str, scheduled: dict[str, Any]
    ) -> None:
        schedule_id = str(scheduled["id"])
        kind = f"action:{schedule_id}"
        deadline = datetime.fromisoformat(str(scheduled["at"]))
        completion: tuple[int, str] | None = None
        try:
            await asyncio.sleep(max(0, (deadline - self._now()).total_seconds()))
            async with self._lock:
                record = self._entry(entry_id).get(task_id)
                if not record:
                    return
                actions = record.get("scheduled_actions", [])
                current = next(
                    (item for item in actions if str(item.get("id")) == schedule_id), None
                )
                if not current:
                    return
                action = current.get("action")
                if action == "start" and record.get("state") != "active":
                    record.update(state="active", started_at=deadline.isoformat())
                elif action == "pause" and record.get("state") == "active":
                    record.update(
                        state="paused",
                        elapsed=self._elapsed(record, deadline),
                        started_at=None,
                    )
                elif action == "stop":
                    elapsed = self._elapsed(record, deadline)
                    note = str(record.get("note") or "").strip()
                    record.update(
                        state="paused",
                        elapsed=elapsed,
                        started_at=None,
                        pause_at=None,
                        complete_at=None,
                    )
                    completion = (elapsed, note)
                record["scheduled_actions"] = [
                    item for item in actions if str(item.get("id")) != schedule_id
                ]
                await self._store.async_save(self._records)
            if completion and self._on_complete:
                await self._on_complete(
                    entry_id, int(task_id), completion[0], deadline, completion[1]
                )
            if self._on_change:
                self._on_change(entry_id, int(task_id))
        finally:
            key = (entry_id, task_id, kind)
            current_job = self._jobs.get(key)
            if current_job is asyncio.current_task():
                self._jobs.pop(key, None)

    def _set_terminal_deadline(self, record: dict[str, Any], started_at: datetime) -> None:
        legacy_seconds = record.pop("scheduled_seconds", None)
        legacy_mode = record.pop("scheduled_mode", None)
        if legacy_seconds and legacy_mode:
            record[f"scheduled_{legacy_mode}_seconds"] = legacy_seconds
        record["pause_at"] = None
        record["complete_at"] = None
        for mode in ("pause", "complete"):
            seconds = record.pop(f"scheduled_{mode}_seconds", None)
            if seconds:
                record[f"{mode}_at"] = (started_at + timedelta(seconds=int(seconds))).isoformat()

    async def _auto_start(self, entry_id: str, task_id: str, deadline: datetime) -> None:
        try:
            await asyncio.sleep(max(0, (deadline - self._now()).total_seconds()))
            async with self._lock:
                record = self._entry(entry_id).get(task_id)
                if not record or record.get("start_at") != deadline.isoformat():
                    return
                record.update(state="active", started_at=deadline.isoformat(), start_at=None)
                self._set_terminal_deadline(record, deadline)
                pause_at = record.get("pause_at")
                complete_at = record.get("complete_at")
                await self._store.async_save(self._records)
            if pause_at:
                self._schedule_pause(entry_id, task_id, datetime.fromisoformat(pause_at))
            if complete_at:
                self._schedule_complete(entry_id, task_id, datetime.fromisoformat(complete_at))
            if self._on_change:
                self._on_change(entry_id, int(task_id))
        finally:
            key = (entry_id, task_id, "start")
            current = self._jobs.get(key)
            if current is asyncio.current_task():
                self._jobs.pop(key, None)

    async def _auto_pause(self, entry_id: str, task_id: str, deadline: datetime) -> None:
        try:
            await asyncio.sleep(max(0, (deadline - self._now()).total_seconds()))
            async with self._lock:
                record = self._entry(entry_id).get(task_id)
                if (
                    not record
                    or record.get("state") != "active"
                    or record.get("pause_at") != deadline.isoformat()
                ):
                    return
                record.update(
                    state="paused",
                    elapsed=self._elapsed(record, deadline),
                    started_at=None,
                    pause_at=None,
                )
                await self._store.async_save(self._records)
            if self._on_change:
                self._on_change(entry_id, int(task_id))
        finally:
            key = (entry_id, task_id, "pause")
            current = self._jobs.get(key)
            if current is asyncio.current_task():
                self._jobs.pop(key, None)

    async def _auto_complete(self, entry_id: str, task_id: str, deadline: datetime) -> None:
        try:
            await asyncio.sleep(max(0, (deadline - self._now()).total_seconds()))
            async with self._lock:
                record = self._entry(entry_id).get(task_id)
                if (
                    not record
                    or record.get("state") not in {"active", "paused"}
                    or record.get("complete_at") != deadline.isoformat()
                ):
                    return
                elapsed = self._elapsed(record, deadline)
                note = str(record.get("note") or "").strip()
                record.update(
                    state="paused",
                    elapsed=elapsed,
                    started_at=None,
                    pause_at=None,
                    complete_at=None,
                )
                await self._store.async_save(self._records)
            if self._on_complete:
                await self._on_complete(entry_id, int(task_id), elapsed, deadline, note)
            if self._on_change:
                self._on_change(entry_id, int(task_id))
        finally:
            key = (entry_id, task_id, "complete")
            current = self._jobs.get(key)
            if current is asyncio.current_task():
                self._jobs.pop(key, None)

    async def snapshot(self, entry_id: str) -> dict[str, dict[str, Any]]:
        """Return current task stopwatch states with live elapsed seconds."""
        async with self._lock:
            now = self._now()
            return {
                task_id: {
                    "state": record["state"],
                    "elapsed": self._elapsed(record, now),
                    "pause_at": record.get("pause_at"),
                    "complete_at": record.get("complete_at"),
                    "start_at": record.get("start_at"),
                    "scheduled_mode": record.get("scheduled_mode"),
                    "scheduled_pause_seconds": record.get("scheduled_pause_seconds"),
                    "scheduled_complete_seconds": record.get("scheduled_complete_seconds"),
                    "scheduled_actions": [
                        dict(item) for item in record.get("scheduled_actions", [])
                    ],
                    "note": str(record.get("note") or ""),
                }
                for task_id, record in self._entry(entry_id).items()
            }

    async def create(self, entry_id: str, task_id: int) -> None:
        """Create a paused stopwatch without starting elapsed time."""
        async with self._lock:
            self._entry(entry_id).setdefault(str(task_id), {"state": "paused", "elapsed": 0})
            await self._store.async_save(self._records)

    async def schedule_action(
        self, entry_id: str, task_id: int, action: str, deadline: datetime
    ) -> str:
        """Persist one future Start, Pause, or Stop transition."""
        if action not in {"start", "pause", "stop"}:
            raise ValueError("Unknown scheduled timer action")
        if deadline <= self._now():
            raise ValueError("Scheduled action must be in the future")
        scheduled = {"id": uuid4().hex, "action": action, "at": deadline.isoformat()}
        async with self._lock:
            record = self._entry(entry_id).get(str(task_id))
            if not record:
                raise ValueError("No time has been tracked for this task")
            record.setdefault("scheduled_actions", []).append(scheduled)
            record["scheduled_actions"].sort(key=lambda item: str(item["at"]))
            await self._store.async_save(self._records)
        self._schedule_action_job(entry_id, task_id, scheduled)
        return str(scheduled["id"])

    async def cancel_scheduled_action(self, entry_id: str, task_id: int, schedule_id: str) -> None:
        """Cancel one saved future transition without changing the stopwatch."""
        async with self._lock:
            record = self._entry(entry_id).get(str(task_id))
            if not record:
                raise ValueError("No time has been tracked for this task")
            record["scheduled_actions"] = [
                item
                for item in record.get("scheduled_actions", [])
                if str(item.get("id")) != schedule_id
            ]
            await self._store.async_save(self._records)
        self._cancel_job(entry_id, task_id, f"action:{schedule_id}")

    async def start(
        self,
        entry_id: str,
        task_id: int,
        limit_seconds: int | None = None,
        note: str | None = None,
        complete_seconds: int | None = None,
    ) -> None:
        """Start or resume a task stopwatch."""
        new_pause_deadline = (
            self._now() + timedelta(seconds=limit_seconds) if limit_seconds else None
        )
        async with self._lock:
            records = self._entry(entry_id)
            record = records.setdefault(str(task_id), {"state": "paused", "elapsed": 0})
            if record.get("state") != "active":
                record.update(state="active", started_at=self._now().isoformat())
            if note is not None:
                record["note"] = note.strip()
            record["start_at"] = None
            record.pop("scheduled_seconds", None)
            record.pop("scheduled_mode", None)
            record.pop("scheduled_pause_seconds", None)
            record.pop("scheduled_complete_seconds", None)
            existing_pause_at = record.get("pause_at")
            final_pause_at = (
                new_pause_deadline.isoformat() if new_pause_deadline else existing_pause_at
            )
            record["pause_at"] = final_pause_at
            new_complete_deadline = (
                self._now() + timedelta(seconds=complete_seconds) if complete_seconds else None
            )
            existing_complete_at = record.get("complete_at")
            final_complete_at = (
                new_complete_deadline.isoformat() if new_complete_deadline else existing_complete_at
            )
            record["complete_at"] = final_complete_at
            await self._store.async_save(self._records)
        for kind in ("start", "pause", "complete"):
            self._cancel_job(entry_id, task_id, kind)
        if final_pause_at:
            self._schedule_pause(entry_id, task_id, datetime.fromisoformat(final_pause_at))
        if final_complete_at:
            self._schedule_complete(entry_id, task_id, datetime.fromisoformat(final_complete_at))

    async def schedule_start(
        self,
        entry_id: str,
        task_id: int,
        start_at: datetime,
        limit_seconds: int | None = None,
        complete_seconds: int | None = None,
        note: str | None = None,
    ) -> None:
        """Schedule a paused stopwatch to start at an absolute time."""
        if start_at <= self._now():
            raise ValueError("Scheduled start must be in the future")
        async with self._lock:
            record = self._entry(entry_id).setdefault(
                str(task_id), {"state": "paused", "elapsed": 0}
            )
            record.update(state="paused", started_at=None, pause_at=None, complete_at=None)
            record["start_at"] = start_at.isoformat()
            if note is not None:
                record["note"] = note.strip()
            record.pop("scheduled_mode", None)
            record.pop("scheduled_seconds", None)
            record["scheduled_pause_seconds"] = limit_seconds
            record["scheduled_complete_seconds"] = complete_seconds
            await self._store.async_save(self._records)
        self._cancel_job(entry_id, task_id)
        self._schedule_start(entry_id, task_id, start_at)

    async def pause(self, entry_id: str, task_id: int, note: str | None = None) -> None:
        """Pause a running task stopwatch."""
        async with self._lock:
            record = self._entry(entry_id).get(str(task_id))
            if not record or record.get("state") != "active":
                return
            if note is not None:
                record["note"] = note.strip()
            record.update(
                state="paused",
                elapsed=self._elapsed(record, self._now()),
                started_at=None,
                pause_at=None,
            )
            await self._store.async_save(self._records)
        self._cancel_job(entry_id, task_id, "pause")

    async def clear_terminal_schedule(self, entry_id: str, task_id: int, mode: str) -> None:
        """Remove automatic pause/completion while preserving timer activity or auto-start."""
        async with self._lock:
            record = self._entry(entry_id).get(str(task_id))
            if not record:
                raise ValueError("No time has been tracked for this task")
            if mode not in {"pause", "complete"}:
                raise ValueError("Unknown automatic timer action")
            record[f"{mode}_at"] = None
            record.pop(f"scheduled_{mode}_seconds", None)
            if record.get("scheduled_mode") == mode:
                record.pop("scheduled_mode", None)
                record.pop("scheduled_seconds", None)
            await self._store.async_save(self._records)
        self._cancel_job(entry_id, task_id, mode)

    async def begin_done(
        self, entry_id: str, task_id: int
    ) -> tuple[int, datetime, str, str | None, str | None, str]:
        """Freeze a stopwatch while its completion comment is written."""
        async with self._lock:
            record = self._entry(entry_id).get(str(task_id))
            if not record:
                raise ValueError("No time has been tracked for this task")
            now = self._now()
            previous_state = str(record.get("state") or "paused")
            previous_pause_at = record.get("pause_at")
            previous_complete_at = record.get("complete_at")
            note = str(record.get("note") or "").strip()
            elapsed = self._elapsed(record, now)
            record.update(
                state="finishing",
                elapsed=elapsed,
                started_at=None,
                pause_at=None,
                complete_at=None,
            )
            await self._store.async_save(self._records)
        self._cancel_job(entry_id, task_id)
        return elapsed, now, previous_state, previous_pause_at, previous_complete_at, note

    async def set_note(self, entry_id: str, task_id: int, note: str) -> None:
        """Update details attached to an existing task stopwatch."""
        async with self._lock:
            record = self._entry(entry_id).get(str(task_id))
            if not record:
                raise ValueError("No time has been tracked for this task")
            record["note"] = note.strip()
            await self._store.async_save(self._records)

    async def finish(self, entry_id: str, task_id: int) -> None:
        """Remove a stopwatch after its completion comment succeeds."""
        async with self._lock:
            self._entry(entry_id).pop(str(task_id), None)
            await self._store.async_save(self._records)
        self._cancel_job(entry_id, task_id)

    async def restore_after_error(
        self,
        entry_id: str,
        task_id: int,
        previous_state: str,
        previous_pause_at: str | None = None,
        previous_complete_at: str | None = None,
    ) -> None:
        """Restore a frozen stopwatch if its completion comment fails."""
        async with self._lock:
            record = self._entry(entry_id).get(str(task_id))
            if not record or record.get("state") != "finishing":
                return
            record["state"] = "active" if previous_state == "active" else "paused"
            record["started_at"] = self._now().isoformat() if previous_state == "active" else None
            record["pause_at"] = previous_pause_at if previous_state == "active" else None
            record["complete_at"] = previous_complete_at
            await self._store.async_save(self._records)
        if previous_state == "active" and previous_pause_at:
            self._schedule_pause(entry_id, task_id, datetime.fromisoformat(previous_pause_at))
        if previous_complete_at:
            self._schedule_complete(entry_id, task_id, datetime.fromisoformat(previous_complete_at))


def format_duration(seconds: int) -> str:
    """Return a compact human-readable duration."""
    seconds = max(0, int(seconds))
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    parts = []
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    if seconds or not parts:
        parts.append(f"{seconds}s")
    return " ".join(parts)
