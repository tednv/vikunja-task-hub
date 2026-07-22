"""Authenticated websocket API for the Vikunja dashboard card."""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .attachments import (
    attachment_metadata,
    delete_attachment,
    download_attachment,
    upload_attachments,
)
from .comments import add_task_comment, delete_task_comment, get_task_comments
from .const import DOMAIN, LOGGER
from .labels import add_task_label, remove_task_label
from .tasks import get_project_tasks_with_comment_counts
from .time_tracking import TaskTimeTracker, format_duration

TIME_TRACKING_EVENT = "vikunja_time_tracking_updated"


def _integration_data(hass: HomeAssistant, entry_id: str | None) -> dict[str, Any]:
    entries = hass.data.get(DOMAIN, {})
    if entry_id:
        data = entries.get(entry_id)
        if data:
            return data
        raise ValueError("Vikunja integration entry not found")

    candidates = [value for value in entries.values() if isinstance(value, dict) and "api" in value]
    if len(candidates) != 1:
        raise ValueError("Specify a Vikunja integration entry")
    return candidates[0]


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _hex_color(value: Any) -> str:
    color = str(value or "").removeprefix("#")
    return (
        color
        if len(color) == 6 and all(character in "0123456789abcdefABCDEF" for character in color)
        else ""
    )


async def _projects_and_tasks(api) -> tuple[list, list]:
    projects = await api.get_projects()
    task_groups = await asyncio.gather(*(api.get_tasks(project.id) for project in projects))
    return projects, [task for group in task_groups for task in group]


def _inbox_project(projects: list, excluded_project_id: int | None = None):
    return next(
        (
            project
            for project in projects
            if project.id != excluded_project_id and project.title.strip().casefold() == "inbox"
        ),
        None,
    )


def _is_inbox_project(project) -> bool:
    return project.title.strip().casefold() == "inbox"


def _time_tracker(hass: HomeAssistant) -> TaskTimeTracker:
    tracker = hass.data.get(DOMAIN, {}).get("time_tracker")
    if not isinstance(tracker, TaskTimeTracker):
        raise ValueError("Task time tracking is unavailable")
    return tracker


async def async_complete_scheduled_timer(
    hass: HomeAssistant,
    entry_id: str,
    task_id: int,
    elapsed: int,
    completed_at: datetime,
    timer_note: str,
) -> None:
    """Write and finalize a server-scheduled timer completion."""
    try:
        data = _integration_data(hass, entry_id)
        local_date = completed_at.astimezone(ZoneInfo(hass.config.time_zone)).date().isoformat()
        comment = f"Worked on task for {format_duration(elapsed)} on {local_date}."
        if timer_note:
            comment = f"{comment} Notes: {timer_note}"
        await add_task_comment(data["api"], task_id, comment)
        await _time_tracker(hass).finish(entry_id, task_id)
    except Exception:
        LOGGER.exception("Unable to write a scheduled timer completion comment")


async def _payload(hass: HomeAssistant, data: dict[str, Any]) -> dict[str, Any]:
    api = data["api"]
    # Vikunja is the authorization boundary and returns only projects the
    # authenticated user may access.
    project_models = await api.get_projects()
    results = await asyncio.gather(
        api.get_labels(),
        *(get_project_tasks_with_comment_counts(api, project.id) for project in project_models),
    )
    labels = results[0]
    dashboard_tasks = [task for project_tasks in results[1:] for task in project_tasks]
    projects = [{"id": project.id, "title": project.title} for project in project_models]
    tasks = [
        {
            "id": task.id,
            "project_id": task.project_id,
            "title": task.title,
            "description": task.description or "",
            "done": task.done,
            "due": _iso(task.due_date),
            "created": _iso(task.created),
            "repeat_after": int(task.data.get("repeat_after") or 0),
            "repeat_mode": int(task.data.get("repeat_mode") or 0),
            "priority": int(task.data.get("priority") or 0),
            "percent_done": float(task.data.get("percent_done") or 0),
            "hex_color": _hex_color(task.data.get("hex_color")),
            "comment_count": int(task.data.get("comment_count") or 0),
            "labels": [label.id for label in task.labels],
            "attachments": attachment_metadata(task),
        }
        for task in dashboard_tasks
    ]
    return {
        "projects": sorted(projects, key=lambda item: item["title"].casefold()),
        "labels": sorted(
            [
                {
                    "id": label.id,
                    "title": label.title,
                    "color": _hex_color(label.hex_color),
                }
                for label in labels
            ],
            key=lambda item: item["title"].casefold(),
        ),
        "tasks": tasks,
        "time_tracking": await _time_tracker(hass).snapshot(data["entry_id"]),
    }


@websocket_api.websocket_command(
    {
        vol.Required("type"): "vikunja/dashboard/get",
        vol.Optional("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_get_dashboard(hass, connection, msg) -> None:
    """Return projects, labels, and tasks for the direct dashboard card."""
    try:
        data = _integration_data(hass, msg.get("entry_id"))
        connection.send_result(msg["id"], await _payload(hass, data))
    except ValueError as err:
        connection.send_error(msg["id"], "vikunja_dashboard_error", str(err))
    except Exception:
        LOGGER.exception("Unable to load the Vikunja Task Hub dashboard")
        connection.send_error(
            msg["id"],
            "vikunja_dashboard_error",
            "Unable to load Vikunja data; check the integration logs",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "vikunja/dashboard/web_url",
        vol.Optional("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_get_web_url(hass, connection, msg) -> None:
    """Return the connected Vikunja web-interface URL independently of task data."""
    try:
        data = _integration_data(hass, msg.get("entry_id"))
        web_url = str(getattr(data["api"], "web_ui_link", ""))
        parsed = urlparse(web_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Vikunja web-interface URL is unavailable")
        connection.send_result(msg["id"], {"url": web_url})
    except ValueError as err:
        connection.send_error(msg["id"], "vikunja_web_url_error", str(err))
    except Exception:
        LOGGER.exception("Unable to provide the Vikunja web-interface URL")
        connection.send_error(
            msg["id"],
            "vikunja_web_url_error",
            "Vikunja web-interface URL is unavailable",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "vikunja/dashboard/comments",
        vol.Required("task_id"): vol.Coerce(int),
        vol.Optional("entry_id"): str,
    }
)
@websocket_api.async_response
async def websocket_get_comments(hass, connection, msg) -> None:
    """Return comments for one task without expanding the main dashboard payload."""
    try:
        data = _integration_data(hass, msg.get("entry_id"))
        comments = await get_task_comments(data["api"], msg["task_id"])
        connection.send_result(msg["id"], {"comments": comments})
    except ValueError as err:
        connection.send_error(msg["id"], "vikunja_comments_error", str(err))
    except Exception:
        LOGGER.exception("Unable to load Vikunja task comments")
        connection.send_error(
            msg["id"],
            "vikunja_comments_error",
            "Unable to load comments; check permissions and integration logs",
        )


ACTION_SCHEMA = {
    vol.Required("type"): "vikunja/dashboard/action",
    vol.Required("action"): vol.In(
        {
            "task_create",
            "task_update",
            "task_delete",
            "task_bulk_update",
            "task_bulk_delete",
            "project_create",
            "project_delete",
            "label_create",
            "label_delete",
            "attachment_upload",
            "attachment_download",
            "attachment_delete",
            "comment_create",
            "comment_delete",
            "time_start",
            "time_create",
            "time_schedule",
            "time_pause",
            "time_done",
            "time_cancel",
            "time_note",
            "time_clear_terminal",
            "time_schedule_action",
            "time_cancel_schedule",
        }
    ),
    vol.Optional("entry_id"): str,
    vol.Optional("project_id"): vol.Coerce(int),
    vol.Optional("task_id"): vol.Coerce(int),
    vol.Optional("task_ids"): [vol.Coerce(int)],
    vol.Optional("label_id"): vol.Coerce(int),
    vol.Optional("title"): str,
    vol.Optional("description"): str,
    vol.Optional("done"): bool,
    vol.Optional("due"): vol.Any(None, str),
    vol.Optional("repeat_after"): vol.All(vol.Coerce(int), vol.Range(min=0)),
    vol.Optional("repeat_mode"): vol.In({0, 1, 2}),
    vol.Optional("priority"): vol.All(vol.Coerce(int), vol.Range(min=0, max=5)),
    vol.Optional("percent_done"): vol.All(vol.Coerce(float), vol.Range(min=0, max=1)),
    vol.Optional("hex_color"): vol.Match(r"^(?:|[0-9A-Fa-f]{6})$"),
    vol.Optional("label_ids"): [vol.Coerce(int)],
    vol.Optional("delete_tasks", default=False): bool,
    vol.Optional("label_operation"): vol.In({"add", "remove"}),
    vol.Optional("attachment_id"): vol.Coerce(int),
    vol.Optional("comment_id"): vol.Coerce(int),
    vol.Optional("comment"): str,
    vol.Optional("limit_seconds"): vol.All(vol.Coerce(int), vol.Range(min=60, max=604800)),
    vol.Optional("complete_seconds"): vol.All(vol.Coerce(int), vol.Range(min=60, max=604800)),
    vol.Optional("start_at"): str,
    vol.Optional("timer_note"): vol.All(str, vol.Length(max=500)),
    vol.Optional("terminal_mode"): vol.In({"pause", "complete"}),
    vol.Optional("timer_action"): vol.In({"start", "pause", "stop"}),
    vol.Optional("scheduled_at"): str,
    vol.Optional("schedule_id"): str,
    vol.Optional("files"): [
        {
            vol.Required("name"): str,
            vol.Optional("mime", default="application/octet-stream"): str,
            vol.Required("data"): str,
        }
    ],
}


@websocket_api.websocket_command(ACTION_SCHEMA)
@websocket_api.async_response
async def websocket_dashboard_action(hass, connection, msg) -> None:
    """Perform an authenticated Vikunja dashboard mutation."""
    try:
        data = _integration_data(hass, msg.get("entry_id"))
        api = data["api"]
        action = msg["action"]
        created_project_id = None
        time_tracking_changed = False

        if action in {"project_create", "project_delete", "label_create", "label_delete"}:
            if not connection.user.is_admin:
                connection.send_error(msg["id"], "unauthorized", "Administrator access required")
                return

        if action == "task_create":
            raw = await api.create_task(
                msg["project_id"],
                {"title": msg["title"].strip(), "description": msg.get("description", "")},
            )
            task = await api.get_task(raw["id"])
            for label_id in msg.get("label_ids", []):
                await add_task_label(api, task.id, label_id)
            if msg.get("label_ids"):
                await api.get_task(task.id)
        elif action == "task_update":
            task = await api.get_task(msg["task_id"])
            update = {}
            for field in (
                "title",
                "description",
                "done",
                "repeat_after",
                "repeat_mode",
                "priority",
                "percent_done",
                "hex_color",
            ):
                if field in msg:
                    update[field] = msg[field]
            if "due" in msg:
                update["due_date"] = msg["due"] or None
            await task.update(update)
            if "label_ids" in msg:
                desired_labels = set(msg["label_ids"])
                current_labels = {label.id for label in task.labels}
                for label_id in desired_labels - current_labels:
                    await add_task_label(api, task.id, label_id)
                for label_id in current_labels - desired_labels:
                    await remove_task_label(api, task.id, label_id)
        elif action == "task_delete":
            await api.delete_task(msg["task_id"])
            await _time_tracker(hass).finish(data["entry_id"], msg["task_id"])
            time_tracking_changed = True
        elif action == "task_bulk_update":
            for task_id in msg.get("task_ids", []):
                task = await api.get_task(task_id)
                update = {}
                if "project_id" in msg:
                    update["project_id"] = msg["project_id"]
                if "done" in msg:
                    update["done"] = msg["done"]
                if update:
                    await task.update(update)
                if "label_operation" in msg:
                    current_labels = {label.id for label in task.labels}
                    selected_labels = set(msg.get("label_ids", []))
                    if "label_id" in msg:
                        selected_labels.add(msg["label_id"])
                    for label_id in selected_labels:
                        if msg["label_operation"] == "add" and label_id not in current_labels:
                            await add_task_label(api, task.id, label_id)
                        elif msg["label_operation"] == "remove" and label_id in current_labels:
                            await remove_task_label(api, task.id, label_id)
        elif action == "task_bulk_delete":
            for task_id in msg.get("task_ids", []):
                await api.delete_task(task_id)
                await _time_tracker(hass).finish(data["entry_id"], task_id)
            time_tracking_changed = bool(msg.get("task_ids"))
        elif action == "project_create":
            tasks_to_move = []
            for task_id in msg.get("task_ids", []):
                task = await api.get_task(task_id)
                tasks_to_move.append((task, task.project_id))
            created_project = await api.create_project({"title": msg["title"].strip()})
            created_project_id = (
                created_project.get("id")
                if isinstance(created_project, dict)
                else created_project.id
            )
            moved_tasks = []
            try:
                for task, original_project_id in tasks_to_move:
                    await task.update({"project_id": created_project_id})
                    moved_tasks.append((task, original_project_id))
            except Exception:
                for task, original_project_id in reversed(moved_tasks):
                    try:
                        await task.update({"project_id": original_project_id})
                    except Exception:
                        LOGGER.exception("Unable to restore a task after project creation failed")
                try:
                    await api.delete_project(created_project_id)
                except Exception:
                    LOGGER.exception("Unable to remove a project after task movement failed")
                raise
        elif action == "project_delete":
            projects, tasks = await _projects_and_tasks(api)
            selected_project = next(
                (project for project in projects if project.id == msg["project_id"]),
                None,
            )
            if selected_project is None:
                raise ValueError("Project not found")
            if _is_inbox_project(selected_project):
                raise ValueError("Inbox is the default task project and cannot be deleted")
            affected_tasks = [task for task in tasks if task.project_id == msg["project_id"]]
            if not msg["delete_tasks"] and affected_tasks:
                inbox = _inbox_project(projects, msg["project_id"])
                if inbox is None:
                    raise ValueError("Inbox project not found; tasks were not changed")
                for task in affected_tasks:
                    await task.update({"project_id": inbox.id})
            await api.delete_project(msg["project_id"])
        elif action == "label_create":
            await api.create_label({"title": msg["title"].strip()})
        elif action == "label_delete":
            _, tasks = await _projects_and_tasks(api)
            affected_tasks = [
                task for task in tasks if msg["label_id"] in {label.id for label in task.labels}
            ]
            if msg["delete_tasks"]:
                for task in affected_tasks:
                    await api.delete_task(task.id)
            await api.delete_label(msg["label_id"])
        elif action == "attachment_upload":
            await upload_attachments(api, msg["task_id"], msg.get("files", []))
        elif action == "attachment_delete":
            await delete_attachment(api, msg["task_id"], msg["attachment_id"])
        elif action == "attachment_download":
            connection.send_result(
                msg["id"],
                await download_attachment(
                    api,
                    msg["task_id"],
                    msg["attachment_id"],
                    msg.get("title", "attachment"),
                ),
            )
            return
        elif action == "comment_create":
            await add_task_comment(api, msg["task_id"], msg.get("comment", ""))
        elif action == "comment_delete":
            await delete_task_comment(api, msg["task_id"], msg["comment_id"])
        elif action == "time_create":
            await _time_tracker(hass).create(data["entry_id"], msg["task_id"])
            time_tracking_changed = True
        elif action == "time_start":
            await _time_tracker(hass).start(
                data["entry_id"],
                msg["task_id"],
                msg.get("limit_seconds"),
                msg.get("timer_note"),
                msg.get("complete_seconds"),
            )
            time_tracking_changed = True
        elif action == "time_schedule":
            start_at = datetime.fromisoformat(msg["start_at"])
            if start_at.tzinfo is None:
                raise ValueError("Scheduled start must include a time zone")
            await _time_tracker(hass).schedule_start(
                data["entry_id"],
                msg["task_id"],
                start_at,
                msg.get("limit_seconds"),
                msg.get("complete_seconds"),
                msg.get("timer_note"),
            )
            time_tracking_changed = True
        elif action == "time_pause":
            await _time_tracker(hass).pause(data["entry_id"], msg["task_id"], msg.get("timer_note"))
            time_tracking_changed = True
        elif action == "time_done":
            tracker = _time_tracker(hass)
            if "timer_note" in msg:
                await tracker.set_note(data["entry_id"], msg["task_id"], msg["timer_note"])
            (
                elapsed,
                completed_at,
                previous_state,
                previous_pause_at,
                previous_complete_at,
                timer_note,
            ) = await tracker.begin_done(data["entry_id"], msg["task_id"])
            local_date = completed_at.astimezone(ZoneInfo(hass.config.time_zone)).date().isoformat()
            comment = f"Worked on task for {format_duration(elapsed)} on {local_date}."
            if timer_note:
                comment = f"{comment} Notes: {timer_note}"
            try:
                await add_task_comment(api, msg["task_id"], comment)
            except Exception:
                await tracker.restore_after_error(
                    data["entry_id"],
                    msg["task_id"],
                    previous_state,
                    previous_pause_at,
                    previous_complete_at,
                )
                raise
            await tracker.finish(data["entry_id"], msg["task_id"])
            time_tracking_changed = True
        elif action == "time_cancel":
            await _time_tracker(hass).finish(data["entry_id"], msg["task_id"])
            time_tracking_changed = True
        elif action == "time_note":
            await _time_tracker(hass).set_note(
                data["entry_id"], msg["task_id"], msg.get("timer_note", "")
            )
            time_tracking_changed = True
        elif action == "time_clear_terminal":
            await _time_tracker(hass).clear_terminal_schedule(
                data["entry_id"], msg["task_id"], msg["terminal_mode"]
            )
            time_tracking_changed = True
        elif action == "time_schedule_action":
            scheduled_at = datetime.fromisoformat(msg["scheduled_at"])
            if scheduled_at.tzinfo is None:
                raise ValueError("Scheduled action must include a time zone")
            await _time_tracker(hass).schedule_action(
                data["entry_id"], msg["task_id"], msg["timer_action"], scheduled_at
            )
            if "timer_note" in msg:
                await _time_tracker(hass).set_note(
                    data["entry_id"], msg["task_id"], msg["timer_note"]
                )
            time_tracking_changed = True
        elif action == "time_cancel_schedule":
            await _time_tracker(hass).cancel_scheduled_action(
                data["entry_id"], msg["task_id"], msg["schedule_id"]
            )
            time_tracking_changed = True

        result = await _payload(hass, data)
        if created_project_id is not None:
            result["created_project_id"] = created_project_id
        connection.send_result(msg["id"], result)
        if time_tracking_changed:
            hass.bus.async_fire(
                TIME_TRACKING_EVENT,
                {
                    "entry_id": data["entry_id"],
                    "task_id": msg.get("task_id"),
                    "task_ids": msg.get("task_ids", []),
                },
            )
    except ValueError as err:
        connection.send_error(msg["id"], "vikunja_dashboard_error", str(err))
    except Exception:
        LOGGER.exception("A Vikunja Task Hub action failed")
        connection.send_error(
            msg["id"],
            "vikunja_dashboard_error",
            "Vikunja rejected the action; check permissions and integration logs",
        )


def async_register_dashboard_commands(hass: HomeAssistant) -> None:
    """Register direct-card websocket commands once."""
    websocket_api.async_register_command(hass, websocket_get_dashboard)
    websocket_api.async_register_command(hass, websocket_get_web_url)
    websocket_api.async_register_command(hass, websocket_get_comments)
    websocket_api.async_register_command(hass, websocket_dashboard_action)
