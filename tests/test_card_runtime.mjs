import assert from "node:assert/strict";
import fs from "node:fs";

const localValues = new Map();
globalThis.localStorage = {
  get length() { return localValues.size; },
  clear: () => localValues.clear(),
  getItem: (key) => localValues.get(String(key)) ?? null,
  key: (index) => [...localValues.keys()][index] ?? null,
  removeItem: (key) => localValues.delete(String(key)),
  setItem: (key, value) => localValues.set(String(key), String(value)),
};

globalThis.DOMParser = class {
  parseFromString(value) {
    return { body: { textContent: String(value).replace(/<[^>]*>/g, "") } };
  }
};
globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
};

const registry = new Map();
globalThis.HTMLElement = class {
  attachShadow() {
    const root = {
      innerHTML: "",
      querySelector: () => null,
      querySelectorAll: () => [],
    };
    this.shadowRoot = root;
    return root;
  }
};
globalThis.customElements = {
  define: (name, constructor) => registry.set(name, constructor),
  get: (name) => registry.get(name),
};
globalThis.window = {
  addEventListener() {},
  customCards: [],
  innerHeight: 768,
  innerWidth: 1024,
  scrollX: 0,
  scrollY: 0,
  scrollTo(x, y) {
    this.scrollX = x;
    this.scrollY = y;
  },
  removeEventListener() {},
};

await import("../custom_components/vikunja/frontend/vikunja-todo-card.js");

const Card = registry.get("vikunja-todo-card");
const card = new Card();
card._hass = { locale: { language: "en" } };
card._vikunjaUrl = "https://example.com/vikunja";
card._selectedProject = "12";
card._data = {
  projects: [{ id: 12, title: "Example" }],
  current_user: { id: 21, name: "Example Person", username: "example" },
  project_users: {
    "12": [
      { id: 21, name: "Example Person", username: "example" },
      { id: 22, name: "Second Person", username: "second" },
    ],
  },
  project_bucket_views: {
    "12": {
      id: 30,
      title: "Board",
      configuration_mode: "manual",
      buckets: [
        { id: 40, title: "To do" },
        { id: 41, title: "In progress" },
      ],
    },
  },
  labels: [{ id: 3, title: "Planning", color: "336699" }],
  tasks: [
    {
      id: 7,
      project_id: 12,
      title: "Synthetic task",
      description: "",
      done: false,
      created: "2026-07-22T00:00:00Z",
      repeat_after: 0,
      repeat_mode: 0,
      priority: 3,
      bucket_id: 41,
      bucket_title: "In progress",
      percent_done: 0.4,
      hex_color: "224466",
      comment_count: 2,
      assignees: [{ id: 21, name: "Example Person", username: "example" }],
      labels: [3],
      attachments: [],
    },
  ],
  time_tracking: { "7": { state: "active", elapsed: 65, note: "Drafted the plan", scheduled_actions: [{ id: "example", action: "pause", at: "2026-07-22T13:00:00Z" }] } },
};

assert.equal(card._projectVikunjaUrl(), "https://example.com/vikunja/projects/12");
card._data.tasks.push({ ...card._data.tasks[0] });
assert.equal(card._projectTasks().length, 1);
card._data.tasks.pop();

const row = card._taskRow(card._data.tasks[0]);
assert.match(row, /comment-toggle/);
assert.match(row, /Comments \(2\)/);
assert.match(row, /Planning/);
assert.match(row, /width:40%/);
assert.match(row, /background:#224466/);
assert.match(row, /<span class="assignee-list"><em class="assignee-names">\(Example Person\)<\/em><\/span>Synthetic task/);
const linkedTask = {
  ...card._data.tasks[0],
  description:
    "Read https://example.com/guide, [open notes](https://example.com/notes) and www.example.org. javascript:alert(1)",
};
const linkedCompactRow = card._taskRow(linkedTask);
assert.match(linkedCompactRow, /href="https:\/\/example\.com\/guide"/);
assert.match(linkedCompactRow, />open notes<\/a>/);
assert.match(linkedCompactRow, /href="https:\/\/www\.example\.org"/);
assert.match(linkedCompactRow, /javascript:alert\(1\)/);
assert.doesNotMatch(linkedCompactRow, /href="javascript:/);
assert.doesNotMatch(linkedCompactRow, /<button[^>]*class="body"[^>]*>[\s\S]*<a /);
const linkedTableRow = card._tableTaskRow(linkedTask, ["title"]);
assert.match(linkedTableRow, /href="https:\/\/example\.com\/guide"/);
assert.match(linkedTableRow, /class="body table-title-main"/);
const dueTableRow = card._tableTaskRow(
  { ...card._data.tasks[0], due: "2026-10-06T12:00:00Z" },
  ["title", "due"],
);
assert.match(dueTableRow, /class="table-due-cell"[^>]*>[^<]+<\/td>/);
assert.doesNotMatch(dueTableRow, /2026-10-06T12:00:00Z/);
const interactionSource = fs.readFileSync(
  new URL("../custom_components/vikunja/frontend/vikunja-todo-card.js", import.meta.url),
  "utf8",
);
assert.match(interactionSource, /event\.button !== 0 \|\| event\.pointerType === "mouse"/);
card._render();
assert.match(card.shadowRoot.innerHTML, /class="my-tasks-toggle [^"]*"[^>]*>My Tasks \(1\)<\/button>/);
assert.doesNotMatch(card.shadowRoot.innerHTML, /class="task-table"/);
assert.ok(
  card.shadowRoot.innerHTML.indexOf('class="task-filter"') <
    card.shadowRoot.innerHTML.indexOf('class="view-options-toggle'),
);
assert.match(card.shadowRoot.innerHTML, /aria-label="View options: Compact"[^>]*>☰<\/button>/);
card.setConfig({ view_mode: "table" });
assert.match(card.shadowRoot.innerHTML, /class="task-table"/);
assert.match(card.shadowRoot.innerHTML, /aria-label="View options: Table"[^>]*>▦<\/button>/);
localStorage.clear();
localStorage.setItem(
  "vikunja-todo-card:preferences:wide-card",
  JSON.stringify({ view_mode: "table" }),
);
localStorage.setItem(
  "vikunja-todo-card:preferences:simple-card",
  JSON.stringify({ view_mode: "compact" }),
);
const sharedViewCard = new Card();
sharedViewCard.setConfig({ storage_key: "simple-card" });
assert.equal(sharedViewCard._viewMode, "table");
assert.equal(localStorage.getItem("vikunja-todo-card:view-mode"), "table");
let sharedViewRenders = 0;
sharedViewCard._renderPreservingScroll = () => { sharedViewRenders += 1; };
sharedViewCard._applySharedViewMode("compact");
assert.equal(sharedViewCard._viewMode, "compact");
assert.equal(sharedViewRenders, 1);
sharedViewCard._rememberPreferences();
assert.equal(localStorage.getItem("vikunja-todo-card:view-mode"), "compact");
const lockedViewCard = new Card();
lockedViewCard.setConfig({ show_view_toggle: false, view_mode: "table" });
lockedViewCard._applySharedViewMode("compact");
assert.equal(lockedViewCard._viewMode, "table");
localStorage.clear();
card._viewMode = "table";
assert.match(card.shadowRoot.innerHTML, /data-priority="3"[^>]*>P3<\/span>/);
assert.match(card.shadowRoot.innerHTML, /class="table-bucket-cell"[^>]*>In progress<\/td>/);
assert.match(card.shadowRoot.innerHTML, /<h3>Active \(<span class="active-table-count">1<\/span>\)<\/h3>/);
assert.match(card.shadowRoot.innerHTML, /class="completed table-completed"/);
card._showCompleted = false;
card._render();
assert.doesNotMatch(card.shadowRoot.innerHTML, /class="completed table-completed"/);
card._showCompleted = true;
card._render();
assert.match(card.shadowRoot.innerHTML, /class="table-assignees">Example Person<\/span>/);
assert.doesNotMatch(card.shadowRoot.innerHTML, /class="assignee-list table-assignees">\(Example Person\)/);
assert.match(card.shadowRoot.innerHTML, /Planning/);
assert.match(card.shadowRoot.innerHTML, /data-sort-cycle="due"/);
assert.match(card.shadowRoot.innerHTML, /data-sort-cycle="progress"/);
assert.match(card.shadowRoot.innerHTML, /data-sort-cycle="priority"/);
assert.match(card.shadowRoot.innerHTML, /class="table-sort-indicator"[^>]*>▼<\/span>/);
assert.equal((card.shadowRoot.innerHTML.match(/class="table-sort-indicator"/g) ?? []).length, 2);
assert.doesNotMatch(card.shadowRoot.innerHTML, /data-sort-cycle="position"|table-position/);
card._viewOptionsOpen = true;
card._render();
assert.match(card.shadowRoot.innerHTML, /class="dialog view-options-dialog"/);
assert.match(card.shadowRoot.innerHTML, /data-view-column="priority" checked/);
assert.match(card.shadowRoot.innerHTML, /class="view-options-sort"/);
assert.match(card.shadowRoot.innerHTML, /class="view-options-direction"/);
assert.match(card.shadowRoot.innerHTML, /class="title-line-limit"/);
assert.match(card.shadowRoot.innerHTML, /class="description-line-limit"/);
assert.match(card.shadowRoot.innerHTML, /class="show-completed" checked/);
assert.match(card.shadowRoot.innerHTML, /value=""[^>]*>No sorting<\/option>/);
assert.match(card.shadowRoot.innerHTML, /data-column-width="title"[^>]*value="340"/);
assert.match(card.shadowRoot.innerHTML, /class="reset-view-options"/);
assert.match(card.shadowRoot.innerHTML, /class="sort-stack"/);
assert.match(card.shadowRoot.innerHTML, /class="clear-sorting"/);
assert.match(card.shadowRoot.innerHTML, /data-column-width="priority"/);
assert.match(card.shadowRoot.innerHTML, /data-column-width="priority" min="32"/);
assert.match(card.shadowRoot.innerHTML, /data-move-column="up" data-column="priority"/);
assert.match(card.shadowRoot.innerHTML, /data-move-column="down" data-column="priority"/);
assert.match(card.shadowRoot.innerHTML, /Top to bottom appears left to right/);
assert.match(card.shadowRoot.innerHTML, /data-table-column="priority" draggable="true"/);
assert.match(card.shadowRoot.innerHTML, /data-resize-column="priority"/);
assert.match(card.shadowRoot.innerHTML, /data-view-column="bucket" checked/);
assert.match(card.shadowRoot.innerHTML, /class="card-theme-select"/);
assert.match(card.shadowRoot.innerHTML, /value="dot_matrix_blue"/);
assert.match(card.shadowRoot.innerHTML, /value="dot_matrix_green"/);
assert.match(card.shadowRoot.innerHTML, /class="alternating-rows"/);
assert.match(card.shadowRoot.innerHTML, /class="apply-theme-to-compact"/);
assert.match(card.shadowRoot.innerHTML, /data-theme-color="primary"/);
assert.doesNotMatch(card.shadowRoot.innerHTML, /class="clear-all-aliases"/);
card._viewOptionsOpen = false;
assert.throws(
  () => card.setConfig({ view_mode: "table", table_columns: ["position", "title"] }),
  /Unsupported table column: position/,
);
assert.throws(() => card.setConfig({ theme: "unknown" }), /theme must be/);
assert.throws(
  () => card.setConfig({ apply_theme_to_compact: "yes" }),
  /apply_theme_to_compact must be true or false/,
);
assert.throws(() => card.setConfig({ primary_row_color: "blue" }), /primary must be/);
card.setConfig({
  view_mode: "table",
  theme: "custom",
  alternating_rows: true,
  primary_row_color: "#ffffff",
  alternate_row_color: "#e7f3fb",
  text_color: "#172b3a",
  accent_color: "#315f86",
  table_column_aliases: { priority: "Pri" },
});
assert.equal(card._columnLabel("priority"), "Pri");
assert.match(card._appearanceStyle(), /--vth-row-alternate:#e7f3fb/);
assert.match(card.shadowRoot.innerHTML, /class="[^"\n]*theme-alternating/);
assert.match(card.shadowRoot.innerHTML, />Pri<\/span>/);
card._viewOptionsOpen = true;
card._render();
assert.match(card.shadowRoot.innerHTML, /class="clear-all-aliases"/);
card._viewOptionsOpen = false;
card._columnMenu = { column: "priority", x: 10, y: 10 };
assert.match(card._columnMenuTemplate(), /value="Pri"/);
assert.match(card._columnMenuTemplate(), /visibility:hidden/);
assert.match(card._columnMenuTemplate(), /class="clear-column-alias"/);
assert.match(card._columnMenuTemplate(), /class="remove-column-sort"/);
card._columnMenu = undefined;
card.setConfig({ view_mode: "table" });
card._sortKey = "priority";
card._sortDirection = "desc";
const lowerPriority = { ...card._data.tasks[0], id: 8, priority: 1 };
assert.ok(card._compareTasks(card._data.tasks[0], lowerPriority) < 0);
const completedTask = { ...card._data.tasks[0], id: 9, done: true, priority: 5 };
assert.ok(card._compareTasks(card._data.tasks[0], completedTask) < 0);
card._cycleTableSort("title");
assert.equal(card._sortKey, "title");
assert.equal(card._sortDirection, "asc");
card._cycleTableSort("title");
assert.equal(card._sortDirection, "desc");
card._cycleTableSort("title");
assert.equal(card._sortKey, null);
assert.equal(card._compareTasks(card._data.tasks[0], lowerPriority), 0);
assert.ok(card._compareTasks(card._data.tasks[0], completedTask) < 0);
card._sortRules = [
  { key: "priority", direction: "desc" },
  { key: "title", direction: "asc" },
];
const samePriorityLaterTitle = { ...card._data.tasks[0], id: 10, title: "Zebra task" };
assert.ok(card._compareTasks(card._data.tasks[0], samePriorityLaterTitle) < 0);
card._render();
assert.match(card.shadowRoot.innerHTML, /class="table-sort-indicator"[^>]*>▼<sup>1<\/sup><\/span>/);
assert.match(card.shadowRoot.innerHTML, /class="table-sort-indicator"[^>]*>▲<sup>2<\/sup><\/span>/);
card._columnMenu = { column: "priority", x: 10, y: 10 };
assert.match(card._columnMenuTemplate(), /class="move-column-sort-down"/);
assert.doesNotMatch(card._columnMenuTemplate(), /class="move-column-sort-up"/);
card._columnMenu = { column: "title", x: 10, y: 10 };
assert.match(card._columnMenuTemplate(), /class="move-column-sort-up"/);
assert.doesNotMatch(card._columnMenuTemplate(), /class="move-column-sort-down"/);
card._columnMenu = { column: "bucket", x: 10, y: 10 };
assert.match(card._columnMenuTemplate(), /class="add-column-sort"/);
card._columnMenu = undefined;
localStorage.setItem("vikunja-todo-card:view-mode", "compact");
card.setConfig({ view_mode: "compact" });
card._cardTheme = "dot_matrix_blue";
card._alternatingRows = true;
card._render();
assert.doesNotMatch(card.shadowRoot.innerHTML, /class="[^"\n]*theme-alternating/);
assert.doesNotMatch(card.shadowRoot.innerHTML, /class="[^"\n]*theme-report-paper/);
assert.doesNotMatch(card.shadowRoot.innerHTML, /--vth-row-primary:/);
card.setConfig({ view_mode: "compact", theme: "dot_matrix_blue", apply_theme_to_compact: true });
assert.match(card.shadowRoot.innerHTML, /class="[^"\n]*theme-alternating/);
assert.match(card.shadowRoot.innerHTML, /class="[^"\n]*theme-report-paper/);
card._viewOptionsOpen = true;
card._render();
assert.doesNotMatch(card.shadowRoot.innerHTML, /data-view-column=/);
assert.doesNotMatch(card.shadowRoot.innerHTML, /class="view-options-sort"/);
card._viewOptionsOpen = false;
card._myTasksOnly = true;
assert.deepEqual(card._filteredTasks("").map((task) => task.id), [7]);
card._myTasksOnly = false;
const originalAssignees = card._data.tasks[0].assignees;
card._data.tasks[0].assignees = [];
card._render();
assert.doesNotMatch(card.shadowRoot.innerHTML, /<button[^>]*my-tasks-toggle/);
card._myTasksOnly = true;
card._render();
assert.match(card.shadowRoot.innerHTML, /class="my-tasks-toggle active"[^>]*>My Tasks \(0\)<\/button>/);
card._myTasksOnly = false;
card._data.tasks[0].assignees = originalAssignees;
const multiAssigneeRow = card._taskRow({
  ...card._data.tasks[0],
  assignees: [
    { id: 21, name: "Example Person", username: "example" },
    { id: 22, name: "Second Person", username: "second" },
  ],
});
assert.match(multiAssigneeRow, /\(Example Person, Second Person\)/);
assert.ok(row.indexOf("task-color") < row.indexOf('type="checkbox"'));
assert.match(row, /Timer \(<span class="timer-state-icon">⏱<\/span> <span class="timer-elapsed"/);
assert.match(row, /timer-toggle/);
assert.match(row, /Timer \(/);
assert.doesNotMatch(row, /timer-panel/);
card._openTimers.add(7);
const openTimerRow = card._taskRow(card._data.tasks[0]);
const openTimerTableRow = card._tableTaskRow(card._data.tasks[0], ["title", "status"]);
assert.match(openTimerTableRow, /class="table-timer-row"/);
assert.match(openTimerTableRow, /colspan="2"/);
assert.match(openTimerTableRow, /class="timer-toggle"/);
assert.match(openTimerTableRow, /class="timer-panel" data-task="7"/);
assert.match(openTimerTableRow, /data-timer-action="pause"/);
assert.match(openTimerRow, /00:01:05/);
assert.match(openTimerRow, /Drafted the plan/);
assert.match(openTimerRow, /textarea class="timer-note-input" rows="3"/);
assert.doesNotMatch(openTimerRow, /textarea[^>]+placeholder=/);
assert.match(openTimerRow, />Notes<textarea/);
assert.match(openTimerRow, /class="timer-schedule-row"/);
assert.match(openTimerRow, /class="timer-actions"/);
assert.ok(openTimerRow.indexOf('class="timer-schedule-row"') < openTimerRow.indexOf('class="timer-actions"'));
assert.match(openTimerRow, /data-timer-action="pause"/);
assert.match(openTimerRow, /class="timer-action-input"/);
assert.match(openTimerRow, /value="start">Start/);
assert.match(openTimerRow, /value="pause">Pause/);
assert.match(openTimerRow, /value="stop">Stop/);
assert.match(openTimerRow, /class="timer-picker-type"/);
assert.match(openTimerRow, /value="minutes">Minutes/);
assert.match(openTimerRow, /value="seconds">Seconds/);
assert.match(openTimerRow, /value="timestamp">Timestamp/);
assert.match(openTimerRow, /class="timer-picker-value"/);
assert.doesNotMatch(openTimerRow, /data-timer-action="timing"|data-timer-action="schedule"/);
assert.match(openTimerRow, /class="timer-schedules"/);
assert.match(openTimerRow, /data-schedule-id="example"/);
assert.ok(openTimerRow.indexOf('class="timer-schedules"') < openTimerRow.indexOf('class="timer-note-field"'));
assert.match(openTimerRow, /data-timer-action="save"/);
assert.match(openTimerRow, />Save<\/button>/);
assert.match(openTimerRow, />Cancel<\/button>/);
assert.match(openTimerRow, /data-timer-action="done"/);
assert.match(openTimerRow, /data-timer-action="done">Stop<\/button>/);
assert.match(openTimerRow, /data-timer-action="cancel"/);

card._contextMenu = { taskId: 7, x: 10, y: 10 };
assert.match(card._contextMenuTemplate(), /visibility:hidden/);
assert.match(card._contextMenuTemplate(), /data-context="share"/);
assert.match(card._contextMenuTemplate(), /data-context="priority-up"/);
assert.match(card._contextMenuTemplate(), /data-context="priority-down"/);
assert.match(card._contextMenuTemplate(), /data-context="priority-clear"/);
assert.match(card._contextMenuTemplate(), /class="context-color-input" type="color"/);
assert.match(card._contextMenuTemplate(), /<summary>Assign to ›<\/summary>/);
assert.match(card._contextMenuTemplate(), /context-assignee-search/);
assert.match(card._contextMenuTemplate(), /<summary>Move to bucket ›<\/summary>/);
assert.match(card._contextMenuTemplate(), /data-bucket-id="40" data-bucket-view-id="30">To do/);
card._data.project_bucket_views["12"].configuration_mode = "filter";
assert.doesNotMatch(card._contextMenuTemplate(), /data-bucket-id=/);
card._data.project_bucket_views["12"].configuration_mode = "manual";
assert.match(card._contextMenuTemplate(), /data-assignee-id="22"[^>]*>Second Person/);
assert.doesNotMatch(card._contextMenuTemplate(), /data-assignee-id="21">Example Person/);
assert.doesNotMatch(card._contextMenuTemplate(), /data-context="time-|timer-limit-input|timer-note-input/);

card._contextMenu = undefined;
card._render();
assert.doesNotMatch(card.shadowRoot.innerHTML, /Select all \(0 selected\)/);
assert.match(card.shadowRoot.innerHTML, /tips\.html\?lang=en&amp;v=0\.38\.15|tips\.html\?lang=en&v=0\.38\.15/);
card._selectedTasks.add(7);
card._render();
assert.match(card.shadowRoot.innerHTML, /Select all \(1 selected\)/);
assert.match(card.shadowRoot.innerHTML, /class="clear-selection">Cancel<\/button>/);

let activityCallback;
let activityLoads = 0;
card._config = { entry_id: "example-entry" };
card._hass = {
  locale: { language: "en" },
  connection: {
    subscribeEvents: async (callback, eventType) => {
      if (eventType === "vikunja_task_hub_action") activityCallback = callback;
      return () => {};
    },
  },
};
card._load = async () => { activityLoads += 1; };
await card._subscribeActivity();
activityCallback({ data: { entry_id: "another-entry" } });
activityCallback({ data: { entry_id: "example-entry" } });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(activityLoads, 1);
card._loading = true;
activityCallback({ data: { entry_id: "example-entry" } });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(activityLoads, 1);
card._loading = false;

const reconnectCard = new Card();
let reconnectLoads = 0;
let reconnectTimerSubscriptions = 0;
let reconnectActivitySubscriptions = 0;
reconnectCard._hass = {};
reconnectCard._data = { tasks: [] };
reconnectCard._load = async () => { reconnectLoads += 1; };
reconnectCard._subscribeTimeTracking = async () => { reconnectTimerSubscriptions += 1; };
reconnectCard._subscribeActivity = async () => { reconnectActivitySubscriptions += 1; };
reconnectCard.connectedCallback();
assert.equal(reconnectLoads, 0);
reconnectCard.disconnectedCallback();
reconnectCard.connectedCallback();
assert.equal(reconnectLoads, 1);
assert.equal(reconnectTimerSubscriptions, 2);
assert.equal(reconnectActivitySubscriptions, 2);
reconnectCard.disconnectedCallback();

card._editingTask = card._data.tasks[0];
card._comments.set(7, [{ id: 4, author: "Example person", comment: "Synthetic comment", created: "2026-07-22T12:30:00Z" }]);
card._render();
assert.match(card.shadowRoot.innerHTML, /class="add-comment"/);
assert.match(card.shadowRoot.innerHTML, /data-comment="4"/);
assert.match(card.shadowRoot.innerHTML, /Synthetic comment/);
assert.match(card.shadowRoot.innerHTML, /comment-time/);
assert.match(card.shadowRoot.innerHTML, /name="assignees" value="21" checked/);
assert.match(card.shadowRoot.innerHTML, /name="assignees" value="22"/);
assert.match(card.shadowRoot.innerHTML, /class="assignee-search"/);
assert.match(card.shadowRoot.innerHTML, /data-remove-assignee="21"/);
assert.match(card.shadowRoot.innerHTML, /data-add-assignee="22"/);
assert.match(card.shadowRoot.innerHTML, /name="bucket_id" data-bucket-view-id="30"/);
assert.match(card.shadowRoot.innerHTML, /value="41" selected>In progress/);
const uncoloredTask = { ...card._data.tasks[0], id: 8, hex_color: "", comment_count: 0 };
card._openComments.add(8);
const uncoloredRow = card._taskRow(uncoloredTask);
assert.doesNotMatch(uncoloredRow, /task-color/);
assert.doesNotMatch(uncoloredRow, /comments-panel|noComments/);
const untimedRow = card._taskRow({ ...uncoloredTask, id: 9 });
assert.doesNotMatch(untimedRow, /time-tracker|timer-state-icon/);
const unassignedRow = card._taskRow({ ...uncoloredTask, id: 10, assignees: [] });
assert.doesNotMatch(unassignedRow, /assignee-names/);
card._data.tasks.push({ ...uncoloredTask, id: 10, assignees: [] });
card._contextMenu = { taskId: 10, x: 10, y: 10 };
assert.match(card._contextMenuTemplate(), /data-assignee-id="21">Assign to me/);
card._contextMenu = { taskId: 7, x: 10, y: 10, mode: "unassign" };
assert.match(card._contextMenuTemplate(), /data-unassign-id="21">Unassign Example Person/);
card._data.tasks.push({ ...uncoloredTask, id: 9 });
card._contextMenu = { taskId: 9, x: 10, y: 10 };
const untimedMenu = card._contextMenuTemplate();
assert.match(untimedMenu, /data-context="time-add"/);
assert.doesNotMatch(untimedMenu, /timer-limit-input|timer-note-input|time-pause|time-done/);
card._data.time_tracking["9"] = { state: "paused", elapsed: 0, start_at: "2026-07-23T12:00:00Z" };
card._openTimers.add(9);
const scheduledTimerRow = card._taskRow(card._data.tasks.at(-1));
assert.match(scheduledTimerRow, /data-timer-action="start"/);
assert.doesNotMatch(scheduledTimerRow, /data-timer-action="schedule"|Set auto-start/);
const alignedUncoloredRow = card._taskRow(uncoloredTask, true);
assert.match(alignedUncoloredRow, /reserve-color/);
assert.match(alignedUncoloredRow, /task-color-spacer/);
assert.ok(alignedUncoloredRow.indexOf("task-color-spacer") < alignedUncoloredRow.indexOf('type="checkbox"'));

card._contextMenu = { taskId: 7, x: 10, y: 10 };
assert.match(card._taskRow(card._data.tasks[0]), /class="row [^"]*context-target/);
assert.match(card._tableTaskRow(card._data.tasks[0], ["title"]), /class="row [^"]*context-target/);
assert.doesNotMatch(card._taskRow(uncoloredTask), /context-target/);

const originalQuerySelectorAll = card.shadowRoot.querySelectorAll;
const tableBefore = { scrollTop: 11, scrollLeft: 123 };
const tableAfter = { scrollTop: 0, scrollLeft: 0 };
card.scrollTop = 47;
card.scrollLeft = 9;
window.scrollX = 4;
window.scrollY = 88;
card.shadowRoot.querySelectorAll = (selector) => selector === ".table-scroll" ? [tableBefore] : [];
const scrollState = card._captureScrollState();
card.scrollTop = 0;
card.scrollLeft = 0;
window.scrollX = 0;
window.scrollY = 0;
card.shadowRoot.querySelectorAll = (selector) => selector === ".table-scroll" ? [tableAfter] : [];
card._restoreScrollState(scrollState);
assert.equal(card.scrollTop, 47);
assert.equal(card.scrollLeft, 9);
assert.equal(tableAfter.scrollTop, 11);
assert.equal(tableAfter.scrollLeft, 123);
assert.equal(window.scrollX, 4);
assert.equal(window.scrollY, 88);
card.shadowRoot.querySelectorAll = originalQuerySelectorAll;

const originalRenderPreservingScroll = card._renderPreservingScroll;
let outsideDismissRenders = 0;
card._renderPreservingScroll = () => { outsideDismissRenders += 1; };
card._contextMenu = { taskId: 7, x: 10, y: 10 };
card._columnMenu = { column: "title", x: 20, y: 20 };
card._dismissMenusFromOutside({
  composedPath: () => [{ classList: { contains: (name) => name === "context-menu" } }],
});
assert.equal(card._contextMenu.taskId, 7);
assert.equal(outsideDismissRenders, 0);
card._dismissMenusFromOutside({ composedPath: () => [] });
assert.equal(card._contextMenu, undefined);
assert.equal(card._columnMenu, undefined);
assert.equal(outsideDismissRenders, 1);
card._renderPreservingScroll = originalRenderPreservingScroll;

let escapeDismissRenders = 0;
card._renderPreservingScroll = () => { escapeDismissRenders += 1; };
card._contextMenu = { taskId: 7, x: 10, y: 10 };
card._columnMenu = { column: "title", x: 20, y: 20 };
card._viewOptionsOpen = true;
card._editingTask = card._data.tasks[0];
card._deleteRequest = { type: "task", id: 7 };
let escapePrevented = false;
let escapeStopped = false;
card._dismissOverlayWithEscape({
  key: "Escape",
  preventDefault: () => { escapePrevented = true; },
  stopPropagation: () => { escapeStopped = true; },
});
assert.equal(card._contextMenu, undefined);
assert.equal(card._columnMenu, undefined);
assert.equal(card._viewOptionsOpen, false);
assert.equal(card._editingTask, undefined);
assert.equal(card._deleteRequest, undefined);
assert.equal(escapeDismissRenders, 1);
assert.equal(escapePrevented, true);
assert.equal(escapeStopped, true);
card._renderPreservingScroll = originalRenderPreservingScroll;

const positionedMenu = {
  style: {},
  getBoundingClientRect: () => ({ width: 190, height: 250 }),
};
const originalQuerySelector = card.shadowRoot.querySelector;
card.shadowRoot.querySelector = (selector) => selector === ".context-menu" ? positionedMenu : null;
card._contextMenu = { taskId: 7, x: 1000, y: 740 };
card._positionContextMenu();
assert.equal(positionedMenu.style.left, "826px");
assert.equal(positionedMenu.style.top, "490px");
card.shadowRoot.querySelector = originalQuerySelector;

const tipsSource = fs.readFileSync(
  new URL("../custom_components/vikunja/frontend/tips.html", import.meta.url),
  "utf8",
);
const cardSource = fs.readFileSync(
  new URL("../custom_components/vikunja/frontend/vikunja-todo-card.js", import.meta.url),
  "utf8",
);
assert.match(cardSource, /-webkit-line-clamp:\$\{this\._descriptionLineLimit\}/);
assert.match(cardSource, /-webkit-line-clamp:\$\{this\._titleLineLimit\}/);
assert.match(cardSource, /const MIN_COLUMN_WIDTH = 32/);
assert.doesNotMatch(cardSource, /\.task-table \.table-title[^}]*min-width/);
assert.match(cardSource, /\.table-title-main[^}]*max-width:100%/);
assert.ok((cardSource.match(/event\.target\.closest\("a"\)/g) ?? []).length >= 2);
assert.match(cardSource, /closest\('input,button,a,\.task-color'\)/);
assert.match(cardSource, /document\.addEventListener\("click", this\._outsideMenuClickHandler\)/);
assert.match(cardSource, /document\.removeEventListener\("click", this\._outsideMenuClickHandler\)/);
assert.match(cardSource, /window\.addEventListener\(VIEW_MODE_EVENT/);
assert.match(cardSource, /window\.removeEventListener\(VIEW_MODE_EVENT/);
assert.match(cardSource, /document\.addEventListener\("keydown", this\._escapeKeyHandler\)/);
assert.match(cardSource, /document\.removeEventListener\("keydown", this\._escapeKeyHandler\)/);
assert.match(cardSource, /requestAnimationFrame\(\(\) => \{[\s\S]*requestAnimationFrame\(\(\) => this\._restoreScrollState\(state\)\)/);
assert.match(cardSource, /this\._viewOptionsOpen = true;\s+this\._renderPreservingScroll\(\)/);
assert.match(cardSource, /this\._columnMenu = \{[\s\S]*?this\._renderPreservingScroll\(\);\s+this\._positionColumnMenu\(\)/);
assert.match(tipsSource, /class="guide"/);
for (const key of [
  "tipsSelectionGuide",
  "tipsEditingGuide",
  "tipsQuickGuide",
  "tipsCommentsGuide",
  "tipsTimerGuide",
  "tipsScheduleGuide",
  "tipsBulkGuide",
  "tipsIndicatorsGuide",
]) {
  assert.match(tipsSource, new RegExp(key));
}
