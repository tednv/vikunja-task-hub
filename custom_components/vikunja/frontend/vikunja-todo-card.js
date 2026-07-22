const CARD_TYPE = "vikunja-todo-card";
const STORAGE_PREFIX = "vikunja-todo-card:selected:";

class VikunjaTodoCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = undefined;
    this._data = undefined;
    this._loading = false;
    this._error = undefined;
    this._selectedProject = undefined;
    this._selectedLabel = "all";
    this._editingTask = undefined;
    this._deleteRequest = undefined;
    this._selectedTasks = new Set();
    this._bulkLabels = new Set();
    this._search = "";
  }

  static getStubConfig() {
    return {};
  }

  getGridOptions() {
    return { columns: "full", min_columns: 6 };
  }

  getCardSize() {
    return 8;
  }

  setConfig(config) {
    if (!config || typeof config !== "object")
      throw new Error("Invalid Vikunja Task Hub card configuration");
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    const firstConnection = !this._hass;
    this._hass = hass;
    if (firstConnection && !this._data && !this._loading) void this._load();
  }

  async _load() {
    if (!this._hass || this._loading) return;
    this._loading = true;
    this._error = undefined;
    this._render();
    try {
      this._data = await this._hass.callWS({
        type: "vikunja/dashboard/get",
        ...(this._config.entry_id ? { entry_id: this._config.entry_id } : {}),
      });
      this._normaliseSelection();
    } catch (error) {
      this._error = error?.message ?? String(error);
    } finally {
      this._loading = false;
      this._render();
    }
  }

  async _action(action, values = {}) {
    if (!this._hass) return;
    this._loading = true;
    this._error = undefined;
    this._render();
    const editingTaskId = this._editingTask?.id;
    try {
      this._data = await this._hass.callWS({
        type: "vikunja/dashboard/action",
        action,
        ...(this._config.entry_id ? { entry_id: this._config.entry_id } : {}),
        ...values,
      });
      this._normaliseSelection();
      if (editingTaskId !== undefined)
        this._editingTask = this._data?.tasks.find(
          (task) => Number(task.id) === Number(editingTaskId),
        );
    } catch (error) {
      this._error = error?.message ?? String(error);
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _storageKey() {
    return `${STORAGE_PREFIX}${this._config.storage_key ?? "default"}`;
  }

  _normaliseSelection() {
    const projectIds = (this._data?.projects ?? []).map((project) => String(project.id));
    const remembered = this._readSelection();
    const validSelections = ["all", ...projectIds];
    if (!validSelections.includes(String(this._selectedProject))) {
      this._selectedProject = validSelections.includes(remembered) ? remembered : "all";
    }
    const labelIds = (this._data?.labels ?? []).map((label) => String(label.id));
    if (!["all", "none", ...labelIds].includes(this._selectedLabel)) this._selectedLabel = "all";
    const taskIds = new Set((this._data?.tasks ?? []).map((task) => Number(task.id)));
    this._selectedTasks = new Set([...this._selectedTasks].filter((taskId) => taskIds.has(taskId)));
  }

  _readSelection() {
    try {
      return localStorage.getItem(this._storageKey()) ?? undefined;
    } catch (_error) {
      return undefined;
    }
  }

  _rememberSelection() {
    try {
      localStorage.setItem(this._storageKey(), String(this._selectedProject));
    } catch (_error) {
      /* optional */
    }
  }

  _projectTasks() {
    if (!this._data || !this._selectedProject) return [];
    if (this._selectedProject === "all") return this._data.tasks;
    return this._data.tasks.filter(
      (task) => String(task.project_id) === String(this._selectedProject),
    );
  }

  _filteredTasks() {
    let tasks = this._projectTasks();
    if (this._selectedLabel === "none") tasks = tasks.filter((task) => !task.labels.length);
    else if (this._selectedLabel !== "all")
      tasks = tasks.filter((task) => task.labels.map(String).includes(this._selectedLabel));
    const search = this._search.trim().toLocaleLowerCase();
    return search ? tasks.filter((task) => task.title.toLocaleLowerCase().includes(search)) : tasks;
  }

  _counts() {
    const projectCounts = new Map();
    const labelCounts = new Map();
    for (const task of this._data?.tasks ?? []) {
      if (!task.done)
        projectCounts.set(
          String(task.project_id),
          (projectCounts.get(String(task.project_id)) ?? 0) + 1,
        );
      if (
        !task.done &&
        (this._selectedProject === "all" ||
          String(task.project_id) === String(this._selectedProject))
      ) {
        if (!task.labels.length) labelCounts.set("none", (labelCounts.get("none") ?? 0) + 1);
        for (const id of task.labels)
          labelCounts.set(String(id), (labelCounts.get(String(id)) ?? 0) + 1);
      }
    }
    return { projectCounts, labelCounts };
  }

  _render() {
    if (!this.shadowRoot) return;
    const data = this._data;
    const { projectCounts, labelCounts } = this._counts();
    const totalActive = (data?.tasks ?? []).filter((task) => !task.done).length;
    const projectOptions =
      `<option value="all" ${this._selectedProject === "all" ? "selected" : ""}>All projects (${totalActive})</option>` +
      (data?.projects ?? [])
        .map(
          (project) =>
            `<option value="${project.id}" ${String(project.id) === String(this._selectedProject) ? "selected" : ""}>${this._escape(project.title)} (${projectCounts.get(String(project.id)) ?? 0})</option>`,
        )
        .join("");
    const allActive = this._projectTasks().filter((task) => !task.done).length;
    const labelOptions = (data?.labels ?? [])
      .map(
        (label) =>
          `<option value="${label.id}" ${String(label.id) === this._selectedLabel ? "selected" : ""}>${this._escape(label.title)} (${labelCounts.get(String(label.id)) ?? 0})</option>`,
      )
      .join("");
    const filtered = [...this._filteredTasks()].sort((left, right) => {
      const leftCreated = Date.parse(left.created ?? "") || 0;
      const rightCreated = Date.parse(right.created ?? "") || 0;
      return rightCreated - leftCreated || Number(right.id) - Number(left.id);
    });
    const active = filtered.filter((task) => !task.done);
    const completed = filtered.filter((task) => task.done);
    const visibleIds = filtered.map((task) => Number(task.id));
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((taskId) => this._selectedTasks.has(taskId));
    const selectedTasks = (data?.tasks ?? []).filter((task) =>
      this._selectedTasks.has(Number(task.id)),
    );
    const hasActiveSelected = selectedTasks.some((task) => !task.done);
    const hasCompletedSelected = selectedTasks.some((task) => task.done);
    const selectedCategory = (data?.labels ?? []).find(
      (label) => String(label.id) === String(this._selectedLabel),
    );
    const bulkProjectOptions = (data?.projects ?? [])
      .map((project) => `<option value="${project.id}">${this._escape(project.title)}</option>`)
      .join("");
    const bulkLabelChoices = (data?.labels ?? [])
      .map(
        (label) =>
          `<label><input type="checkbox" value="${label.id}" ${this._bulkLabels.has(String(label.id)) ? "checked" : ""}> <span>${this._escape(label.title)}</span></label>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-width:0; width:100%; grid-column:1 / -1; }
        ha-card { overflow:hidden; width:100%; }
        .toolbar { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; padding:14px; align-items:end; }
        select,input,button { font:inherit; color:var(--primary-text-color); }
        select,input { min-width:0; border:1px solid var(--divider-color); border-radius:8px; background:var(--card-background-color); padding:9px 10px; }
        button { border:0; border-radius:8px; background:var(--secondary-background-color); padding:9px 11px; cursor:pointer; }
        button.danger { color:var(--error-color); }
        button.manage-icon { min-width:44px; min-height:44px; padding:5px; font-size:26px; line-height:1; }
        .selector-group { display:grid; gap:7px; min-width:0; }
        .selector-actions { min-height:44px; display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
        .selector-actions button { flex:0 0 auto; }
        .refresh { margin-left:auto; }
        .add { display:grid; grid-template-columns:1fr auto; gap:8px; padding:0 14px 14px; }
        .bulk-bar { padding:12px 14px; border-top:1px solid var(--divider-color); background:var(--secondary-background-color); }
        .selection-tools { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
        .select-all { display:inline-flex; gap:7px; align-items:center; font-weight:600; }
        .task-filter { flex:1 1 240px; max-width:420px; box-sizing:border-box; }
        .bulk-actions { display:grid; grid-template-columns:minmax(180px,1fr) minmax(240px,1.35fr) minmax(260px,1.4fr); gap:12px; margin-top:12px; }
        .bulk-group { min-width:0; padding:11px; border:1px solid var(--divider-color); border-radius:10px; background:var(--card-background-color); }
        .bulk-group-title { display:block; margin-bottom:8px; color:var(--secondary-text-color); font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
        .bulk-group select { width:100%; box-sizing:border-box; }
        .category-picker { position:relative; }
        .category-picker > summary { cursor:pointer; list-style:none; border:1px solid var(--divider-color); border-radius:8px; padding:9px 10px; }
        .category-picker > summary::-webkit-details-marker { display:none; }
        .category-picker > summary::after { content:"▾"; float:right; }
        .category-picker[open] > summary::after { content:"▴"; }
        .category-options { display:grid; gap:7px; max-height:190px; overflow:auto; margin-top:6px; padding:9px; border:1px solid var(--divider-color); border-radius:8px; }
        .category-options label { display:flex; gap:7px; align-items:center; min-width:0; }
        .category-options span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .category-actions,.task-actions { display:flex; gap:7px; flex-wrap:wrap; margin-top:9px; }
        .task-actions { margin-top:0; }
        .list { border-top:1px solid var(--divider-color); }
        .row { display:grid; grid-template-columns:auto minmax(0,1fr); gap:10px; align-items:start; padding:11px 14px; border-bottom:1px solid var(--divider-color); }
        .row.done .summary { text-decoration:line-through; color:var(--secondary-text-color); }
        .body { min-width:0; cursor:pointer; display:block; width:100%; padding:0; border:0; border-radius:0; background:transparent; text-align:left; }
        .summary { font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .description { color:var(--secondary-text-color); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:3px; }
        .empty,.status { padding:18px 14px; color:var(--secondary-text-color); }
        details.completed > summary { cursor:pointer; padding:12px 14px; font-weight:500; }
        .busy { opacity:.55; pointer-events:none; }
        .modal-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.52); display:grid; place-items:center; padding:20px; }
        .dialog { width:min(620px,100%); max-height:90vh; overflow:auto; background:var(--card-background-color); color:var(--primary-text-color); border-radius:14px; box-shadow:var(--ha-card-box-shadow); padding:18px; }
        .dialog h2 { margin:0 0 16px; font-size:20px; }
        .field { display:grid; gap:6px; margin:12px 0; }
        .field textarea { min-height:150px; resize:vertical; border:1px solid var(--divider-color); border-radius:8px; background:var(--card-background-color); color:var(--primary-text-color); padding:10px; font:inherit; }
        .editor-tabs,.format-toolbar { display:flex; gap:6px; flex-wrap:wrap; }
        .editor-tabs { justify-content:flex-end; margin-bottom:7px; }
        .format-toolbar { padding:7px; border:1px solid var(--divider-color); border-bottom:0; border-radius:8px 8px 0 0; background:var(--secondary-background-color); }
        .format-toolbar button { min-width:34px; padding:6px 8px; font-weight:600; }
        .description-editor { border-radius:0 0 8px 8px !important; width:100%; box-sizing:border-box; }
        .description-preview { min-height:150px; padding:10px; border:1px solid var(--divider-color); border-radius:8px; background:var(--secondary-background-color); }
        .field select[multiple] { min-height:100px; }
        .attachments { margin:16px 0; padding:12px; border:1px solid var(--divider-color); border-radius:10px; }
        .attachments h3 { margin:0 0 10px; font-size:15px; }
        .attachment-list { display:grid; gap:7px; margin-bottom:10px; }
        .attachment-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:7px; align-items:center; }
        .attachment-name { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .attachment-meta { color:var(--secondary-text-color); font-size:12px; }
        .attachment-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .capture-input { display:none; }
        .check-field { display:flex; gap:8px; align-items:center; margin:12px 0; }
        .dialog-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }
        .dialog-actions .delete { margin-right:auto; }
        .delete-impact { padding:12px; border-radius:8px; background:var(--secondary-background-color); }
        .delete-impact strong { color:var(--error-color); }
        button:disabled,input:disabled { opacity:.5; cursor:not-allowed; }
        @media (max-width:900px) { .bulk-actions { grid-template-columns:1fr; } }
        @media (max-width:700px) { .toolbar { grid-template-columns:1fr; } .refresh { margin-left:0; } }
      </style>
      <ha-card class="${this._loading ? "busy" : ""}">
        <div class="toolbar">
          <div class="selector-group">
            <div class="selector-actions">
              <button data-action="new-project" class="manage-icon" title="Create project" aria-label="Create project">＋</button>
              ${this._selectedProject !== "all" ? '<button data-action="delete-project" class="danger manage-icon" title="Delete selected project" aria-label="Delete selected project">🗑</button>' : ""}
            </div>
            <select aria-label="Select project">${projectOptions}</select>
          </div>
          <div class="selector-group">
            <div class="selector-actions">
              <button data-action="new-label" class="manage-icon" title="Create category" aria-label="Create category">＋</button>
              ${selectedCategory ? '<button data-action="delete-label" class="danger manage-icon" title="Delete selected category" aria-label="Delete selected category">🗑</button>' : ""}
              <button data-action="refresh" class="refresh" title="Refresh">↻</button>
            </div>
            <select aria-label="Select category">
              <option value="all" ${this._selectedLabel === "all" ? "selected" : ""}>All categories (${allActive})</option>
              <option value="none" ${this._selectedLabel === "none" ? "selected" : ""}>Uncategorised (${labelCounts.get("none") ?? 0})</option>
              ${labelOptions}
            </select>
          </div>
        </div>
        <form class="add"><input aria-label="Task title" placeholder="${this._selectedProject === "all" ? "Select a project to add a task" : "Task title"}" autocomplete="off" ${this._selectedProject === "all" ? "disabled" : ""}><button type="submit" ${this._selectedProject === "all" ? "disabled" : ""}>Add task</button></form>
        <div class="bulk-bar">
          <div class="selection-tools">
            <label class="select-all"><input class="select-visible" type="checkbox" ${allVisibleSelected ? "checked" : ""} ${visibleIds.length ? "" : "disabled"}> Select all (${this._selectedTasks.size} selected)</label>
            <input class="task-filter" type="search" aria-label="Filter task titles" placeholder="Filter task titles" value="${this._escape(this._search)}">
          </div>
          ${
            this._selectedTasks.size
              ? `
            <div class="bulk-actions">
              <div class="bulk-group">
                <span class="bulk-group-title">Project</span>
                <select class="bulk-project" aria-label="Move selected tasks to project"><option value="">Move to project</option>${bulkProjectOptions}</select>
              </div>
              <div class="bulk-group">
                <span class="bulk-group-title">Categories</span>
                <details class="category-picker">
                  <summary>Choose categories (${this._bulkLabels.size})</summary>
                  <div class="category-options">${bulkLabelChoices || "<span>No categories available.</span>"}</div>
                </details>
                <div class="category-actions">
                  <button data-action="bulk-add-category" ${this._bulkLabels.size ? "" : "disabled"}>Add categories</button>
                  <button data-action="bulk-remove-category" ${this._bulkLabels.size ? "" : "disabled"}>Remove categories</button>
                </div>
              </div>
              <div class="bulk-group">
                <span class="bulk-group-title">Task actions</span>
                <div class="task-actions">
                  ${hasActiveSelected ? '<button data-action="bulk-complete">Mark complete</button>' : ""}
                  ${hasCompletedSelected ? '<button data-action="bulk-restore">Mark active</button>' : ""}
                  <button data-action="bulk-delete" class="danger">Delete tasks</button>
                </div>
              </div>
            </div>
          `
              : ""
          }
        </div>
        ${this._error ? `<div class="status">${this._escape(this._error)}</div>` : ""}
        ${
          !data
            ? `<div class="status">Loading Vikunja Task Hub…</div>`
            : `
          <div class="list active-list">${active.length ? active.map((task) => this._taskRow(task)).join("") : '<div class="empty">No active tasks.</div>'}</div>
          <details class="completed"><summary>Completed (${completed.length})</summary><div class="list">${completed.length ? completed.map((task) => this._taskRow(task)).join("") : '<div class="empty">No completed tasks.</div>'}</div></details>
        `
        }
      </ha-card>
      ${this._editingTask ? this._taskDialog(this._editingTask) : ""}
      ${this._deleteRequest ? this._deleteDialog(this._deleteRequest) : ""}`;
    this._wireEvents();
  }

  _taskRow(task) {
    return `<div class="row ${task.done ? "done" : ""}" data-task="${task.id}">
      <input type="checkbox" aria-label="Select task" ${this._selectedTasks.has(Number(task.id)) ? "checked" : ""}>
      <button type="button" class="body" aria-label="Edit task"><div class="summary">${this._escape(task.title)}</div>${task.description ? `<div class="description">${this._escape(this._plainText(task.description))}</div>` : ""}</button>
    </div>`;
  }

  _taskDialog(task) {
    const due = task.due ? String(task.due).slice(0, 10) : "";
    const categoryOptions = (this._data?.labels ?? [])
      .map(
        (label) =>
          `<option value="${label.id}" ${task.labels.map(String).includes(String(label.id)) ? "selected" : ""}>${this._escape(label.title)}</option>`,
      )
      .join("");
    const attachments = (task.attachments ?? [])
      .map(
        (attachment) => `<div class="attachment-row" data-attachment="${attachment.id}">
      <div class="attachment-name" title="${this._escape(attachment.name)}">${this._escape(attachment.name)} <span class="attachment-meta">(${this._formatBytes(attachment.size)})</span></div>
      <button type="button" class="download-attachment">Download</button>
      <button type="button" class="danger delete-attachment">Delete</button>
    </div>`,
      )
      .join("");
    return `<div class="modal-backdrop" role="dialog" aria-label="Edit task">
      <form class="dialog edit-task-form">
        <h2>Edit task</h2>
        <label class="field">Title<input name="title" value="${this._escape(task.title)}" required></label>
        <div class="field description-field">
          <span>Description</span>
          <div class="editor-tabs"><button type="button" class="preview-toggle">Preview</button></div>
          <div class="description-edit-pane">
            <div class="format-toolbar" aria-label="Description formatting">
              <button type="button" data-format="heading" title="Heading">H</button><button type="button" data-format="bold" title="Bold">B</button><button type="button" data-format="italic" title="Italic"><i>I</i></button>
              <button type="button" data-format="bullet" title="Bulleted list">• List</button><button type="button" data-format="numbered" title="Numbered list">1. List</button><button type="button" data-format="quote" title="Quote">❯</button>
              <button type="button" data-format="link" title="Link">Link</button><button type="button" data-format="code" title="Inline code">Code</button>
            </div>
            <textarea class="description-editor" name="description">${this._escape(task.description ?? "")}</textarea>
          </div>
          <div class="description-preview" hidden><ha-markdown></ha-markdown></div>
        </div>
        <label class="field">Due date<input name="due" type="date" value="${this._escape(due)}"></label>
        <label class="field">Categories<select name="labels" multiple>${categoryOptions}</select></label>
        <section class="attachments">
          <h3>Attachments (${(task.attachments ?? []).length})</h3>
          <div class="attachment-list">${attachments || '<span class="attachment-meta">No attachments.</span>'}</div>
          <div class="attachment-actions">
            <button type="button" class="take-photo">Take photo</button>
            <button type="button" class="record-video">Record video</button>
            <button type="button" class="choose-files">Choose files</button>
          </div>
          <input class="capture-input photo-input" type="file" accept="image/*" capture="environment">
          <input class="capture-input video-input" type="file" accept="video/*" capture="environment">
          <input class="capture-input file-input" type="file" multiple>
          <div class="attachment-meta">Files upload immediately. Maximum 20 MB per file.</div>
        </section>
        <label class="check-field"><input name="done" type="checkbox" ${task.done ? "checked" : ""}> Completed</label>
        <div class="dialog-actions">
          <button type="button" class="danger delete delete-editor-task">Delete task</button>
          <button type="button" class="cancel-editor">Cancel</button>
          <button type="submit">Save changes</button>
        </div>
      </form>
    </div>`;
  }

  _deleteDialog(request) {
    if (request.type === "tasks") {
      const noun = request.count === 1 ? "task" : "tasks";
      return `<div class="modal-backdrop" role="dialog" aria-label="Delete selected tasks">
        <form class="dialog bulk-delete-confirmation-form">
          <h2>Delete ${request.count} selected ${noun}?</h2>
          <p class="delete-impact"><strong>${request.count} ${noun}</strong> will be permanently deleted. This cannot be undone.</p>
          <div class="dialog-actions"><button type="button" class="cancel-delete">Cancel</button><button type="submit" class="danger">Delete tasks</button></div>
        </form>
      </div>`;
    }
    const noun = request.type === "project" ? "project" : "category";
    const tasks = request.count === 1 ? "task" : "tasks";
    const impactControls =
      request.count > 0
        ? `
        <p>This will affect <strong>${request.count} ${tasks}</strong>.</p>
        <label class="check-field"><input name="delete_tasks" type="checkbox"> Also permanently delete ${request.count} affected ${tasks}</label>
        <p class="delete-impact">${
          request.type === "project"
            ? `The project will be deleted. <strong>${request.count} ${tasks}</strong> will be moved to Inbox.`
            : `The category will be deleted. <strong>${request.count} ${tasks}</strong> will remain in their projects and be removed from this category.`
        }</p>`
        : "";
    return `<div class="modal-backdrop" role="dialog" aria-label="Delete ${noun}">
      <form class="dialog delete-confirmation-form">
        <h2>Delete ${this._escape(noun)} “${this._escape(request.title)}”?</h2>
        ${impactControls}
        <div class="dialog-actions">
          <button type="button" class="cancel-delete">Cancel</button>
          <button type="submit" class="danger">Delete ${this._escape(noun)}</button>
        </div>
      </form>
    </div>`;
  }

  _wireEvents() {
    const root = this.shadowRoot;
    root.querySelector('[aria-label="Select project"]')?.addEventListener("change", (event) => {
      this._selectedProject = event.target.value;
      this._selectedLabel = "all";
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      this._rememberSelection();
      this._render();
    });
    root.querySelector('[aria-label="Select category"]')?.addEventListener("change", (event) => {
      this._selectedLabel = event.target.value;
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      this._render();
    });
    root.querySelector(".select-visible")?.addEventListener("change", (event) => {
      const visibleIds = this._filteredTasks().map((task) => Number(task.id));
      if (event.target.checked) visibleIds.forEach((taskId) => this._selectedTasks.add(taskId));
      else visibleIds.forEach((taskId) => this._selectedTasks.delete(taskId));
      this._render();
    });
    root.querySelector(".task-filter")?.addEventListener("input", (event) => {
      this._search = event.target.value;
      const position = event.target.selectionStart;
      this._render();
      const input = this.shadowRoot.querySelector(".task-filter");
      input?.focus();
      input?.setSelectionRange(position, position);
    });
    root.querySelector("form.add")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = event.currentTarget.querySelector("input");
      const title = input.value.trim();
      if (!title || !this._selectedProject) return;
      const label_ids = /^\d+$/.test(this._selectedLabel) ? [Number(this._selectedLabel)] : [];
      void this._action("task_create", {
        project_id: Number(this._selectedProject),
        title,
        label_ids,
      });
    });
    root.querySelectorAll(".row").forEach((row) => {
      const taskId = Number(row.dataset.task);
      row.querySelector('input[type="checkbox"]')?.addEventListener("change", (event) => {
        if (event.target.checked) this._selectedTasks.add(taskId);
        else this._selectedTasks.delete(taskId);
        this._render();
      });
      row.querySelector(".body")?.addEventListener("click", () => {
        this._editingTask = this._data?.tasks.find((task) => Number(task.id) === taskId);
        this._render();
      });
    });
    const editor = root.querySelector(".edit-task-form");
    const description = editor?.querySelector('[name="description"]');
    const preview = editor?.querySelector(".description-preview");
    const markdown = preview?.querySelector("ha-markdown");
    const updatePreview = () => {
      if (markdown) markdown.content = description?.value ?? "";
    };
    updatePreview();
    editor?.querySelector(".preview-toggle")?.addEventListener("click", (event) => {
      const showPreview = preview.hidden;
      editor.querySelector(".description-edit-pane").hidden = showPreview;
      preview.hidden = !showPreview;
      event.currentTarget.textContent = showPreview ? "Back to description" : "Preview";
      if (showPreview) updatePreview();
      else description.focus();
    });
    editor
      ?.querySelectorAll("[data-format]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          this._formatDescription(description, button.dataset.format),
        ),
      );
    description?.addEventListener("input", updatePreview);
    editor?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(editor);
      const label_ids = Array.from(editor.querySelector('[name="labels"]').selectedOptions).map(
        (option) => Number(option.value),
      );
      const task_id = Number(this._editingTask.id);
      this._editingTask = undefined;
      void this._action("task_update", {
        task_id,
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? ""),
        due: String(form.get("due") ?? "") || null,
        done: form.get("done") === "on",
        label_ids,
      });
    });
    editor?.querySelector(".cancel-editor")?.addEventListener("click", () => {
      this._editingTask = undefined;
      this._render();
    });
    editor?.querySelector(".delete-editor-task")?.addEventListener("click", () => {
      const task_id = Number(this._editingTask.id);
      if (confirm("Delete this task? This cannot be undone.")) {
        this._editingTask = undefined;
        void this._action("task_delete", { task_id });
      }
    });
    const attachmentInputs = [
      [".take-photo", ".photo-input"],
      [".record-video", ".video-input"],
      [".choose-files", ".file-input"],
    ];
    attachmentInputs.forEach(([buttonSelector, inputSelector]) => {
      const input = editor?.querySelector(inputSelector);
      editor?.querySelector(buttonSelector)?.addEventListener("click", () => input?.click());
      input?.addEventListener(
        "change",
        () => void this._uploadAttachmentFiles([...(input.files ?? [])]),
      );
    });
    editor?.querySelectorAll(".attachment-row").forEach((row) => {
      const attachment_id = Number(row.dataset.attachment);
      const attachment = this._editingTask.attachments.find(
        (item) => Number(item.id) === attachment_id,
      );
      row
        .querySelector(".download-attachment")
        ?.addEventListener(
          "click",
          () => void this._downloadAttachment(Number(this._editingTask.id), attachment),
        );
      row.querySelector(".delete-attachment")?.addEventListener("click", () => {
        if (confirm(`Delete attachment "${attachment.name}"? This cannot be undone.`))
          void this._action("attachment_delete", {
            task_id: Number(this._editingTask.id),
            attachment_id,
          });
      });
    });
    const deleteForm = root.querySelector(".delete-confirmation-form");
    deleteForm?.querySelector('[name="delete_tasks"]')?.addEventListener("change", (event) => {
      const request = this._deleteRequest;
      const tasks = request.count === 1 ? "task" : "tasks";
      deleteForm.querySelector(".delete-impact").innerHTML = event.target.checked
        ? `The ${request.type} and <strong>${request.count} ${tasks}</strong> will be permanently deleted.`
        : request.type === "project"
          ? `The project will be deleted. <strong>${request.count} ${tasks}</strong> will be moved to Inbox.`
          : `The category will be deleted. <strong>${request.count} ${tasks}</strong> will remain in their projects and be removed from this category.`;
    });
    deleteForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const request = this._deleteRequest;
      const delete_tasks = deleteForm.querySelector('[name="delete_tasks"]')?.checked ?? false;
      this._deleteRequest = undefined;
      if (request.type === "project")
        void this._action("project_delete", { project_id: request.id, delete_tasks });
      else void this._action("label_delete", { label_id: request.id, delete_tasks });
    });
    deleteForm?.querySelector(".cancel-delete")?.addEventListener("click", () => {
      this._deleteRequest = undefined;
      this._render();
    });
    const bulkDeleteForm = root.querySelector(".bulk-delete-confirmation-form");
    bulkDeleteForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const task_ids = [...this._selectedTasks];
      this._deleteRequest = undefined;
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      void this._action("task_bulk_delete", { task_ids });
    });
    bulkDeleteForm?.querySelector(".cancel-delete")?.addEventListener("click", () => {
      this._deleteRequest = undefined;
      this._render();
    });
    root.querySelectorAll(".modal-backdrop").forEach((backdrop) =>
      backdrop.addEventListener("click", (event) => {
        if (event.target === event.currentTarget) {
          this._editingTask = undefined;
          this._deleteRequest = undefined;
          this._render();
        }
      }),
    );
    root
      .querySelector('[data-action="refresh"]')
      ?.addEventListener("click", () => void this._load());
    root.querySelector(".bulk-project")?.addEventListener("change", (event) => {
      if (!/^\d+$/.test(event.target.value)) return;
      const task_ids = [...this._selectedTasks];
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      void this._action("task_bulk_update", { task_ids, project_id: Number(event.target.value) });
    });
    root.querySelector(".category-options")?.addEventListener("change", (event) => {
      if (!event.target.matches('input[type="checkbox"]')) return;
      if (event.target.checked) this._bulkLabels.add(event.target.value);
      else this._bulkLabels.delete(event.target.value);
      const summary = root.querySelector(".category-picker summary");
      if (summary) summary.textContent = `Choose categories (${this._bulkLabels.size})`;
      root
        .querySelectorAll('[data-action="bulk-add-category"],[data-action="bulk-remove-category"]')
        .forEach((button) => {
          button.disabled = !this._bulkLabels.size;
        });
    });
    root
      .querySelector('[data-action="bulk-add-category"]')
      ?.addEventListener("click", () => this._runBulkLabel("add"));
    root
      .querySelector('[data-action="bulk-remove-category"]')
      ?.addEventListener("click", () => this._runBulkLabel("remove"));
    root
      .querySelector('[data-action="bulk-complete"]')
      ?.addEventListener("click", () => this._runBulkDone(true));
    root
      .querySelector('[data-action="bulk-restore"]')
      ?.addEventListener("click", () => this._runBulkDone(false));
    root.querySelector('[data-action="bulk-delete"]')?.addEventListener("click", () => {
      this._deleteRequest = { type: "tasks", count: this._selectedTasks.size };
      this._render();
    });
    root.querySelector('[data-action="new-project"]')?.addEventListener("click", () => {
      const title = prompt("New project name");
      if (title?.trim()) void this._action("project_create", { title });
    });
    root.querySelector('[data-action="delete-project"]')?.addEventListener("click", () => {
      const project = this._data?.projects.find(
        (item) => String(item.id) === String(this._selectedProject),
      );
      if (!project) return;
      const count = this._data.tasks.filter(
        (task) => String(task.project_id) === String(project.id),
      ).length;
      this._deleteRequest = { type: "project", id: project.id, title: project.title, count };
      this._render();
    });
    root.querySelector('[data-action="new-label"]')?.addEventListener("click", () => {
      const title = prompt("New category name");
      if (title?.trim()) void this._action("label_create", { title });
    });
    root.querySelector('[data-action="delete-label"]')?.addEventListener("click", () => {
      if (!/^\d+$/.test(this._selectedLabel)) return;
      const label = this._data?.labels.find((item) => String(item.id) === this._selectedLabel);
      if (!label) return;
      const count = this._data.tasks.filter((task) =>
        task.labels.map(String).includes(String(label.id)),
      ).length;
      this._deleteRequest = { type: "category", id: label.id, title: label.title, count };
      this._render();
    });
  }

  _escape(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _runBulkLabel(operation) {
    if (!this._bulkLabels.size || !this._selectedTasks.size) return;
    const task_ids = [...this._selectedTasks];
    const label_ids = [...this._bulkLabels].map(Number);
    this._selectedTasks.clear();
    this._bulkLabels.clear();
    void this._action("task_bulk_update", { task_ids, label_ids, label_operation: operation });
  }

  _runBulkDone(done) {
    if (!this._selectedTasks.size) return;
    const task_ids = [...this._selectedTasks];
    this._selectedTasks.clear();
    this._bulkLabels.clear();
    void this._action("task_bulk_update", { task_ids, done });
  }

  _plainText(value) {
    const parsed = new DOMParser().parseFromString(String(value), "text/html");
    return (parsed.body.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  _formatBytes(value) {
    const bytes = Number(value) || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async _fileBase64(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000)
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return btoa(binary);
  }

  async _uploadAttachmentFiles(chosen) {
    if (!chosen.length || !this._editingTask) return;
    const oversized = chosen.find((file) => file.size > 20 * 1024 * 1024);
    if (oversized) {
      this._error = `${oversized.name} is larger than 20 MB.`;
      this._render();
      return;
    }
    const files = await Promise.all(
      chosen.map(async (file) => ({
        name: file.name,
        mime: file.type || "application/octet-stream",
        data: await this._fileBase64(file),
      })),
    );
    void this._action("attachment_upload", { task_id: Number(this._editingTask.id), files });
  }

  async _downloadAttachment(taskId, attachment) {
    if (!this._hass || !attachment) return;
    try {
      const result = await this._hass.callWS({
        type: "vikunja/dashboard/action",
        action: "attachment_download",
        ...(this._config.entry_id ? { entry_id: this._config.entry_id } : {}),
        task_id: taskId,
        attachment_id: attachment.id,
        title: attachment.name,
      });
      const binary = atob(result.data);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
      const url = URL.createObjectURL(new Blob([bytes], { type: result.mime || attachment.mime }));
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      this._error = error?.message ?? String(error);
      this._render();
    }
  }

  _formatDescription(textarea, format) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    const inline = {
      bold: [`**`, `**`, "bold text"],
      italic: [`*`, `*`, "italic text"],
      link: [`[`, `](https://)`, "link text"],
      code: ["`", "`", "code"],
    };
    let replacement;
    if (inline[format]) {
      const [before, after, fallback] = inline[format];
      replacement = `${before}${selected || fallback}${after}`;
    } else {
      const prefix = { heading: "## ", bullet: "- ", numbered: "1. ", quote: "> " }[format] ?? "";
      replacement = (selected || "text")
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n");
    }
    textarea.setRangeText(replacement, start, end, "end");
    textarea.focus();
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

if (!customElements.get(CARD_TYPE)) customElements.define(CARD_TYPE, VikunjaTodoCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TYPE))
  window.customCards.push({
    type: CARD_TYPE,
    name: "Vikunja Task Hub",
    description: "Manage Vikunja projects, categories, tasks, and attachments from Home Assistant.",
    preview: true,
  });
