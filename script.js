// VARIABLES
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let filter = "all";
let editIndex = null;


// LOCAL STORAGE
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}


// ADD TASK 
function addTask() {
    let input = document.getElementById("taskInput");
    let dueDate = document.getElementById("dueDate");
    let priority = document.getElementById("priority");

    if (input.value === "") return;

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
}


// SHOW TASKS 
function showTasks() {
    let list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach((task, index) => {
        if (filter === "active" && task.completed) return;
        if (filter === "completed" && !task.completed) return;

        let li = document.createElement("li");

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
            doneBtn.onclick = () => toggleComplete(index);
            btnDiv.appendChild(doneBtn);
        }

        let editBtn = document.createElement("button");
        editBtn.innerHTML = '<i class="fa fa-pen"></i>';
        editBtn.onclick = () => editTask(index);
        btnDiv.appendChild(editBtn);

        let delBtn = document.createElement("button");
        delBtn.innerHTML = '<i class="fa fa-trash"></i>';
        delBtn.onclick = () => deleteTask(index);
        btnDiv.appendChild(delBtn);

        li.appendChild(span);
        li.appendChild(btnDiv);
        list.appendChild(li);
    });

    updateTaskCount();
    updateProgressBar();
}


// TASK ACTIONS 
function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    showTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    showTasks();
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
        alert("Task cannot be empty");
        return;
    }

    tasks[editIndex].text = newText;
    tasks[editIndex].dueDate = document.getElementById("editDueDate").value;
    tasks[editIndex].priority = document.getElementById("editPriority").value;

    saveTasks();
    closeModal();
    showTasks();
}

function closeModal() {
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
    let modal = document.getElementById("editModal");
    if (event.target === modal) {
        closeModal();
    }
};

document.getElementById("editTaskInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        saveEdit();
    }
});


// INIT 
showTasks();