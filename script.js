let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let filter = "all";

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateTaskCount() {
    document.getElementById("taskCount").innerText =
        tasks.length + " Tasks";
}

function addTask() {
    let input = document.getElementById("taskInput");
    if (input.value === "") return;

    tasks.push({ text: input.value, completed: false });
    input.value = "";
    saveTasks();
    showTasks();
}

function showTasks() {
    let list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach((task, index) => {
        if (filter === "active" && task.completed) return;
        if (filter === "completed" && !task.completed) return;

        let li = document.createElement("li");

        let span = document.createElement("span");
        span.innerText = task.text;
        if (task.completed) span.classList.add("completed");

        let btnDiv = document.createElement("div");
        btnDiv.classList.add("task-buttons");

        // DONE BUTTON hanya muncul jika belum completed
        if (!task.completed) {
            let doneBtn = document.createElement("button");
            doneBtn.innerText = "Done";
            doneBtn.onclick = () => toggleComplete(index);
            btnDiv.appendChild(doneBtn);
        }

        // DELETE BUTTON selalu ada
        let delBtn = document.createElement("button");
        delBtn.innerText = "X";
        delBtn.onclick = () => deleteTask(index);

        btnDiv.appendChild(delBtn);


        li.appendChild(span);
        li.appendChild(btnDiv);

        list.appendChild(li);
    });

    updateTaskCount();
}

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

function filterTasks(type) {
    filter = type;
    showTasks();
}

showTasks();

function toggleDarkMode() {
    document.body.classList.toggle("dark");
}