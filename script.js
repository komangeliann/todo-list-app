function addTask() {
  let input = document.getElementById("taskInput");
  let task = input.value;

  if (task === "") return;

  let li = document.createElement("li");
  li.innerText = task;

  li.onclick = function () {
      li.remove();
  };

  document.getElementById("taskList").appendChild(li);

  input.value = "";
}

let tasks = [];

function addTask() {
    let input = document.getElementById("taskInput");
    let task = input.value;

    if (task === "") return;

    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    showTasks();
    input.value = "";
}

function showTasks() {
    let list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    tasks.forEach((task, index) => {
        let li = document.createElement("li");
        li.innerText = task;

        li.onclick = function () {
            deleteTask(index);
        };

        list.appendChild(li);
    });
}

function deleteTask(index) {
    tasks.splice(index, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    showTasks();
}

showTasks();