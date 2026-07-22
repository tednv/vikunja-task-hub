import { TRANSLATIONS } from "./vikunja-todo-card-translations.js?v=0.32.1";

const CARD_TYPE = "vikunja-todo-card";
const STORAGE_PREFIX = "vikunja-todo-card:selected:";

class VikunjaTodoCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = undefined;
    this._data = undefined;
    this._vikunjaUrl = undefined;
    this._vikunjaUrlLoading = false;
    this._loading = false;
    this._error = undefined;
    this._selectedProject = undefined;
    this._selectedLabel = "all";
    this._editingTask = undefined;
    this._deleteRequest = undefined;
    this._selectedTasks = new Set();
    this._bulkLabels = new Set();
    this._comments = new Map();
    this._openComments = new Set();
    this._openTimers = new Set();
    this._contextMenu = undefined;
    this._search = "";
    this._dataReceivedAt = Date.now();
    this._timerTicker = undefined;
    this._unsubscribeTimeTracking = undefined;
  }

  connectedCallback() {
    if (!this._timerTicker)
      this._timerTicker = setInterval(() => this._updateElapsedTimers(), 1000);
  }

  disconnectedCallback() {
    clearInterval(this._timerTicker);
    this._timerTicker = undefined;
    this._unsubscribeTimeTracking?.();
    this._unsubscribeTimeTracking = undefined;
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
    const previousLanguage = this._language();
    this._hass = hass;
    if (firstConnection) void this._subscribeTimeTracking();
    if (firstConnection && !this._data && !this._loading) void this._load();
    else if (previousLanguage !== this._language()) this._render();
  }

  _language() {
    const language = String(this._hass?.locale?.language ?? this._hass?.language ?? "en")
      .toLowerCase()
      .split("-")[0];
    return TRANSLATIONS[language] ? language : "en";
  }

  _t(key) {
    return TRANSLATIONS[this._language()]?.[key] ?? TRANSLATIONS.en[key] ?? key;
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
      this._dataReceivedAt = Date.now();
      this._comments.clear();
      this._openComments.clear();
      this._normaliseSelection();
      void this._loadVikunjaUrl();
    } catch (error) {
      this._error = error?.message ?? String(error);
    } finally {
      this._loading = false;
      this._render();
    }
  }

  async _loadVikunjaUrl() {
    if (!this._hass || this._vikunjaUrl || this._vikunjaUrlLoading) return;
    this._vikunjaUrlLoading = true;
    try {
      const result = await this._hass.callWS({
        type: "vikunja/dashboard/web_url",
        ...(this._config.entry_id ? { entry_id: this._config.entry_id } : {}),
      });
      const url = new URL(result?.url);
      if (!['http:', 'https:'].includes(url.protocol)) return;
      this._vikunjaUrl = url.href;
    } catch (_error) {
      // URL discovery is optional and must never interrupt task loading.
    } finally {
      this._vikunjaUrlLoading = false;
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
      this._dataReceivedAt = Date.now();
      if (action === "time_done") {
        this._comments.delete(Number(values.task_id));
        this._openComments.delete(Number(values.task_id));
      }
      if (action === "project_create" && this._data?.created_project_id !== undefined) {
        this._selectedProject = String(this._data.created_project_id);
        this._selectedLabel = "all";
        if (values.task_ids?.length) {
          this._selectedTasks.clear();
          this._bulkLabels.clear();
        }
        this._rememberSelection();
      }
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

  _projectVikunjaUrl() {
    if (!this._vikunjaUrl) return undefined;
    if (!/^\d+$/.test(String(this._selectedProject))) return this._vikunjaUrl;
    try {
      const base = new URL(this._vikunjaUrl);
      if (!base.pathname.endsWith("/")) base.pathname += "/";
      return new URL(`projects/${this._selectedProject}`, base).href;
    } catch (_error) {
      return this._vikunjaUrl;
    }
  }

  _projectTasks() {
    if (!this._data || !this._selectedProject) return [];
    if (this._selectedProject === "all") return this._data.tasks;
    return this._data.tasks.filter(
      (task) => String(task.project_id) === String(this._selectedProject),
    );
  }

  _filteredTasks(searchValue = this._search) {
    let tasks = this._projectTasks();
    if (this._selectedLabel === "none") tasks = tasks.filter((task) => !task.labels.length);
    else if (this._selectedLabel !== "all")
      tasks = tasks.filter((task) => task.labels.map(String).includes(this._selectedLabel));
    const search = searchValue.trim().toLocaleLowerCase();
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
      `<option value="all" ${this._selectedProject === "all" ? "selected" : ""}>${this._t("allProjects")} (${totalActive})</option>` +
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
    const displayed = [...this._filteredTasks("")].sort((left, right) => {
      const priorityDifference = Number(right.priority ?? 0) - Number(left.priority ?? 0);
      const leftCreated = Date.parse(left.created ?? "") || 0;
      const rightCreated = Date.parse(right.created ?? "") || 0;
      return priorityDifference || rightCreated - leftCreated || Number(right.id) - Number(left.id);
    });
    const active = displayed.filter((task) => !task.done);
    const completed = displayed.filter((task) => task.done);
    const reserveColorSpace = displayed.some((task) => Boolean(task.hex_color));
    const visibleIds = this._filteredTasks().map((task) => Number(task.id));
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
    const selectedProject = (data?.projects ?? []).find(
      (project) => String(project.id) === String(this._selectedProject),
    );
    const canDeleteSelectedProject =
      selectedProject && selectedProject.title.trim().toLowerCase() !== "inbox";
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
        .toolbar { display:grid; grid-template-columns:repeat(2,minmax(260px,480px)); gap:12px; padding:14px; align-items:end; justify-content:start; }
        select,input,button { font:inherit; color:var(--primary-text-color); }
        select,input { min-width:0; border:1px solid var(--divider-color); border-radius:8px; background:var(--card-background-color); padding:9px 10px; }
        button { border:0; border-radius:8px; background:var(--secondary-background-color); padding:9px 11px; cursor:pointer; }
        button.danger { color:var(--error-color); }
        button.manage-icon { min-width:44px; min-height:44px; padding:5px; font-size:26px; line-height:1; }
        .selector-group { display:grid; grid-template-columns:auto minmax(160px,320px); gap:7px; min-width:0; align-items:center; }
        .selector-actions { min-height:44px; display:flex; gap:6px; flex-wrap:nowrap; align-items:center; }
        .selector-actions button { flex:0 0 auto; }
        .refresh { margin-left:auto; }
        .add { display:grid; grid-template-columns:1fr auto; gap:8px; padding:0 14px 14px; }
        .bulk-bar { padding:12px 14px; border-top:1px solid var(--divider-color); background:var(--secondary-background-color); }
        .selection-tools { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
        .select-all { display:inline-flex; gap:7px; align-items:center; font-weight:600; }
        .clear-selection { padding:5px 8px; }
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
        .task-shell { border-bottom:1px solid var(--divider-color); }
        .task-shell[hidden] { display:none; }
        .row { display:grid; grid-template-columns:auto minmax(0,1fr) minmax(54px,90px); gap:9px; align-items:start; padding:11px 14px; }
        .task-shell.reserve-color .row { grid-template-columns:auto auto minmax(0,1fr) minmax(54px,90px); }
        .row[hidden] { display:none; }
        .row.done .summary { text-decoration:line-through; color:var(--secondary-text-color); }
        .body { min-width:0; cursor:pointer; display:block; width:100%; padding:0; border:0; border-radius:0; background:transparent; text-align:left; }
        .summary { font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .description { color:var(--secondary-text-color); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:3px; }
        .comment-toggle, .timer-toggle { display:block; margin:0 14px 8px 49px; padding:4px 0; background:transparent; color:var(--secondary-text-color); font-weight:600; text-align:left; }
        .task-color { width:14px; height:14px; margin-top:3px; border-radius:50%; align-self:start; }
        .task-color-spacer { width:14px; height:14px; }
        .priority-marker { margin-right:6px; }
        .task-labels { display:flex; gap:5px; overflow:hidden; margin-top:4px; }
        .task-label { flex:0 1 auto; min-width:0; max-width:150px; padding:2px 6px; border-radius:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; background:var(--secondary-background-color); font-size:11px; }
        .progress-wrap { align-self:center; min-width:0; }
        .progress-track { height:5px; overflow:hidden; border-radius:4px; background:var(--divider-color); }
        .progress-fill { height:100%; background:var(--primary-color); }
        .progress-text { margin-top:3px; color:var(--secondary-text-color); font-size:10px; text-align:right; }
        .comments-panel { margin:0 14px 10px 49px; padding:9px 11px; border-left:2px solid var(--divider-color); color:var(--secondary-text-color); }
        .timer-panel { margin:0 14px 10px 49px; padding:9px 11px; border-left:2px solid var(--divider-color); }
        .timer-elapsed { font-variant-numeric:tabular-nums; font-weight:700; }
        .timer-state-icon { color:var(--primary-color); }
        .timer-controls { display:grid; gap:8px; }
        .timer-schedule-row { display:flex; gap:8px; align-items:end; width:50%; min-width:0; flex-wrap:nowrap; overflow-x:auto; padding:2px 0; }
        .timer-schedule-row label { display:grid; gap:5px; flex:0 0 auto; justify-items:center; font-size:11px; text-align:center; }
        .timer-actions { display:flex; gap:7px; width:50%; min-width:220px; flex-wrap:wrap; }
        .timer-picker-value { width:90px; }
        .timer-picker-value[type="datetime-local"] { width:175px; }
        .timer-schedule-row select { max-width:130px; }
        .timer-schedule-row input { box-sizing:border-box; padding:6px; }
        .timer-deadline { color:var(--secondary-text-color); font-size:11px; }
        .timer-schedules { display:grid; gap:6px; width:50%; min-width:220px; }
        .timer-schedule-item { display:flex; gap:8px; align-items:center; justify-content:space-between; padding:6px 8px; border-radius:7px; background:var(--secondary-background-color); }
        .timer-note-field { display:grid; gap:5px; width:50%; min-width:220px; }
        .timer-note-field textarea { width:100%; min-height:64px; box-sizing:border-box; resize:vertical; }
        .comments-editor { margin:16px 0; padding:12px; border:1px solid var(--divider-color); border-radius:10px; }
        .comments-editor h3 { margin:0 0 10px; font-size:15px; }
        .editor-comment { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; padding:8px 0; border-bottom:1px solid var(--divider-color); }
        .editor-comment:last-child { border-bottom:0; }
        .new-comment { width:100%; min-height:70px; box-sizing:border-box; margin-top:10px; resize:vertical; border:1px solid var(--divider-color); border-radius:8px; background:var(--card-background-color); color:var(--primary-text-color); padding:9px; font:inherit; }
        .comment { margin-top:8px; }
        .comment:first-child { margin-top:0; }
        .comment-meta { font-size:11px; font-weight:600; }
        .comment-text { margin-top:2px; color:var(--primary-text-color); white-space:pre-wrap; }
        .context-menu { position:fixed; z-index:30; display:grid; min-width:180px; max-width:calc(100vw - 16px); max-height:calc(100vh - 16px); overflow-y:auto; padding:6px; border:1px solid var(--divider-color); border-radius:10px; background:var(--card-background-color); box-shadow:var(--ha-card-box-shadow); }
        .context-menu button { text-align:left; background:transparent; }
        .context-color { display:flex; justify-content:space-between; gap:12px; align-items:center; padding:9px 11px; cursor:pointer; }
        .context-color input { width:42px; min-width:42px; height:28px; padding:2px; cursor:pointer; }
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
        .recurrence-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:8px; }
        .recurrence-custom { display:grid; grid-template-columns:minmax(90px,.7fr) minmax(0,1fr); gap:8px; }
        .recurring-icon { margin-right:7px; color:var(--primary-color); font-weight:700; }
        .bulk-project-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .bulk-project-actions select { flex:1 1 190px; }
        .dialog-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }
        .dialog-actions .delete { margin-right:auto; }
        .card-links { display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:16px; }
        .card-link { display:block; padding:9px 13px; border-radius:8px; background:var(--secondary-background-color); color:var(--primary-text-color); text-align:center; text-decoration:none; }
        .delete-impact { padding:12px; border-radius:8px; background:var(--secondary-background-color); }
        .delete-impact strong { color:var(--error-color); }
        button:disabled,input:disabled { opacity:.5; cursor:not-allowed; }
        @media (max-width:900px) { .bulk-actions { grid-template-columns:1fr; } }
        @media (max-width:700px) { .toolbar { grid-template-columns:1fr; } .selector-group { grid-template-columns:auto minmax(0,1fr); } .refresh { margin-left:0; } }
      </style>
      <ha-card class="${this._loading ? "busy" : ""}">
        <div class="toolbar">
          <div class="selector-group">
            <div class="selector-actions">
              <button data-action="new-project" class="manage-icon" title="${this._t("createProject")}" aria-label="${this._t("createProject")}">＋</button>
              ${canDeleteSelectedProject ? `<button data-action="delete-project" class="danger manage-icon" title="${this._t("deleteProject")}" aria-label="${this._t("deleteProject")}">🗑</button>` : ""}
            </div>
            <select data-role="project-select" aria-label="${this._t("selectProject")}">${projectOptions}</select>
          </div>
          <div class="selector-group">
            <div class="selector-actions">
              <button data-action="new-label" class="manage-icon" title="${this._t("createCategory")}" aria-label="${this._t("createCategory")}">＋</button>
              ${selectedCategory ? `<button data-action="delete-label" class="danger manage-icon" title="${this._t("deleteCategory")}" aria-label="${this._t("deleteCategory")}">🗑</button>` : ""}
              <button data-action="refresh" class="refresh" title="${this._t("refresh")}">↻</button>
            </div>
            <select data-role="category-select" aria-label="${this._t("selectCategory")}">
              <option value="all" ${this._selectedLabel === "all" ? "selected" : ""}>${this._t("allCategories")} (${allActive})</option>
              <option value="none" ${this._selectedLabel === "none" ? "selected" : ""}>${this._t("uncategorised")} (${labelCounts.get("none") ?? 0})</option>
              ${labelOptions}
            </select>
          </div>
        </div>
        <form class="add"><input aria-label="${this._t("taskTitle")}" placeholder="${this._selectedProject === "all" ? this._t("selectProjectToAdd") : this._t("taskTitle")}" autocomplete="off" ${this._selectedProject === "all" ? "disabled" : ""}><button type="submit" ${this._selectedProject === "all" ? "disabled" : ""}>${this._t("addTask")}</button></form>
        <div class="bulk-bar">
          <div class="selection-tools">
            <label class="select-all"><input class="select-visible" type="checkbox" ${allVisibleSelected ? "checked" : ""} ${visibleIds.length ? "" : "disabled"}> ${this._t("selectAll")}${this._selectedTasks.size ? ` (${this._selectedTasks.size} ${this._t("selected")})` : ""}</label>
            ${this._selectedTasks.size ? `<button type="button" class="clear-selection">${this._t("cancel")}</button>` : ""}
            <input class="task-filter" type="search" aria-label="${this._t("filterTasks")}" placeholder="${this._t("filterTasks")}" value="${this._escape(this._search)}">
          </div>
          ${
            this._selectedTasks.size
              ? `
            <div class="bulk-actions">
              <div class="bulk-group">
                <span class="bulk-group-title">${this._t("project")}</span>
                <div class="bulk-project-actions">
                  <select class="bulk-project" aria-label="${this._t("moveToProject")}"><option value="">${this._t("moveToProject")}</option>${bulkProjectOptions}</select>
                  <button data-action="bulk-new-project">${this._t("moveToNewProject")}</button>
                </div>
              </div>
              <div class="bulk-group">
                <span class="bulk-group-title">${this._t("categories")}</span>
                <details class="category-picker">
                  <summary>${this._t("chooseCategories")} (${this._bulkLabels.size})</summary>
                  <div class="category-options">${bulkLabelChoices || `<span>${this._t("noCategories")}</span>`}</div>
                </details>
                <div class="category-actions">
                  <button data-action="bulk-add-category" ${this._bulkLabels.size ? "" : "disabled"}>${this._t("addCategories")}</button>
                  <button data-action="bulk-remove-category" ${this._bulkLabels.size ? "" : "disabled"}>${this._t("removeCategories")}</button>
                </div>
              </div>
              <div class="bulk-group">
                <span class="bulk-group-title">${this._t("taskActions")}</span>
                <div class="task-actions">
                  ${hasActiveSelected ? `<button data-action="bulk-complete">${this._t("markComplete")}</button>` : ""}
                  ${hasCompletedSelected ? `<button data-action="bulk-restore">${this._t("markActive")}</button>` : ""}
                  <button data-action="copy-selected">${this._t("copyAsText")}</button>
                  <button data-action="bulk-delete" class="danger">${this._t("deleteTasks")}</button>
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
            ? `<div class="status">${this._t("loading")}</div>`
            : `
          <div class="list active-list">${active.map((task) => this._taskRow(task, reserveColorSpace)).join("")}<div class="empty active-empty" ${active.length ? "hidden" : ""}>${this._t("noActive")}</div></div>
          <details class="completed"><summary>${this._t("completed")} (<span class="completed-count">${completed.length}</span>)</summary><div class="list">${completed.map((task) => this._taskRow(task, reserveColorSpace)).join("")}<div class="empty completed-empty" ${completed.length ? "hidden" : ""}>${this._t("noCompleted")}</div></div></details>
        `
        }
        <div class="card-links">
          ${this._vikunjaUrl ? `<a class="card-link" href="${this._escape(this._projectVikunjaUrl())}" target="_blank" rel="noopener noreferrer">${this._t("openVikunja")}</a>` : ""}
          <a class="card-link" href="/vikunja-static/tips.html?lang=${encodeURIComponent(this._language())}&v=0.32.1" target="_blank" rel="noopener noreferrer">${this._t("tips")}</a>
          <a class="card-link" href="https://github.com/tednv/vikunja-task-hub" target="_blank" rel="noopener noreferrer">${this._t("aboutRepository")}</a>
          <a class="card-link" href="https://buymeacoffee.com/tednv" target="_blank" rel="noopener noreferrer">${this._t("support")}</a>
        </div>
      </ha-card>
      ${this._editingTask ? this._taskDialog(this._editingTask) : ""}
      ${this._deleteRequest ? this._deleteDialog(this._deleteRequest) : ""}
      ${this._contextMenu ? this._contextMenuTemplate() : ""}`;
    this._wireEvents();
  }

  _taskRow(task, reserveColorSpace = Boolean(task.hex_color)) {
    const recurring = Number(task.repeat_after) > 0 || Number(task.repeat_mode) === 1;
    const priority = Math.max(0, Math.min(5, Number(task.priority) || 0));
    const labels = (this._data?.labels ?? []).filter((label) =>
      task.labels.map(String).includes(String(label.id)),
    );
    const progress = Math.max(0, Math.min(100, Math.round(Number(task.percent_done) * 100)));
    const comments = this._comments.get(Number(task.id));
    const timer = this._data?.time_tracking?.[String(task.id)];
    const scheduledActions = timer?.scheduled_actions ?? [];
    const elapsed = Number(timer?.elapsed ?? 0) + (timer?.state === "active" ? Math.max(0, Math.floor((Date.now() - this._dataReceivedAt) / 1000)) : 0);
    return `<div class="task-shell ${reserveColorSpace ? "reserve-color" : ""}">
    <div class="row ${task.done ? "done" : ""}" data-task="${task.id}" data-search-title="${this._escape(task.title.toLocaleLowerCase())}">
      ${task.hex_color ? `<span class="task-color" style="background:#${this._escape(task.hex_color)}" title="${this._t("color")}"></span>` : reserveColorSpace ? `<span class="task-color-spacer" aria-hidden="true"></span>` : ""}
      <input type="checkbox" aria-label="${this._t("selectTask")}" ${this._selectedTasks.has(Number(task.id)) ? "checked" : ""}>
      <button type="button" class="body" aria-label="${this._t("editTask")}"><div class="summary">${recurring ? `<span class="recurring-icon" title="${this._t("recurringTask")}" aria-label="${this._t("recurringTask")}">↻</span>` : ""}${priority ? `<span class="priority-marker" title="${this._t("priority")}: ${priority}">${"!".repeat(priority)}</span>` : ""}${this._escape(task.title)}</div>${labels.length ? `<div class="task-labels">${labels.map((label) => `<span class="task-label" style="${label.color ? `border-left:3px solid #${this._escape(label.color)}` : ""}">${this._escape(label.title)}</span>`).join("")}</div>` : ""}${task.description ? `<div class="description">${this._escape(this._plainText(task.description))}</div>` : ""}</button>
      ${progress > 0 ? `<div class="progress-wrap" title="${this._t("progress")}: ${progress}%"><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><div class="progress-text">${progress}%</div></div>` : "<span></span>"}
    </div>
    ${timer ? `<button type="button" class="timer-toggle" aria-expanded="${this._openTimers.has(Number(task.id))}">${this._openTimers.has(Number(task.id)) ? "▾" : "▸"} ${this._t("timer")} (<span class="timer-state-icon">${timer.state === "active" ? "⏱" : "⏸"}</span> <span class="timer-elapsed" data-base="${Number(timer.elapsed ?? 0)}" data-snapshot="${this._dataReceivedAt}" data-active="${timer.state === "active"}">${this._formatElapsed(elapsed)}</span>)</button>` : ""}
    ${timer && this._openTimers.has(Number(task.id)) ? `<div class="timer-panel" data-task="${task.id}">
      <div class="timer-controls">
        ${scheduledActions.length ? `<div class="timer-schedules">${scheduledActions.map((scheduled) => `<div class="timer-schedule-item"><span>${this._t(scheduled.action === "stop" ? "stopTimer" : scheduled.action === "pause" ? "pauseTimer" : "startTimer")} · ${this._escape(this._formatDateTime(scheduled.at))}</span><button type="button" data-schedule-id="${this._escape(scheduled.id)}">${this._t("cancel")}</button></div>`).join("")}</div>` : ""}
        <label class="timer-note-field">${this._t("timerNote")}<textarea class="timer-note-input" rows="3" maxlength="500">${this._escape(timer.note ?? "")}</textarea></label>
        <div class="timer-schedule-row">
          <label>${this._t("action")}<select class="timer-action-input"><option value="start">${this._t("startTimer")}</option><option value="pause">${this._t("pauseTimer")}</option><option value="stop">${this._t("stopTimer")}</option></select></label>
          <label>${this._t("pickerType")}<select class="timer-picker-type"><option value="minutes">${this._t("minutes")}</option><option value="seconds">${this._t("seconds")}</option><option value="timestamp">${this._t("timestamp")}</option></select></label>
          <label>${this._t("scheduleValue")}<input class="timer-picker-value" type="number" min="1" step="1"></label>
        </div>
        <div class="timer-actions">
          <button type="button" data-timer-action="${timer.state === "active" ? "pause" : "start"}">${timer.state === "active" ? this._t("pauseTimer") : this._t("startTimer")}</button>
          <button type="button" data-timer-action="save">${this._t("save")}</button>
          <button type="button" data-timer-action="done">${this._t("stopTimer")}</button>
          <button type="button" class="danger" data-timer-action="cancel">${this._t("cancel")}</button>
        </div>
      </div>
    </div>` : ""}
    ${Number(task.comment_count) > 0 ? `<button type="button" class="comment-toggle" aria-expanded="${this._openComments.has(Number(task.id))}">${this._openComments.has(Number(task.id)) ? "▾" : "▸"} ${this._t("comments")} (${Number(task.comment_count)})</button>` : ""}
    ${Number(task.comment_count) > 0 && this._openComments.has(Number(task.id)) ? `<div class="comments-panel">${comments === undefined ? this._t("loading") : comments.map((comment) => `<div class="comment"><div class="comment-meta">${this._escape(comment.author || this._t("comments"))}${comment.created ? ` · <span class="comment-time">${this._escape(this._formatDateTime(comment.created))}</span>` : ""}</div><div class="comment-text">${this._escape(comment.comment)}</div></div>`).join("")}</div>` : ""}
    </div>`;
  }

  _contextMenuTemplate() {
    const task = this._data?.tasks.find(
      (item) => Number(item.id) === Number(this._contextMenu.taskId),
    );
    if (!task) return "";
    const timer = this._data?.time_tracking?.[String(task.id)];
    return `<div class="context-menu" style="left:${this._contextMenu.x}px;top:${this._contextMenu.y}px" data-task="${task.id}">
      <button type="button" data-context="complete">${task.done ? this._t("markActive") : this._t("markComplete")}</button>
      ${timer ? "" : `<button type="button" data-context="time-add">${this._t("addTimer")}</button>`}
      ${Number(task.priority) < 5 ? `<button type="button" data-context="priority-up">${this._t("priority")} +</button>` : ""}
      ${Number(task.priority) > 0 ? `<button type="button" data-context="priority-down">${this._t("priority")} −</button><button type="button" data-context="priority-clear">${this._t("priority")} 0</button>` : ""}
      <label class="context-color">${this._t("color")}<input class="context-color-input" type="color" value="#${this._escape(task.hex_color || "1976d2")}"></label>
      <button type="button" data-context="copy">${this._t("copyAsText")}</button>
      <button type="button" data-context="share">${this._t("share")}</button>
      <button type="button" class="danger" data-context="delete">${this._t("deleteTask")}</button>
    </div>`;
  }

  _positionContextMenu() {
    const menu = this.shadowRoot.querySelector(".context-menu");
    if (!menu || !this._contextMenu) return;
    const margin = 8;
    const rect = menu.getBoundingClientRect();
    const x = Math.max(margin, Math.min(this._contextMenu.x, window.innerWidth - rect.width - margin));
    const below = window.innerHeight - this._contextMenu.y - margin;
    const preferredY = rect.height <= below
      ? this._contextMenu.y
      : this._contextMenu.y - rect.height;
    const y = Math.max(margin, Math.min(preferredY, window.innerHeight - rect.height - margin));
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  _taskDialog(task) {
    const due = task.due ? String(task.due).slice(0, 10) : "";
    const recurrence = this._recurrenceValues(task);
    const progress = Math.max(0, Math.min(100, Math.round(Number(task.percent_done) * 100)));
    const color = /^[0-9A-Fa-f]{6}$/.test(task.hex_color ?? "") ? task.hex_color : "1976d2";
    const categoryOptions = (this._data?.labels ?? [])
      .map(
        (label) =>
          `<label><input type="checkbox" name="labels" value="${label.id}" ${task.labels.map(String).includes(String(label.id)) ? "checked" : ""}> <span>${this._escape(label.title)}</span></label>`,
      )
      .join("");
    const attachments = (task.attachments ?? [])
      .map(
        (attachment) => `<div class="attachment-row" data-attachment="${attachment.id}">
      <div class="attachment-name" title="${this._escape(attachment.name)}">${this._escape(attachment.name)} <span class="attachment-meta">(${this._formatBytes(attachment.size)})</span></div>
      <button type="button" class="download-attachment">${this._t("download")}</button>
      <button type="button" class="danger delete-attachment">${this._t("delete")}</button>
    </div>`,
      )
      .join("");
    const comments = this._comments.get(Number(task.id));
    const commentRows = comments?.map((comment) => `<div class="editor-comment" data-comment="${comment.id}">
      <div><div class="comment-meta">${this._escape(comment.author || this._t("comments"))}${comment.created ? ` · <span class="comment-time">${this._escape(this._formatDateTime(comment.created))}</span>` : ""}</div><div class="comment-text">${this._escape(comment.comment)}</div></div>
      <button type="button" class="danger delete-comment">${this._t("deleteComment")}</button>
    </div>`).join("");
    return `<div class="modal-backdrop" role="dialog" aria-label="${this._t("editTask")}">
      <form class="dialog edit-task-form">
        <h2>${this._t("editTask")}</h2>
        <label class="field">${this._t("title")}<input name="title" value="${this._escape(task.title)}" required></label>
        <div class="field description-field">
          <span>${this._t("description")}</span>
          <div class="editor-tabs"><button type="button" class="preview-toggle">${this._t("preview")}</button></div>
          <div class="description-edit-pane">
            <div class="format-toolbar" aria-label="${this._t("description")}">
              <button type="button" data-format="heading" title="${this._t("heading")}" aria-label="${this._t("heading")}">H</button><button type="button" data-format="bold" title="${this._t("bold")}" aria-label="${this._t("bold")}">B</button><button type="button" data-format="italic" title="${this._t("italic")}" aria-label="${this._t("italic")}"><i>I</i></button>
              <button type="button" data-format="bullet" title="${this._t("bulletedList")}" aria-label="${this._t("bulletedList")}">•</button><button type="button" data-format="numbered" title="${this._t("numberedList")}" aria-label="${this._t("numberedList")}">1.</button><button type="button" data-format="quote" title="${this._t("quote")}" aria-label="${this._t("quote")}">❯</button>
              <button type="button" data-format="link" title="${this._t("link")}" aria-label="${this._t("link")}">🔗</button><button type="button" data-format="code" title="${this._t("inlineCode")}" aria-label="${this._t("inlineCode")}">&lt;/&gt;</button>
            </div>
            <textarea class="description-editor" name="description">${this._escape(task.description ?? "")}</textarea>
          </div>
          <div class="description-preview" hidden><ha-markdown></ha-markdown></div>
        </div>
        <label class="field">${this._t("dueDate")}<input name="due" type="date" value="${this._escape(due)}"></label>
        <div class="field recurrence-grid">
          <label>${this._t("priority")}<select name="priority">${[0, 1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${Number(task.priority) === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
          <label>${this._t("progress")} <output class="progress-output">${progress}%</output><input name="progress" type="range" min="0" max="100" step="10" value="${progress}"></label>
        </div>
        <label class="check-field"><input name="use_color" type="checkbox" ${task.hex_color ? "checked" : ""}> ${this._t("color")} <input name="color" type="color" value="#${color}"></label>
        <div class="field recurrence-grid">
          <label>${this._t("recurrence")}<select name="repeat_preset">
            <option value="none" ${recurrence.preset === "none" ? "selected" : ""}>${this._t("noRepeat")}</option>
            <option value="daily" ${recurrence.preset === "daily" ? "selected" : ""}>${this._t("daily")}</option>
            <option value="weekly" ${recurrence.preset === "weekly" ? "selected" : ""}>${this._t("weekly")}</option>
            <option value="monthly" ${recurrence.preset === "monthly" ? "selected" : ""}>${this._t("monthly")}</option>
            <option value="custom" ${recurrence.preset === "custom" ? "selected" : ""}>${this._t("customInterval")}</option>
          </select></label>
          <label class="repeat-basis">${this._t("basedOn")}<select name="repeat_mode">
            <option value="0" ${recurrence.mode === 0 ? "selected" : ""}>${this._t("scheduledDate")}</option>
            <option value="2" ${recurrence.mode === 2 ? "selected" : ""}>${this._t("completionDate")}</option>
          </select></label>
          <div class="recurrence-custom">
            <label>${this._t("every")}<input name="repeat_amount" type="number" min="1" max="10000" step="1" value="${recurrence.amount}"></label>
            <label>${this._t("customInterval")}<select name="repeat_unit">
              <option value="3600" ${recurrence.unit === 3600 ? "selected" : ""}>${this._t("hours")}</option>
              <option value="86400" ${recurrence.unit === 86400 ? "selected" : ""}>${this._t("days")}</option>
              <option value="604800" ${recurrence.unit === 604800 ? "selected" : ""}>${this._t("weeks")}</option>
            </select></label>
          </div>
        </div>
        <div class="field"><span>${this._t("labels")}</span><div class="category-options">${categoryOptions || `<span>${this._t("noCategories")}</span>`}</div></div>
        <section class="attachments">
          <h3>${this._t("attachments")} (${(task.attachments ?? []).length})</h3>
          <div class="attachment-list">${attachments || `<span class="attachment-meta">${this._t("noAttachments")}</span>`}</div>
          <div class="attachment-actions">
            <button type="button" class="take-photo">${this._t("addPhoto")}</button>
            <button type="button" class="record-video">${this._t("addVideo")}</button>
            <button type="button" class="choose-files">${this._t("chooseFiles")}</button>
          </div>
          <input class="capture-input photo-input" type="file" accept="image/*" capture="environment">
          <input class="capture-input video-input" type="file" accept="video/*" capture="environment">
          <input class="capture-input file-input" type="file" multiple>
          <div class="attachment-meta">${this._t("filesUpload")}</div>
        </section>
        <section class="comments-editor">
          <h3>${this._t("comments")} (${comments?.length ?? Number(task.comment_count ?? 0)})</h3>
          <div class="editor-comments-list">${comments === undefined ? this._t("loading") : commentRows || this._t("noComments")}</div>
          <textarea class="new-comment" aria-label="${this._t("addComment")}" placeholder="${this._t("commentPlaceholder")}"></textarea>
          <button type="button" class="add-comment">${this._t("addComment")}</button>
        </section>
        <label class="check-field"><input name="done" type="checkbox" ${task.done ? "checked" : ""}> ${this._t("completedLabel")}</label>
        <div class="dialog-actions">
          <button type="button" class="danger delete delete-editor-task">${this._t("deleteTask")}</button>
          <button type="button" class="cancel-editor">${this._t("cancel")}</button>
          <button type="submit">${this._t("saveChanges")}</button>
        </div>
      </form>
    </div>`;
  }

  _deleteDialog(request) {
    if (request.type === "tasks") {
      return `<div class="modal-backdrop" role="dialog" aria-label="${this._t("deleteTasks")}">
        <form class="dialog bulk-delete-confirmation-form">
          <h2>${this._t("deleteTasks")}?</h2>
          <p class="delete-impact"><strong>${request.count} ${this._t("selected")}</strong>. ${this._t("permanentWarning")}</p>
          <div class="dialog-actions"><button type="button" class="cancel-delete">${this._t("cancel")}</button><button type="submit" class="danger">${this._t("deleteTasks")}</button></div>
        </form>
      </div>`;
    }
    const deleteLabel = request.type === "project" ? this._t("deleteProject") : this._t("deleteCategory");
    const impactControls =
      request.count > 0
        ? `
        <p>${this._t("affected")}: <strong>${request.count}</strong>.</p>
        <label class="check-field"><input name="delete_tasks" type="checkbox"> ${this._t("deleteTasks")}: ${request.count}</label>
        <p class="delete-impact">${
          request.type === "project"
            ? `${this._t("moveToProject")}: <strong>Inbox</strong>.`
            : `${this._t("removeCategories")}: <strong>${request.count}</strong>.`
        }</p>`
        : "";
    return `<div class="modal-backdrop" role="dialog" aria-label="${deleteLabel}">
      <form class="dialog delete-confirmation-form">
        <h2>${deleteLabel}: “${this._escape(request.title)}”?</h2>
        ${impactControls}
        <div class="dialog-actions">
          <button type="button" class="cancel-delete">${this._t("cancel")}</button>
          <button type="submit" class="danger">${deleteLabel}</button>
        </div>
      </form>
    </div>`;
  }

  _wireEvents() {
    const root = this.shadowRoot;
    root.querySelector('[data-role="project-select"]')?.addEventListener("change", (event) => {
      this._selectedProject = event.target.value;
      this._selectedLabel = "all";
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      this._rememberSelection();
      this._render();
    });
    root.querySelector('[data-role="category-select"]')?.addEventListener("change", (event) => {
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
    root.querySelector(".clear-selection")?.addEventListener("click", () => {
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      this._render();
    });
    root.querySelector(".task-filter")?.addEventListener("input", (event) => {
      this._search = event.target.value;
      this._applySearchFilter();
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
    root.querySelectorAll(".task-shell").forEach((shell) => {
      const row = shell.querySelector(".row");
      const taskId = Number(row.dataset.task);
      let longPressTimer;
      const cancelLongPress = () => clearTimeout(longPressTimer);
      const openMenu = (event) => {
        event.preventDefault();
        this._contextMenu = {
          taskId,
          x: event.clientX,
          y: event.clientY,
        };
        this._render();
        this._positionContextMenu();
      };
      row.addEventListener("contextmenu", openMenu);
      row.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.target.matches('input,button,.task-color')) return;
        longPressTimer = setTimeout(() => openMenu(event), 550);
      });
      row.addEventListener("pointerup", cancelLongPress);
      row.addEventListener("pointercancel", cancelLongPress);
      row.addEventListener("pointermove", cancelLongPress);
      const colorBubble = row.querySelector(".task-color");
      let colorPressStarted;
      let colorCleared = false;
      const cancelColorLongPress = () => {
        colorPressStarted = undefined;
      };
      const clearColor = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (colorCleared) return;
        colorCleared = true;
        void this._action("task_update", { task_id: taskId, hex_color: "" });
      };
      colorBubble?.addEventListener("contextmenu", clearColor);
      colorBubble?.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        colorPressStarted = Date.now();
      });
      colorBubble?.addEventListener("pointerup", (event) => {
        event.stopPropagation();
        const heldFor = colorPressStarted === undefined ? 0 : Date.now() - colorPressStarted;
        cancelColorLongPress();
        if (heldFor >= 550) clearColor(event);
      });
      colorBubble?.addEventListener("pointercancel", cancelColorLongPress);
      colorBubble?.addEventListener("pointermove", cancelColorLongPress);
      row.querySelector('input[type="checkbox"]')?.addEventListener("change", (event) => {
        if (event.target.checked) this._selectedTasks.add(taskId);
        else this._selectedTasks.delete(taskId);
        this._render();
      });
      shell.querySelector(".comment-toggle")?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (this._openComments.has(taskId)) {
          this._openComments.delete(taskId);
          this._render();
        } else {
          this._openComments.add(taskId);
          void this._loadComments(taskId);
        }
      });
      shell.querySelector(".timer-toggle")?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (this._openTimers.has(taskId)) this._openTimers.delete(taskId);
        else this._openTimers.add(taskId);
        this._render();
      });
      shell.querySelectorAll("[data-timer-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const panel = button.closest(".timer-panel");
          const timer_note = String(panel?.querySelector(".timer-note-input")?.value ?? "").trim();
          const action = button.dataset.timerAction;
          if (action === "pause")
            void this._action("time_pause", { task_id: taskId, timer_note });
          else if (action === "start")
            void this._action("time_start", { task_id: taskId, timer_note });
          else if (action === "save") {
            const timer_action = panel?.querySelector(".timer-action-input")?.value;
            const pickerType = panel?.querySelector(".timer-picker-type")?.value;
            const pickerValue = panel?.querySelector(".timer-picker-value")?.value;
            let scheduled_at;
            if (pickerValue && pickerType === "timestamp")
              scheduled_at = new Date(pickerValue).toISOString();
            else if (pickerValue && ["minutes", "seconds"].includes(pickerType)) {
              const multiplier = pickerType === "minutes" ? 60000 : 1000;
              scheduled_at = new Date(Date.now() + Number(pickerValue) * multiplier).toISOString();
            }
            if (scheduled_at)
              void this._action("time_schedule_action", {
                task_id: taskId,
                timer_note,
                timer_action,
                scheduled_at,
              });
            else void this._action("time_note", { task_id: taskId, timer_note });
          }
          else if (action === "done")
            void this._action("time_done", { task_id: taskId, timer_note });
          else if (
            action === "cancel" &&
            confirm(`${this._t("cancelTimer")}? ${this._t("permanentWarning")}`)
          ) {
            this._openTimers.delete(taskId);
            void this._action("time_cancel", { task_id: taskId });
          }
        });
      });
      shell.querySelectorAll("[data-schedule-id]").forEach((button) => {
        button.addEventListener("click", () => {
          void this._action("time_cancel_schedule", {
            task_id: taskId,
            schedule_id: button.dataset.scheduleId,
          });
        });
      });
      shell.querySelector(".timer-picker-type")?.addEventListener("change", (event) => {
        const input = shell.querySelector(".timer-picker-value");
        if (!input) return;
        input.type = event.target.value === "timestamp" ? "datetime-local" : "number";
        input.value = "";
      });
      row.querySelector(".body")?.addEventListener("click", () => {
        this._editingTask = this._data?.tasks.find((task) => Number(task.id) === taskId);
        this._render();
        void this._loadComments(taskId);
      });
    });
    root.querySelectorAll(".context-menu [data-context]").forEach((button) => {
      button.addEventListener("click", () => {
        const task = this._data?.tasks.find(
          (item) => Number(item.id) === Number(this._contextMenu?.taskId),
        );
        const action = button.dataset.context;
        this._contextMenu = undefined;
        if (!task) return this._render();
        if (action === "complete")
          void this._action("task_update", { task_id: Number(task.id), done: !task.done });
        else if (action === "priority-up")
          void this._action("task_update", {
            task_id: Number(task.id),
            priority: Math.min(5, Number(task.priority ?? 0) + 1),
          });
        else if (action === "priority-down")
          void this._action("task_update", {
            task_id: Number(task.id),
            priority: Math.max(0, Number(task.priority ?? 0) - 1),
          });
        else if (action === "priority-clear")
          void this._action("task_update", { task_id: Number(task.id), priority: 0 });
        else if (action === "time-add") {
          this._openTimers.add(Number(task.id));
          void this._action("time_create", { task_id: Number(task.id) });
        }
        else if (action === "copy") void this._copyTask(task);
        else if (action === "share") void this._shareTask(task);
        else if (
          action === "delete" &&
          confirm(`${this._t("deleteTask")}? ${this._t("permanentWarning")}`)
        )
          void this._action("task_delete", { task_id: Number(task.id) });
        else this._render();
      });
    });
    root.querySelector(".context-color-input")?.addEventListener("change", (event) => {
      const task_id = Number(this._contextMenu?.taskId);
      const hex_color = String(event.target.value).replace(/^#/, "");
      this._contextMenu = undefined;
      if (Number.isFinite(task_id) && /^[0-9A-Fa-f]{6}$/.test(hex_color))
        void this._action("task_update", { task_id, hex_color });
      else this._render();
    });
    root.querySelector("ha-card")?.addEventListener("click", (event) => {
      if (this._contextMenu && !event.composedPath().some((item) => item?.classList?.contains("context-menu"))) {
        this._contextMenu = undefined;
        this._render();
      }
    });
    this._applySearchFilter();
    const editor = root.querySelector(".edit-task-form");
    const description = editor?.querySelector('[name="description"]');
    const preview = editor?.querySelector(".description-preview");
    const markdown = preview?.querySelector("ha-markdown");
    const updatePreview = () => {
      if (markdown) markdown.content = description?.value ?? "";
    };
    updatePreview();
    const repeatPreset = editor?.querySelector('[name="repeat_preset"]');
    const progressInput = editor?.querySelector('[name="progress"]');
    progressInput?.addEventListener("input", () => {
      const output = editor.querySelector(".progress-output");
      if (output) output.value = `${progressInput.value}%`;
    });
    const colorInput = editor?.querySelector('[name="color"]');
    const useColor = editor?.querySelector('[name="use_color"]');
    colorInput?.addEventListener("input", () => {
      if (useColor) useColor.checked = true;
    });
    const syncRecurrence = () => {
      const preset = repeatPreset?.value ?? "none";
      const custom = editor?.querySelector(".recurrence-custom");
      const basis = editor?.querySelector(".repeat-basis");
      if (custom) custom.hidden = preset !== "custom";
      if (basis) basis.hidden = preset === "none" || preset === "monthly";
    };
    repeatPreset?.addEventListener("change", syncRecurrence);
    syncRecurrence();
    editor?.querySelector(".preview-toggle")?.addEventListener("click", (event) => {
      const showPreview = preview.hidden;
      editor.querySelector(".description-edit-pane").hidden = showPreview;
      preview.hidden = !showPreview;
      event.currentTarget.textContent = showPreview
        ? this._t("backDescription")
        : this._t("preview");
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
      const label_ids = Array.from(editor.querySelectorAll('[name="labels"]:checked')).map(
        (input) => Number(input.value),
      );
      const task_id = Number(this._editingTask.id);
      const recurrence = this._recurrenceFromForm(form);
      this._editingTask = undefined;
      void this._action("task_update", {
        task_id,
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? ""),
        due: String(form.get("due") ?? "") || null,
        done: form.get("done") === "on",
        repeat_after: recurrence.repeatAfter,
        repeat_mode: recurrence.repeatMode,
        priority: Number(form.get("priority") ?? 0),
        percent_done: Number(form.get("progress") ?? 0) / 100,
        hex_color: form.get("use_color") === "on"
          ? String(form.get("color") ?? "").replace("#", "")
          : "",
        label_ids,
      });
    });
    editor?.querySelector(".cancel-editor")?.addEventListener("click", () => {
      this._editingTask = undefined;
      this._render();
    });
    editor?.querySelector(".delete-editor-task")?.addEventListener("click", () => {
      const task_id = Number(this._editingTask.id);
      if (confirm(`${this._t("deleteTask")}? ${this._t("permanentWarning")}`)) {
        this._editingTask = undefined;
        void this._action("task_delete", { task_id });
      }
    });
    editor?.querySelector(".add-comment")?.addEventListener("click", async () => {
      const task_id = Number(this._editingTask.id);
      const input = editor.querySelector(".new-comment");
      const comment = input.value.trim();
      if (!comment) return;
      await this._action("comment_create", { task_id, comment });
      this._comments.delete(task_id);
      await this._loadComments(task_id);
    });
    editor?.querySelectorAll(".editor-comment").forEach((row) => {
      row.querySelector(".delete-comment")?.addEventListener("click", async () => {
        if (!confirm(`${this._t("deleteComment")}? ${this._t("permanentWarning")}`)) return;
        const task_id = Number(this._editingTask.id);
        await this._action("comment_delete", {
          task_id,
          comment_id: Number(row.dataset.comment),
        });
        this._comments.delete(task_id);
        await this._loadComments(task_id);
      });
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
        if (confirm(`${this._t("delete")}: "${attachment.name}"? ${this._t("permanentWarning")}`))
          void this._action("attachment_delete", {
            task_id: Number(this._editingTask.id),
            attachment_id,
          });
      });
    });
    const deleteForm = root.querySelector(".delete-confirmation-form");
    deleteForm?.querySelector('[name="delete_tasks"]')?.addEventListener("change", (event) => {
      const request = this._deleteRequest;
      deleteForm.querySelector(".delete-impact").innerHTML = event.target.checked
        ? `${this._t("deleteTasks")}: <strong>${request.count}</strong>. ${this._t("permanentWarning")}`
        : request.type === "project"
          ? `${this._t("moveToProject")}: <strong>Inbox</strong>.`
          : `${this._t("removeCategories")}: <strong>${request.count}</strong>.`;
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
    root.querySelector('[data-action="bulk-new-project"]')?.addEventListener("click", () => {
      const title = prompt(this._t("newProjectName"));
      if (!title?.trim()) return;
      const task_ids = [...this._selectedTasks];
      void this._action("project_create", { title, task_ids });
    });
    root.querySelector(".category-options")?.addEventListener("change", (event) => {
      if (!event.target.matches('input[type="checkbox"]')) return;
      if (event.target.checked) this._bulkLabels.add(event.target.value);
      else this._bulkLabels.delete(event.target.value);
      const summary = root.querySelector(".category-picker summary");
      if (summary) summary.textContent = `${this._t("chooseCategories")} (${this._bulkLabels.size})`;
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
    root.querySelector('[data-action="copy-selected"]')?.addEventListener("click", (event) => {
      void this._copySelectedTasks(event.currentTarget);
    });
    root.querySelector('[data-action="bulk-delete"]')?.addEventListener("click", () => {
      this._deleteRequest = { type: "tasks", count: this._selectedTasks.size };
      this._render();
    });
    root.querySelector('[data-action="new-project"]')?.addEventListener("click", () => {
      const title = prompt(this._t("newProjectName"));
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
      const title = prompt(this._t("newCategoryName"));
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

  _applySearchFilter() {
    const root = this.shadowRoot;
    if (!root) return;
    const search = this._search.trim().toLocaleLowerCase();
    let activeCount = 0;
    let completedCount = 0;
    root.querySelectorAll(".row").forEach((row) => {
      const matches = !search || row.dataset.searchTitle.includes(search);
      row.hidden = !matches;
      row.closest(".task-shell").hidden = !matches;
      if (matches) {
        if (row.classList.contains("done")) completedCount += 1;
        else activeCount += 1;
      }
    });
    const activeEmpty = root.querySelector(".active-empty");
    if (activeEmpty) activeEmpty.hidden = activeCount > 0;
    const completedEmpty = root.querySelector(".completed-empty");
    if (completedEmpty) completedEmpty.hidden = completedCount > 0;
    const completedCountNode = root.querySelector(".completed-count");
    if (completedCountNode) completedCountNode.textContent = String(completedCount);
    const visibleIds = this._filteredTasks().map((task) => Number(task.id));
    const selectVisible = root.querySelector(".select-visible");
    if (selectVisible) {
      selectVisible.disabled = visibleIds.length === 0;
      selectVisible.checked =
        visibleIds.length > 0 && visibleIds.every((taskId) => this._selectedTasks.has(taskId));
    }
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

  async _copySelectedTasks(button) {
    const tasks = (this._data?.tasks ?? []).filter((task) =>
      this._selectedTasks.has(Number(task.id)),
    );
    const text = tasks
      .map((task) => {
        const description = this._plainText(task.description ?? "").trim();
        return description ? `${task.title}\n${description}` : task.title;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = this._t("copied");
    } catch (error) {
      this._error = error?.message ?? this._t("copyFailed");
      this._render();
    }
  }

  _taskText(task) {
    const description = this._plainText(task.description ?? "").trim();
    return description ? `${task.title}\n${description}` : task.title;
  }

  async _copyTask(task) {
    try {
      await navigator.clipboard.writeText(this._taskText(task));
    } catch (error) {
      this._error = error?.message ?? this._t("copyFailed");
    }
    this._render();
  }

  async _shareTask(task) {
    const shareData = { title: task.title, text: this._taskText(task) };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(shareData.text);
    } catch (error) {
      if (error?.name !== "AbortError") this._error = error?.message ?? this._t("shareFailed");
    }
    this._render();
  }

  async _loadComments(taskId) {
    this._render();
    if (this._comments.has(taskId) || !this._hass) return;
    try {
      const result = await this._hass.callWS({
        type: "vikunja/dashboard/comments",
        ...(this._config.entry_id ? { entry_id: this._config.entry_id } : {}),
        task_id: taskId,
      });
      this._comments.set(taskId, result?.comments ?? []);
    } catch (error) {
      this._comments.set(taskId, []);
      this._error = error?.message ?? String(error);
    }
    this._render();
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

  _formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(this._language(), {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  _formatElapsed(value) {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":");
  }

  _updateElapsedTimers() {
    this.shadowRoot?.querySelectorAll('.timer-elapsed[data-active="true"]').forEach((timer) => {
      const elapsed = Number(timer.dataset.base) + Math.max(0, Math.floor((Date.now() - Number(timer.dataset.snapshot)) / 1000));
      timer.textContent = this._formatElapsed(elapsed);
    });
  }

  async _subscribeTimeTracking() {
    if (!this._hass?.connection?.subscribeEvents || this._unsubscribeTimeTracking) return;
    this._unsubscribeTimeTracking = await this._hass.connection.subscribeEvents((event) => {
      if (this._config.entry_id && event.data?.entry_id !== this._config.entry_id) return;
      void this._load();
    }, "vikunja_time_tracking_updated");
  }

  _recurrenceValues(task) {
    const repeatAfter = Math.max(0, Number(task.repeat_after) || 0);
    const mode = Number(task.repeat_mode) === 2 ? 2 : Number(task.repeat_mode) === 1 ? 1 : 0;
    if (mode === 1) return { preset: "monthly", amount: 1, unit: 86400, mode: 1 };
    if (!repeatAfter) return { preset: "none", amount: 1, unit: 86400, mode: 0 };
    if (repeatAfter === 86400) return { preset: "daily", amount: 1, unit: 86400, mode };
    if (repeatAfter === 604800) return { preset: "weekly", amount: 1, unit: 604800, mode };
    const unit = repeatAfter % 604800 === 0 ? 604800 : repeatAfter % 86400 === 0 ? 86400 : 3600;
    return { preset: "custom", amount: Math.max(1, repeatAfter / unit), unit, mode };
  }

  _recurrenceFromForm(form) {
    const preset = String(form.get("repeat_preset") ?? "none");
    if (preset === "none") return { repeatAfter: 0, repeatMode: 0 };
    if (preset === "monthly") return { repeatAfter: 0, repeatMode: 1 };
    const repeatMode = Number(form.get("repeat_mode")) === 2 ? 2 : 0;
    if (preset === "daily") return { repeatAfter: 86400, repeatMode };
    if (preset === "weekly") return { repeatAfter: 604800, repeatMode };
    const amount = Math.min(10000, Math.max(1, Math.floor(Number(form.get("repeat_amount")) || 1)));
    const unit = [3600, 86400, 604800].includes(Number(form.get("repeat_unit")))
      ? Number(form.get("repeat_unit"))
      : 86400;
    return { repeatAfter: amount * unit, repeatMode };
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
      this._error = `${oversized.name} ${this._t("fileTooLarge")}`;
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
