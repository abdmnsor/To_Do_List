// ===== STATE =====
let currentFilter = "all";
let editingTaskId = null;

// ===== INIT =====
window.onload = function () {
  loadTasks();
  setupFilters();
  setupEnterKey();
};

// ===== LOCAL STORAGE HELPERS =====
function getTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function setTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ===== ADD TASK =====
function addTask() {
  const taskInput = document.getElementById("taskInput");
  const taskText = taskInput.value.trim();

  if (taskText === "") {
    taskInput.focus();
    taskInput.style.borderColor = "var(--accent)";
    setTimeout(() => {
      taskInput.style.borderColor = "";
    }, 800);
    return;
  }

  const task = {
    id: Date.now(),
    text: taskText,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const tasks = getTasks();
  tasks.push(task);
  setTasks(tasks);

  taskInput.value = "";
  taskInput.focus();
  renderTasks();
}

// ===== DELETE TASK =====
function deleteTask(taskId) {
  const tasks = getTasks().filter((t) => t.id !== taskId);
  setTasks(tasks);
  renderTasks();
}

// ===== TOGGLE COMPLETE =====
function toggleComplete(taskId, isChecked) {
  const tasks = getTasks();
  tasks.forEach((t) => {
    if (t.id === taskId) t.completed = isChecked;
  });
  setTasks(tasks);
  updateStats();
  applyFilter();
}

// ===== EDIT TASK =====
function openEditModal(taskId) {
  const tasks = getTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  editingTaskId = taskId;
  const editInput = document.getElementById("editInput");
  editInput.value = task.text;

  const modal = document.getElementById("editModal");
  modal.style.display = "flex";
  requestAnimationFrame(() => modal.classList.add("show"));
  setTimeout(() => editInput.focus(), 50);
}

function closeModal() {
  const modal = document.getElementById("editModal");
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
    editingTaskId = null;
  }, 250);
}

function saveEdit() {
  const newText = document.getElementById("editInput").value.trim();
  if (!newText || editingTaskId === null) return;

  const tasks = getTasks();
  tasks.forEach((t) => {
    if (t.id === editingTaskId) t.text = newText;
  });
  setTasks(tasks);

  closeModal();
  renderTasks();
}

// ===== CLEAR COMPLETED =====
document.getElementById("clearDoneBtn").addEventListener("click", () => {
  const tasks = getTasks().filter((t) => !t.completed);
  setTasks(tasks);
  renderTasks();
});

// ===== FILTERS =====
function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      currentFilter = this.dataset.filter;
      applyFilter();
    });
  });
}

function applyFilter() {
  const items = document.querySelectorAll(".task-item");
  items.forEach((item) => {
    const completed = item.dataset.completed === "true";
    if (currentFilter === "all") {
      item.style.display = "";
    } else if (currentFilter === "pending") {
      item.style.display = completed ? "none" : "";
    } else if (currentFilter === "completed") {
      item.style.display = completed ? "" : "none";
    }
  });

  // Show empty state if nothing visible
  const taskList = document.getElementById("taskList");
  const visibleItems = [...taskList.querySelectorAll(".task-item")].filter(
    (el) => el.style.display !== "none",
  );

  let emptyState = document.getElementById("emptyState");
  if (visibleItems.length === 0) {
    if (!emptyState) {
      emptyState = document.createElement("div");
      emptyState.id = "emptyState";
      emptyState.className = "empty-state";
      emptyState.innerHTML = `<span class="empty-icon">☁</span><p>Nothing here yet!</p>`;
      taskList.appendChild(emptyState);
    }
    emptyState.style.display = "flex";
  } else if (emptyState) {
    emptyState.style.display = "none";
  }
}

// ===== STATS =====
function updateStats() {
  const tasks = getTasks();
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const pending = total - done;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("doneCount").textContent = done;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("progressBar").style.width = pct + "%";
  document.getElementById("progressPercent").textContent = pct + "%";
}

// ===== RENDER =====
function renderTasks() {
  const tasks = getTasks();
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state" id="emptyState">
        <span class="empty-icon">☁</span>
        <p>No tasks yet. Add one above!</p>
      </div>`;
    updateStats();
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = "task-item";
    item.dataset.id = task.id;
    item.dataset.completed = task.completed;

    item.innerHTML = `
      <label class="task-checkbox-wrap">
        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
        <span class="checkbox-visual"></span>
      </label>
      <span class="task-text ${task.completed ? "done" : ""}">${escapeHtml(task.text)}</span>
      <div class="task-actions">
        <button class="action-btn edit-btn" title="Edit task">✎</button>
        <button class="action-btn delete-btn" title="Delete task">✕</button>
      </div>
    `;

    // Checkbox toggle
    item
      .querySelector(".task-checkbox")
      .addEventListener("change", function () {
        item.dataset.completed = this.checked;
        const textEl = item.querySelector(".task-text");
        textEl.classList.toggle("done", this.checked);
        toggleComplete(task.id, this.checked);
      });

    // Edit
    item.querySelector(".edit-btn").addEventListener("click", () => {
      openEditModal(task.id);
    });

    // Delete
    item.querySelector(".delete-btn").addEventListener("click", () => {
      item.style.animation = "fadeOut 0.25s ease forwards";
      setTimeout(() => deleteTask(task.id), 240);
    });

    taskList.appendChild(item);
  });

  updateStats();
  applyFilter();
}

// Alias for onload compatibility
function loadTasks() {
  renderTasks();
}

// ===== ENTER KEY =====
function setupEnterKey() {
  document.getElementById("taskInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  document.getElementById("editInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") closeModal();
  });

  // Close modal on overlay click
  document.getElementById("editModal").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });
}

// ===== UTILS =====
function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
