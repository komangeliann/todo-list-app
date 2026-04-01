// VARIABLES
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let filter = "all";
let editIndex = null;
let dragStartIndex = null;
let importedData = [];

// LOCAL STORAGE
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}


// ADD TASK 
function addTask() {
    let input = document.getElementById("taskInput");
    let dueDate = document.getElementById("dueDate");
    let priority = document.getElementById("priority");

    if (input.value === "") {
        showToast("Task cannot be empty", "error");
        return;
    } 

    tasks.push({
        text: input.value,
        completed: false,
        dueDate: dueDate.value,
        priority: priority.value
    });

    input.value = "";
    dueDate.value = "";

    saveTasks();
    showTasks();
    showToast("Task added", "success");
}


// SHOW TASKS 
function showTasks() {
    let list = document.getElementById("taskList");
    list.innerHTML = "";

    let searchValue = document.getElementById("searchInput")?.value.toLowerCase() || "";
    let sortOption = document.getElementById("sortOption")?.value;

    let filteredTasks = [...tasks];

    // FILTER (status)
    filteredTasks = filteredTasks.filter(task => {
        if (filter === "active") return !task.completed;
        if (filter === "completed") return task.completed;
        return true;
    });

    // SEARCH
    filteredTasks = filteredTasks.filter(task =>
        task.text.toLowerCase().includes(searchValue)
    );

    // SORT
    if (sortOption === "date") {
        filteredTasks.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    }

    if (sortOption === "priority") {
        const priorityOrder = { High: 1, Medium: 2, Low: 3 };
        filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    // RENDER
    filteredTasks.forEach((task, index) => {
        let realIndex = tasks.indexOf(task);

        let li = document.createElement("li");
        li.setAttribute("draggable", true);
        li.dataset.index = realIndex;

        // DRAG EVENTS
        li.addEventListener("dragstart", handleDragStart);
        li.addEventListener("dragover", handleDragOver);
        li.addEventListener("drop", handleDrop);
        li.addEventListener("dragend", handleDragEnd);

        if (task.priority === "High") li.classList.add("high");
        if (task.priority === "Medium") li.classList.add("medium");
        if (task.priority === "Low") li.classList.add("low");

        let span = document.createElement("span");

        let today = new Date().toISOString().split("T")[0];
        let dueColor = "";

        if (task.dueDate && task.dueDate < today) {
            dueColor = "overdue";
        }

        span.innerHTML = `
            <strong>${task.text}</strong><br>
            <small class="${dueColor}">Due: ${task.dueDate || "-"}</small>
            <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
        `;

        if (task.completed) span.classList.add("completed");

        let btnDiv = document.createElement("div");
        btnDiv.classList.add("task-buttons");

        if (!task.completed) {
            let doneBtn = document.createElement("button");
            doneBtn.innerHTML = '<i class="fa fa-check"></i>';
            doneBtn.onclick = () => toggleComplete(realIndex);
            btnDiv.appendChild(doneBtn);
        }

        let editBtn = document.createElement("button");
        editBtn.innerHTML = '<i class="fa fa-pen"></i>';
        editBtn.onclick = () => editTask(realIndex);
        btnDiv.appendChild(editBtn);

        let delBtn = document.createElement("button");
        delBtn.innerHTML = '<i class="fa fa-trash"></i>';
        delBtn.onclick = () => deleteTask(realIndex);
        btnDiv.appendChild(delBtn);

        li.appendChild(span);
        li.appendChild(btnDiv);
        list.appendChild(li);
    });

    updateTaskCount();
    updateProgressBar();
}

// DRAG & DROP
function handleDragStart(e) {
    dragStartIndex = this.dataset.index;
    this.classList.add("dragging");
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    let dragEndIndex = this.dataset.index;

    if (dragStartIndex === dragEndIndex) return;

    // SWAP POSITION
    let temp = tasks[dragStartIndex];
    tasks.splice(dragStartIndex, 1);
    tasks.splice(dragEndIndex, 0, temp);

    saveTasks();
    showTasks();
}

function handleDragEnd() {
    document.querySelectorAll("li").forEach(li =>
        li.classList.remove("dragging")
    );
}

// EXPORT
function exportTasks() {
    if (tasks.length === 0) {
        showToast("No tasks to export", "error");
        return;
    }

    let dataStr = JSON.stringify(tasks, null, 2);
    
    let blob = new Blob([dataStr], { type: "application/json" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    let date = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `tasks-${date}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

// IMPORT
function importTasks(event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();

    reader.onload = function(e) {
        try {
            let data = JSON.parse(e.target.result);

            if (!Array.isArray(data)) {
                showToast("Invalid JSON format", "error");
                return;
            }

            importedData = data;

            // SHOW IMPORT MODAL
            document.getElementById("importModal").style.display = "flex";

        } catch (error) {
            showToast("Error reading file", "error");
        }
    };

    reader.readAsText(file);

    event.target.value = "";
}

// CONFIRM IMPORT
function confirmImport(type) {
    if (type === "replace") {
        tasks = importedData;
    }

    if (type === "merge") {
        tasks = [...tasks, ...importedData];
    }

    saveTasks();
    showTasks();
    closeImportModal();
    showToast("Tasks imported successfully", "success");
}

// CLOSE IMPORT MODAL
function closeImportModal() {
    let modal = document.getElementById("importModal");
    
    modal.classList.add("closing");

    setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove("closing");
        importedData = [];
    }, 200);
}

// TASK ACTIONS 
function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    showTasks();
    showToast("Task updated", "info");
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    showTasks();
    showToast("Task deleted", "success");
}

// TOAST
function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");

    let toast = document.createElement("div");
    toast.classList.add("toast", type);

    let icon = {
        success: "✔",
        error: "✖",
        info: "ℹ"
    };

    toast.innerHTML = `<strong>${icon[type]}</strong> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastOut 0.3s ease forwards";
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}


// EDIT TASK 
function editTask(index) {
    editIndex = index;

    document.getElementById("editTaskInput").value = tasks[index].text;
    document.getElementById("editDueDate").value = tasks[index].dueDate;
    document.getElementById("editPriority").value = tasks[index].priority;

    document.getElementById("editModal").style.display = "flex";
}

function saveEdit() {
    if (editIndex === null) return;

    let newText = document.getElementById("editTaskInput").value;

    if (newText.trim() === "") {
        showToast("Task cannot be empty", "error");
        return;
    }

    tasks[editIndex].text = newText;
    tasks[editIndex].dueDate = document.getElementById("editDueDate").value;
    tasks[editIndex].priority = document.getElementById("editPriority").value;

    saveTasks();
    closeEditModal();
    showTasks();
    showToast("Task updated", "success");
}

function closeEditModal() {
    let modal = document.getElementById("editModal");

    modal.classList.add("closing");

    setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove("closing");
        editIndex = null;
    }, 200);
}


// FILTER 
function filterTasks(type) {
    filter = type;
    showTasks();
}

function updateTaskCount() {
    let count = 0;

    tasks.forEach(task => {
        if (filter === "all") count++;
        if (filter === "active" && !task.completed) count++;
        if (filter === "completed" && task.completed) count++;
    });

    document.getElementById("taskCount").innerText =
        `Showing ${count} ${filter} tasks`;
}


// PROGRESS BAR 
function updateProgressBar() {
    let completed = tasks.filter(t => t.completed).length;
    let total = tasks.length;

    let percent = total === 0 ? 0 : (completed / total) * 100;

    document.getElementById("progressBar").style.width = percent + "%";
}


// DARK MODE
function toggleDarkMode() {
    document.body.classList.toggle("dark");
}


// EVENTS
window.onclick = function(event) {
    let editModal = document.getElementById("editModal");
    let importModal = this.document.getElementById("importModal");

    if (event.target === editModal) closeEditModal();
    if (event.target === importModal) closeImportModal();
};

document.getElementById("editTaskInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        saveEdit();
    }
});


// INIT 
showTasks();