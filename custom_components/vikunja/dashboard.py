"""Authenticated websocket API for the Vikunja dashboard card."""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .attachments import (
    attachment_metadata,
    delete_attachment,
    download_attachment,
    upload_attachments,
)
from .const import DOMAIN, LOGGER
from .labels import add_task_label, remove_task_label


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


async def _payload(data: dict[str, Any]) -> dict[str, Any]:
    api = data["api"]
    # Vikunja is the authorization boundary and returns only projects the
    # authenticated user may access.
    project_models = await api.get_projects()
    results = await asyncio.gather(
        api.get_labels(),
        *(api.get_tasks(project.id) for project in project_models),
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
                    "color": label.hex_color,
                }
                for label in labels
            ],
            key=lambda item: item["title"].casefold(),
        ),
        "tasks": tasks,
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
        connection.send_result(msg["id"], await _payload(data))
    except ValueError as err:
        connection.send_error(msg["id"], "vikunja_dashboard_error", str(err))
    except Exception:
        LOGGER.exception("Unable to load the Vikunja Task Hub dashboard")
        connection.send_error(
            msg["id"],
            "vikunja_dashboard_error",
            "Unable to load Vikunja data; check the integration logs",
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
    vol.Optional("label_ids"): [vol.Coerce(int)],
    vol.Optional("delete_tasks", default=False): bool,
    vol.Optional("label_operation"): vol.In({"add", "remove"}),
    vol.Optional("attachment_id"): vol.Coerce(int),
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
            for field in ("title", "description", "done"):
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
        elif action == "project_create":
            await api.create_project({"title": msg["title"].strip()})
        elif action == "project_delete":
            projects, tasks = await _projects_and_tasks(api)
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

        connection.send_result(msg["id"], await _payload(data))
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
    websocket_api.async_register_command(hass, websocket_dashboard_action)
