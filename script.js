/* =========================
    STATE
========================= */
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let filter = "all";
let editIndex = null;
let dragStartIndex = null;
let importedData = [];

let currentPriority = "Low";
let currentSort = "default";
let editPriorityValue = "Low";

/* =========================
    STORAGE
========================= */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* =========================
    DROPDOWN HANDLER (REUSABLE)
========================= */
function initDropdown(dropdownId, onSelect) {
    const dropdown = document.getElementById(dropdownId);
    const selected = dropdown.querySelector(".dropdown-selected");
    const options = dropdown.querySelectorAll(".dropdown-options div");

    selected.addEventListener("click", () => {
        dropdown.classList.toggle("active");
    });

    options.forEach(option => {
        option.addEventListener("click", () => {
            onSelect(option.dataset.value, option.innerText);

            selected.innerHTML = `
                ${option.innerText}
                <i class="fa fa-chevron-down"></i>
            `;

            options.forEach(o => o.classList.remove("active"));
            option.classList.add("active");

            dropdown.classList.remove("active");
        });
    });

    window.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });
}

// INIT DROPDOWNS
initDropdown("sortDropdown", (value) => {
    currentSort = value;
    showTasks();
});

initDropdown("priorityDropdown", (value) => {
    currentPriority = value;
});

initDropdown("editPriorityDropdown", (value) => {
    editPriorityValue = value;
});

/* =========================
    ADD TASK
========================= */
function addTask() {
    const input = document.getElementById("taskInput");
    const dueDate = document.getElementById("dueDate");

    if (!input.value.trim()) {
        showToast("Task cannot be empty", "error");
        return;
    }

    tasks.push({
        text: input.value,
        completed: false,
        dueDate: dueDate.value,
        priority: currentPriority
    });

    input.value = "";
    dueDate.value = "";

    saveTasks();
    showTasks();
    showToast("Task added", "success");
}

/* =========================
    RENDER TASKS
========================= */
function showTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    let searchValue = document.getElementById("searchInput")?.value.toLowerCase() || "";

    let filtered = [...tasks];

    // FILTER
    filtered = filtered.filter(task => {
        if (filter === "active") return !task.completed;
        if (filter === "completed") return task.completed;
        return true;
    });

    // SEARCH
    filtered = filtered.filter(task =>
        task.text.toLowerCase().includes(searchValue)
    );

    // SORT
    if (currentSort === "date") {
        filtered.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    }

    if (currentSort === "priority") {
        const order = { High: 1, Medium: 2, Low: 3 };
        filtered.sort((a, b) => order[a.priority] - order[b.priority]);
    }

    // EMPTY STATE
    if (filtered.length === 0) {
        if (filtered.length === 0) {
            let message = "";

            if (filter === "active") {
                message = "You're all caught up!";
            } else if (filter === "completed") {
                message = "No task completed yet";
            } else {
                message = "No tasks found";
            }

            list.innerHTML = `
                <div class="empty-state">
                    <i class="fa fa-check-circle"></i>
                    <p>${message}</p>
                </div>
            `;
            updateTaskCount(filtered);
            return;
        }
    }

    // RENDER
    filtered.forEach(task => {
        const realIndex = tasks.findIndex(t => t === task);

        const li = document.createElement("li");
        li.draggable = true;
        li.dataset.index = realIndex;

        // DRAG EVENTS
        li.addEventListener("dragstart", handleDragStart);
        li.addEventListener("dragover", handleDragOver);
        li.addEventListener("drop", handleDrop);
        li.addEventListener("dragend", handleDragEnd);

        if (task.priority) li.classList.add(task.priority.toLowerCase());

        const today = new Date().toISOString().split("T")[0];
        const overdue = task.dueDate && task.dueDate < today ? "overdue" : "";

        const span = document.createElement("span");
        span.innerHTML = `
            <strong>${task.text}</strong><br>
            <small class="${overdue}">Due: ${task.dueDate || "-"}</small>
            <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
        `;

        if (task.completed) span.classList.add("completed");

        const actions = document.createElement("div");
        actions.classList.add("task-buttons");

        if (!task.completed) {
            const doneBtn = createBtn("fa-check", () => toggleComplete(realIndex));
            actions.appendChild(doneBtn);
        }

        const editBtn = createBtn("fa-pen", () => editTask(realIndex));
        const delBtn = createBtn("fa-trash", () => deleteTask(realIndex));

        actions.append(editBtn, delBtn);
        li.append(span, actions);
        list.appendChild(li);
    });

    updateTaskCount(filtered);
    updateProgressBar();
}

/* =========================
    BUTTON FACTORY
========================= */
function createBtn(icon, handler) {
    const btn = document.createElement("button");
    btn.innerHTML = `<i class="fa ${icon}"></i>`;
    btn.onclick = handler;
    return btn;
}

/* =========================
    DRAG & DROP
========================= */
function handleDragStart() {
    dragStartIndex = Number(this.dataset.index);
    this.classList.add("dragging");
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop() {
    const end = Number(this.dataset.index);
    if (dragStartIndex === end) return;

    const temp = tasks[dragStartIndex];
    tasks.splice(dragStartIndex, 1);
    tasks.splice(end, 0, temp);

    saveTasks();
    showTasks();
}

function handleDragEnd() {
    document.querySelectorAll("li").forEach(li =>
        li.classList.remove("dragging")
    );
}

/* =========================
    TASK ACTIONS
========================= */
function toggleComplete(i) {
    tasks[i].completed = !tasks[i].completed;
    saveTasks();
    showTasks();
    showToast("Task updated", "info");
}

function deleteTask(i) {
    tasks.splice(i, 1);
    saveTasks();
    showTasks();
    showToast("Task deleted", "success");
}

/* =========================
    EDIT
========================= */
function editTask(i) {
    editIndex = i;

    document.getElementById("editTaskInput").value = tasks[i].text;
    document.getElementById("editDueDate").value = tasks[i].dueDate;

    editPriorityValue = tasks[i].priority;

    document.getElementById("editModal").style.display = "flex";
}

function saveEdit() {
    if (editIndex === null) return;

    const text = document.getElementById("editTaskInput").value.trim();

    if (!text) {
        showToast("Task cannot be empty", "error");
        return;
    }

    tasks[editIndex].text = text;
    tasks[editIndex].dueDate = document.getElementById("editDueDate").value;
    tasks[editIndex].priority = editPriorityValue;

    saveTasks();
    closeEditModal();
    showTasks();
    showToast("Task updated", "success");
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
    editIndex = null;
}

/* =========================
    IMPORT / EXPORT
========================= */
function exportTasks() {
    if (!tasks.length) return showToast("No tasks to export", "error");

    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.json";
    a.click();

    URL.revokeObjectURL(url);
}

function importTasks(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw Error();

            importedData = data;
            document.getElementById("importModal").style.display = "flex";

        } catch {
            showToast("Invalid JSON", "error");
        }
    };

    reader.readAsText(file);
}

function confirmImport(type) {
    tasks = type === "replace" ? importedData : [...tasks, ...importedData];
    saveTasks();
    showTasks();
    closeImportModal();
}

function closeImportModal() {
    document.getElementById("importModal").style.display = "none";
}

/* =========================
    FILTER & UI
========================= */
function filterTasks(type) {
    filter = type;

    document.querySelectorAll(".filters button")
        .forEach(btn => btn.classList.remove("active"));

    document.getElementById("btn" + capitalize(type)).classList.add("active");

    showTasks();
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function updateTaskCount(filteredTasks) {
    let label = filter === "all" ? "" : filter + " ";

    document.getElementById("taskCount").innerText =
        `Showing ${filteredTasks.length} ${label}tasks`;
}

function updateProgressBar() {
    const done = tasks.filter(t => t.completed).length;
    const percent = tasks.length ? (done / tasks.length) * 100 : 0;

    document.getElementById("progressBar").style.width = percent + "%";
}

/* =========================
    TOAST
========================= */
function showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `${msg}`;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
}

/* =========================
    DARK MODE
========================= */
function toggleDarkMode() {
    document.body.classList.toggle("dark");
}

/* =========================
    INIT
========================= */
showTasks();