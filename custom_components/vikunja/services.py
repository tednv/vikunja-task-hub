"""Home Assistant automation actions for Vikunja Task Hub."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import homeassistant.helpers.config_validation as cv
import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError

from .assignees import set_task_assignees, task_assignees
from .automation import event_data, fire_events
from .const import DOMAIN
from .labels import add_task_label, remove_task_label

ENTRY_ID = vol.Required("entry_id")
TASK_ID = vol.Required("task_id")
PROJECT_ID = vol.Required("project_id")
LABEL_ID = vol.Required("label_id")

SERVICE_SCHEMAS = {
    "create_task": vol.Schema(
        {
            ENTRY_ID: cv.string,
            PROJECT_ID: vol.Coerce(int),
            vol.Required("title"): cv.string,
            vol.Optional("description", default=""): cv.string,
        }
    ),
    "complete_task": vol.Schema({ENTRY_ID: cv.string, TASK_ID: vol.Coerce(int)}),
    "reopen_task": vol.Schema({ENTRY_ID: cv.string, TASK_ID: vol.Coerce(int)}),
    "assign_task_to_me": vol.Schema({ENTRY_ID: cv.string, TASK_ID: vol.Coerce(int)}),
    "unassign_task_from_me": vol.Schema({ENTRY_ID: cv.string, TASK_ID: vol.Coerce(int)}),
    "move_task": vol.Schema(
        {ENTRY_ID: cv.string, TASK_ID: vol.Coerce(int), PROJECT_ID: vol.Coerce(int)}
    ),
    "set_task_due_date": vol.Schema(
        {
            ENTRY_ID: cv.string,
            TASK_ID: vol.Coerce(int),
            vol.Optional("due", default=None): vol.Any(None, cv.datetime),
        }
    ),
    "set_task_priority": vol.Schema(
        {
            ENTRY_ID: cv.string,
            TASK_ID: vol.Coerce(int),
            vol.Required("priority"): vol.All(vol.Coerce(int), vol.Range(min=0, max=5)),
        }
    ),
    "add_task_category": vol.Schema(
        {ENTRY_ID: cv.string, TASK_ID: vol.Coerce(int), LABEL_ID: vol.Coerce(int)}
    ),
    "remove_task_category": vol.Schema(
        {ENTRY_ID: cv.string, TASK_ID: vol.Coerce(int), LABEL_ID: vol.Coerce(int)}
    ),
}


def _entry_data(hass: HomeAssistant, entry_id: str) -> dict[str, Any]:
    """Return one configured connection or raise a user-facing action error."""
    data = hass.data.get(DOMAIN, {}).get(entry_id)
    if not isinstance(data, dict) or "api" not in data:
        raise HomeAssistantError("Vikunja Task Hub connection not found")
    return data


async def _async_handle_service(hass: HomeAssistant, call: ServiceCall) -> None:
    """Apply one supported automation action and emit its activity event."""
    data = _entry_data(hass, call.data["entry_id"])
    api = data["api"]
    service = call.service
    task_id = call.data.get("task_id")

    if service == "create_task":
        raw = await api.create_task(
            call.data["project_id"],
            {"title": call.data["title"].strip(), "description": call.data["description"]},
        )
        task = await api.get_task(raw["id"])
        action_event = event_data(
            data["entry_id"],
            "task_create",
            dict(call.data),
            task_id=task.id,
            task_title=task.title,
        )
    else:
        task = await api.get_task(task_id)
        previous_done = bool(task.done)
        previous_project_id = int(task.project_id)
        previous_assignee_ids = {user["id"] for user in task_assignees(task)}
        message: dict[str, Any] = {"task_id": task_id}
        details: dict[str, Any] = {"task_title": task.title}

        if service in {"complete_task", "reopen_task"}:
            done = service == "complete_task"
            await task.update({"done": done})
            message["done"] = done
            details.update(previous_done=previous_done, done_changed=done != previous_done)
        elif service in {"assign_task_to_me", "unassign_task_from_me"}:
            current_user_id = data.get("current_user_id")
            if current_user_id is None:
                raise HomeAssistantError("The authenticated Vikunja user is unavailable")
            desired_ids = set(previous_assignee_ids)
            if service == "assign_task_to_me":
                desired_ids.add(current_user_id)
            else:
                desired_ids.discard(current_user_id)
            await set_task_assignees(api, task_id, sorted(desired_ids))
            details.update(
                added_assignee_ids=sorted(desired_ids - previous_assignee_ids),
                removed_assignee_ids=sorted(previous_assignee_ids - desired_ids),
            )
        elif service == "move_task":
            await task.update({"project_id": call.data["project_id"]})
            message["project_id"] = call.data["project_id"]
            details["previous_project_id"] = previous_project_id
        elif service == "set_task_due_date":
            due: datetime | None = call.data["due"]
            await task.update({"due_date": due})
            message["due"] = due.isoformat() if due else None
        elif service == "set_task_priority":
            await task.update({"priority": call.data["priority"]})
            message["priority"] = call.data["priority"]
        elif service == "add_task_category":
            await add_task_label(api, task_id, call.data["label_id"])
            message.update(label_id=call.data["label_id"], label_operation="add")
        elif service == "remove_task_category":
            await remove_task_label(api, task_id, call.data["label_id"])
            message.update(label_id=call.data["label_id"], label_operation="remove")
        else:
            raise HomeAssistantError("Unsupported Vikunja Task Hub action")

        action_event = event_data(data["entry_id"], "task_update", message, **details)

    fire_events(hass, [action_event])


def async_register_services(hass: HomeAssistant) -> None:
    """Register Home Assistant automation actions once."""

    async def async_handle(call: ServiceCall) -> None:
        await _async_handle_service(hass, call)

    for service, schema in SERVICE_SCHEMAS.items():
        hass.services.async_register(
            DOMAIN,
            service,
            async_handle,
            schema=schema,
        )
