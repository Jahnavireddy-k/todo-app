const taskInput = document.getElementById('taskInput');
const taskTime = document.getElementById('taskTime');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const alarmSound = document.getElementById('alarmSound');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function renderTasks() {
    taskList.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed');

        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        taskInfo.addEventListener('click', () => toggleTask(index));

        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.textContent = task.text;

        taskInfo.appendChild(textSpan);

        if (task.isRepeating) {
            const timeSpan = document.createElement('span');
            timeSpan.className = 'task-time-badge';
            timeSpan.textContent = `🔄 Repeats every ${task.intervalMinutes} mins`;
            taskInfo.appendChild(timeSpan);
        } else if (task.time) {
            const timeSpan = document.createElement('span');
            timeSpan.className = 'task-time-badge';
            timeSpan.textContent = `⏰ Due at ${task.time}`;
            taskInfo.appendChild(timeSpan);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(index);
        });

        li.appendChild(taskInfo);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });

    updateStats();
    saveToLocalStorage();
}

function addTask() {
    const text = taskInput.value.trim();
    const time = taskTime.value;

    if (text === '') return;

    // Check if user wants a repeating interval (e.g., "drink water every 30 min")
    const repeatMatch = text.match(/every (\d+)\s*(min|mins|minute|minutes)/i);

    let newTask = {
        text: text,
        time: time,
        completed: false,
        alarmTriggered: false
    };

    if (repeatMatch) {
        const minutes = parseInt(repeatMatch[1]);
        newTask.isRepeating = true;
        newTask.intervalMinutes = minutes;
        newTask.nextTriggerTime = Date.now() + minutes * 60 * 1000;
    }

    tasks.push(newTask);

    taskInput.value = '';
    taskTime.value = '';
    renderTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
}

function updateStats() {
    const remaining = tasks.filter(t => !t.completed).length;
    taskCount.textContent = `${remaining} task${remaining === 1 ? '' : 's'} remaining`;
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Alarm & Repeating Timer Checker (Runs every second)
setInterval(() => {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;
    const nowMs = Date.now();

    tasks.forEach(task => {
        if (task.completed) return;

        // 1. Repeating interval trigger
        if (task.isRepeating && nowMs >= task.nextTriggerTime) {
            alarmSound.play();
            alert(`🚨 REMINDER: ${task.text}!`);
            // Reset timer for next cycle
            task.nextTriggerTime = Date.now() + task.intervalMinutes * 60 * 1000;
            saveToLocalStorage();
        } 
        // 2. Specific clock time trigger
        else if (!task.isRepeating && task.time === currentTime && !task.alarmTriggered) {
            task.alarmTriggered = true;
            alarmSound.play();
            alert(`🚨 ALARM: Time to ${task.text}!`);
            saveToLocalStorage();
        }
    });
}, 1000);

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

renderTasks();