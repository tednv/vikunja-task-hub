import assert from "node:assert/strict";
import fs from "node:fs";

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
globalThis.window = { customCards: [], innerHeight: 768, innerWidth: 1024 };

await import("../custom_components/vikunja/frontend/vikunja-todo-card.js");

const Card = registry.get("vikunja-todo-card");
const card = new Card();
card._hass = { locale: { language: "en" } };
card._vikunjaUrl = "https://example.com/vikunja";
card._selectedProject = "12";
card._data = {
  projects: [{ id: 12, title: "Example" }],
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
      percent_done: 0.4,
      hex_color: "224466",
      comment_count: 2,
      labels: [3],
      attachments: [],
    },
  ],
  time_tracking: { "7": { state: "active", elapsed: 65, note: "Drafted the plan", scheduled_actions: [{ id: "example", action: "pause", at: "2026-07-22T13:00:00Z" }] } },
};

assert.equal(card._projectVikunjaUrl(), "https://example.com/vikunja/projects/12");

const row = card._taskRow(card._data.tasks[0]);
assert.match(row, /comment-toggle/);
assert.match(row, /Comments \(2\)/);
assert.match(row, /Planning/);
assert.match(row, /width:40%/);
assert.match(row, /background:#224466/);
assert.ok(row.indexOf("task-color") < row.indexOf('type="checkbox"'));
assert.match(row, /Timer \(<span class="timer-state-icon">⏱<\/span> <span class="timer-elapsed"/);
assert.match(row, /timer-toggle/);
assert.match(row, /Timer \(/);
assert.doesNotMatch(row, /timer-panel/);
card._openTimers.add(7);
const openTimerRow = card._taskRow(card._data.tasks[0]);
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
assert.match(card._contextMenuTemplate(), /data-context="share"/);
assert.match(card._contextMenuTemplate(), /data-context="priority-up"/);
assert.match(card._contextMenuTemplate(), /data-context="priority-down"/);
assert.match(card._contextMenuTemplate(), /data-context="priority-clear"/);
assert.match(card._contextMenuTemplate(), /class="context-color-input" type="color"/);
assert.doesNotMatch(card._contextMenuTemplate(), /data-context="time-|timer-limit-input|timer-note-input/);

card._contextMenu = undefined;
card._render();
assert.doesNotMatch(card.shadowRoot.innerHTML, /Select all \(0 selected\)/);
assert.match(card.shadowRoot.innerHTML, /tips\.html\?lang=en&amp;v=0\.32\.1|tips\.html\?lang=en&v=0\.32\.1/);
card._selectedTasks.add(7);
card._render();
assert.match(card.shadowRoot.innerHTML, /Select all \(1 selected\)/);
assert.match(card.shadowRoot.innerHTML, /class="clear-selection">Cancel<\/button>/);
card._editingTask = card._data.tasks[0];
card._comments.set(7, [{ id: 4, author: "Example person", comment: "Synthetic comment", created: "2026-07-22T12:30:00Z" }]);
card._render();
assert.match(card.shadowRoot.innerHTML, /class="add-comment"/);
assert.match(card.shadowRoot.innerHTML, /data-comment="4"/);
assert.match(card.shadowRoot.innerHTML, /Synthetic comment/);
assert.match(card.shadowRoot.innerHTML, /comment-time/);
const uncoloredTask = { ...card._data.tasks[0], id: 8, hex_color: "", comment_count: 0 };
card._openComments.add(8);
const uncoloredRow = card._taskRow(uncoloredTask);
assert.doesNotMatch(uncoloredRow, /task-color/);
assert.doesNotMatch(uncoloredRow, /comments-panel|noComments/);
const untimedRow = card._taskRow({ ...uncoloredTask, id: 9 });
assert.doesNotMatch(untimedRow, /time-tracker|timer-state-icon/);
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
