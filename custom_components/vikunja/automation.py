"""Privacy-conscious Home Assistant automation events."""

from __future__ import annotations

from typing import Any

AUTOMATION_EVENT = "vikunja_task_hub_action"

EVENT_FIELDS = {
    "project_id",
    "task_id",
    "task_ids",
    "label_id",
    "done",
    "due",
    "repeat_after",
    "repeat_mode",
    "priority",
    "percent_done",
    "hex_color",
    "label_ids",
    "delete_tasks",
    "label_operation",
    "attachment_id",
    "comment_id",
    "limit_seconds",
    "complete_seconds",
    "start_at",
    "terminal_mode",
    "timer_action",
    "scheduled_at",
    "schedule_id",
}

DERIVED_EVENT_FIELDS = {
    "task_title",
    "project_title",
    "category_title",
    "created_project_id",
    "previous_project_id",
    "previous_done",
    "done_changed",
    "added_assignee_ids",
    "removed_assignee_ids",
    "changed_fields",
    "affected_task_count",
}

CLEAN_EVENT_TYPES = (
    "assigned_to_me",
    "unassigned_from_me",
    "task_completed",
    "task_reopened",
    "task_created",
    "task_updated",
    "task_deleted",
    "task_moved",
    "project_created",
    "project_deleted",
    "category_created",
    "category_deleted",
    "comment_added",
    "comment_deleted",
    "attachment_added",
    "attachment_deleted",
    "timer_created",
    "timer_started",
    "timer_scheduled",
    "timer_paused",
    "timer_stopped",
    "timer_cancelled",
    "timer_note_updated",
    "timer_schedule_cleared",
    "timer_action_scheduled",
    "timer_action_cancelled",
)

ACTION_EVENT_TYPES = {
    "task_create": "task_created",
    "task_delete": "task_deleted",
    "task_bulk_delete": "task_deleted",
    "project_create": "project_created",
    "project_delete": "project_deleted",
    "label_create": "category_created",
    "label_delete": "category_deleted",
    "comment_create": "comment_added",
    "comment_delete": "comment_deleted",
    "attachment_upload": "attachment_added",
    "attachment_delete": "attachment_deleted",
    "time_create": "timer_created",
    "time_start": "timer_started",
    "time_schedule": "timer_scheduled",
    "time_pause": "timer_paused",
    "time_done": "timer_stopped",
    "time_cancel": "timer_cancelled",
    "time_note": "timer_note_updated",
    "time_clear_terminal": "timer_schedule_cleared",
    "time_schedule_action": "timer_action_scheduled",
    "time_cancel_schedule": "timer_action_cancelled",
}

ENTITY_EVENT_FIELDS = {
    "task_id",
    "task_title",
    "project_id",
    "previous_project_id",
    "created_project_id",
    "project_title",
    "label_id",
    "category_title",
    "attachment_id",
    "comment_id",
    "done",
    "due",
    "priority",
    "percent_done",
    "affected_task_count",
    "timer_action",
    "scheduled_at",
    "schedule_id",
}


def event_data(
    entry_id: str,
    action: str,
    message: dict[str, Any],
    **details: Any,
) -> dict[str, Any]:
    """Build an allowlisted event payload without private free-form content."""
    payload: dict[str, Any] = {
        "entry_id": entry_id,
        "action": action,
        **{field: message[field] for field in EVENT_FIELDS if field in message},
        **{
            field: details[field]
            for field in EVENT_FIELDS | DERIVED_EVENT_FIELDS
            if field in details
        },
    }
    return {key: value for key, value in payload.items() if value is not None}


def fire_events(hass: Any, events: list[dict[str, Any]]) -> None:
    """Publish successful dashboard mutations to the local Home Assistant event bus."""
    for event in events:
        hass.bus.async_fire(AUTOMATION_EVENT, event)


def clean_entity_events(
    action_event: dict[str, Any],
    current_user_id: int | None,
) -> list[tuple[str, dict[str, Any]]]:
    """Translate an internal action into friendly event-entity events."""
    event_types: list[str] = []
    action = action_event.get("action")
    added_ids = action_event.get("added_assignee_ids", [])
    removed_ids = action_event.get("removed_assignee_ids", [])

    if current_user_id is not None and current_user_id in added_ids:
        event_types.append("assigned_to_me")
    if current_user_id is not None and current_user_id in removed_ids:
        event_types.append("unassigned_from_me")
    if action_event.get("done_changed"):
        event_types.append("task_completed" if action_event.get("done") else "task_reopened")
    if (
        action in {"task_update", "task_bulk_update"}
        and action_event.get("project_id") is not None
        and action_event.get("project_id") != action_event.get("previous_project_id")
    ):
        event_types.append("task_moved")

    mapped_type = ACTION_EVENT_TYPES.get(action)
    if mapped_type:
        event_types.append(mapped_type)
    elif action in {"task_update", "task_bulk_update"} and not event_types:
        event_types.append("task_updated")

    attributes = {
        field: action_event[field]
        for field in ENTITY_EVENT_FIELDS
        if action_event.get(field) is not None
    }
    return [(event_type, attributes) for event_type in dict.fromkeys(event_types)]
