# Home Assistant automations

Vikunja Task Hub emits a local Home Assistant event after each successful dashboard change. Automations can use this event for notifications, activity logs, lights, announcements, or other Home Assistant actions.

## Recommended: clean event targets

Each Vikunja connection creates a fixed set of Home Assistant event targets. They provide reliable, repeatable automation triggers without creating entities for individual projects or tasks.

In the automation editor, add a **State** trigger and select the target you need. Common examples are **Vikunja Task Hub Assigned to me**, **Vikunja Task Hub Task completed**, and **Vikunja Task Hub Task moved**. Every occurrence updates that target's timestamp, including consecutive events of the same type.

Available targets are:

- `assigned_to_me` or `unassigned_from_me`
- `task_completed`, `task_reopened`, `task_created`, `task_updated`, `task_deleted`, or `task_moved`
- `project_created`, `project_deleted`, `category_created`, or `category_deleted`
- `comment_added`, `comment_deleted`, `attachment_added`, or `attachment_deleted`
- `timer_created`, `timer_started`, `timer_scheduled`, `timer_paused`, `timer_stopped`, `timer_cancelled`, `timer_note_updated`, `timer_schedule_cleared`, `timer_action_scheduled`, or `timer_action_cancelled`

Entity IDs normally follow names such as `event.vikunja_task_hub_assigned_to_me`, but Home Assistant may add a suffix when an ID is already used. Select the entity from the editor instead of assuming its ID.

### Assigned-to-me notification

This trigger requires no Vikunja user ID, event type, condition, or event-list parsing:

```yaml
triggers:
  - trigger: state
    entity_id: event.vikunja_task_hub_assigned_to_me
actions:
  - action: notify.notify
    data:
      title: New Vikunja assignment
      message: >-
        {{ trigger.to_state.attributes.get(
          'task_title',
          'Task ' ~ trigger.to_state.attributes.get('task_id', 'unknown')
        ) }}
mode: queued
```

Replace `notify.notify` with the notification action for the intended phone or service. Entity event attributes can include a task ID/title, current and previous project IDs, due date, priority, progress, category/comment/attachment IDs, or timer details when relevant.

## Automation actions

Vikunja Task Hub also provides normal Home Assistant actions that can update Vikunja from an automation. Add a **Perform action** step and search for **Vikunja Task Hub**. The editor supplies connection, task, project, category, date, and priority fields as appropriate.

| Action | Purpose |
| --- | --- |
| `vikunja.create_task` | Create a task in a project |
| `vikunja.complete_task` | Mark a task complete |
| `vikunja.reopen_task` | Mark a completed task active |
| `vikunja.assign_task_to_me` | Add the authenticated Vikunja user as an assignee |
| `vikunja.unassign_task_from_me` | Remove the authenticated Vikunja user as an assignee |
| `vikunja.move_task` | Move a task to another project |
| `vikunja.set_task_due_date` | Set or clear a due date; naive values use Home Assistant's configured timezone and are sent to Vikunja as RFC 3339 |
| `vikunja.set_task_priority` | Set priority from unset through do now |
| `vikunja.add_task_category` | Add an existing category to a task |
| `vikunja.remove_task_category` | Remove a category without deleting it |

Actions changed through Home Assistant emit the same activity events and refresh open Vikunja Task Hub cards. Destructive task deletion is intentionally not provided as an automation action.

### Example: create a weekday task

This example creates a task every weekday morning. Choose the connection and project in the visual action editor first, then switch to YAML if desired.

```yaml
triggers:
  - trigger: time
    at: "08:00:00"
conditions:
  - condition: time
    weekday:
      - mon
      - tue
      - wed
      - thu
      - fri
actions:
  - action: vikunja.create_task
    data:
      entry_id: YOUR_CONFIG_ENTRY_ID
      project_id: YOUR_PROJECT_ID
      title: Review today's priorities
mode: single
```

The visual action editor selects the connection for `entry_id`; manual YAML users can copy its value from an action first created in the visual editor.

## Advanced: raw event bus

## Event type

Listen for:

```text
vikunja_task_hub_action
```

Use **Developer Tools → Events** in Home Assistant to listen for that event while performing a sample action. This is the easiest way to discover the numeric user, project, task, and category IDs needed by an automation.

Every event contains `action` and `entry_id`. Task-related events normally contain `task_id`; events that already have a task loaded also include `task_title`. Depending on the action, events can include project/category IDs, status, due date, priority, progress, recurrence, color, attachment/comment IDs, timer settings, or task-movement details.

Free-form descriptions, comment bodies, timer notes, filenames, attachment contents, API tokens, and server URLs are never included.

## Raw-event assigned-to-me notification

First find your numeric Vikunja user ID:

1. In Home Assistant, open **Developer Tools → Events**.
2. Enter `vikunja_task_hub_action` under **Listen to events**, then select **Start listening**.
3. In Vikunja Task Hub, assign a disposable task to yourself.
4. In the event output, find your number under `added_assignee_ids`. For example, `[7]` means your Vikunja user ID is `7`.
5. Stop listening, then open **Settings → Automations & scenes → Create automation → Create new automation**.
6. Open the automation menu, choose **Edit in YAML**, and adapt the example below.

Replace `YOUR_VIKUNJA_USER_ID` with your numeric ID and replace `notify.notify` with the notification action for your phone or preferred notification service. This works when you are assigned from either task details or the task quick-action menu.

```yaml
alias: Vikunja - notify when assigned
triggers:
  - trigger: event
    event_type: vikunja_task_hub_action
    event_data:
      action: task_update
conditions:
  - condition: template
    value_template: >-
      {{ YOUR_VIKUNJA_USER_ID in
         trigger.event.data.get('added_assignee_ids', []) }}
actions:
  - action: notify.notify
    data:
      title: New Vikunja assignment
      message: >-
        {{ trigger.event.data.get(
          'task_title',
          'Task ' ~ trigger.event.data.get('task_id', 'unknown')
        ) }}
mode: queued
```

For example, if your observed ID is `7`, the condition begins with `{{ 7 in ... }}`. Save the automation, assign another disposable task to yourself, and confirm the notification arrives.

Use `removed_assignee_ids` instead of `added_assignee_ids` to react when responsibility is removed. The event's `context.user_id` can be `null` because Vikunja Task Hub emits the event from the integration; use the Vikunja ID in `added_assignee_ids` to identify the assignee.

## Notify when a task is completed

Both individual and bulk status changes emit one event per affected task.

```yaml
alias: Vikunja - task completed
triggers:
  - trigger: event
    event_type: vikunja_task_hub_action
conditions:
  - condition: template
    value_template: >-
      {{ trigger.event.data.get('action') in
           ['task_update', 'task_bulk_update']
         and trigger.event.data.get('done_changed', false)
         and trigger.event.data.get('done', false) }}
actions:
  - action: notify.notify
    data:
      title: Vikunja task completed
      message: >-
        {{ trigger.event.data.get(
          'task_title',
          'Task ' ~ trigger.event.data.get('task_id', 'unknown')
        ) }}
mode: queued
```

To detect a completed task being reopened, use the same condition with `not trigger.event.data.get('done', false)`.

## Detect a project move

```yaml
alias: Vikunja - task moved
triggers:
  - trigger: event
    event_type: vikunja_task_hub_action
    event_data:
      action: task_bulk_update
conditions:
  - condition: template
    value_template: >-
      {{ trigger.event.data.get('project_id') is not none
         and trigger.event.data.get('previous_project_id') !=
             trigger.event.data.get('project_id') }}
actions:
  - action: logbook.log
    data:
      name: Vikunja Task Hub
      message: >-
        Task {{ trigger.event.data.get('task_id') }} moved from project
        {{ trigger.event.data.get('previous_project_id') }} to
        {{ trigger.event.data.get('project_id') }}
mode: queued
```

## Useful action values

- Tasks: `task_create`, `task_update`, `task_delete`, `task_bulk_update`, `task_bulk_delete`
- Projects and categories: `project_create`, `project_delete`, `label_create`, `label_delete`
- Attachments and comments: `attachment_upload`, `attachment_delete`, `comment_create`, `comment_delete`
- Timers: `time_create`, `time_start`, `time_schedule`, `time_pause`, `time_done`, `time_cancel`, `time_note`, `time_clear_terminal`, `time_schedule_action`, `time_cancel_schedule`

The read-only attachment download action does not emit an event. A failed dashboard action does not emit a success event.

## Tips

- Start by listening in Developer Tools instead of guessing IDs or fields.
- Filter on both `action` and the relevant change field, such as `done_changed`, to avoid duplicate or unrelated notifications.
- Use `mode: queued` when several tasks may change in a bulk action.
- Use a numeric user ID for assignment automations; display names can change.
- Keep notification text privacy-conscious because notification services may forward messages outside Home Assistant.
- Events are generated for changes made through Vikunja Task Hub. Changes made directly in another Vikunja client are not currently pushed into Home Assistant.
