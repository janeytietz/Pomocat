// Element references
const timerDisplay = document.getElementById("timer");
const startButton = document.getElementById("startButton");
const catImage = document.getElementById("catImage");
const taskModeSelect = document.getElementById("taskMode");
const modeReminder = document.getElementById("modeReminder");
const writingGoalsDiv = document.getElementById("writingGoals");
const wordCountInputsDiv = document.getElementById("wordCountInputs");
const checklist = document.getElementById("checklist");
const taskForm = document.getElementById("newTaskForm");
const taskInput = document.getElementById("newTaskInput");
const clearCompletedBtn = document.getElementById("clearCompleted");

// Audio
const workSound = new Audio("assets/work_start.mp3");
const breakSound = new Audio("assets/break_start.mp3");
workSound.onerror = () => console.log("⚠️ Failed to load work sound");
breakSound.onerror = () => console.log("⚠️ Failed to load break sound");

// Dissertation countdown
function updateCountdown() {
  const countdownElement = document.getElementById("countdown");
  const dueDate = new Date("2025-08-12T23:59:59");
  const now = new Date();
  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  countdownElement.textContent = `Dissertation due in: ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}
updateCountdown();
setInterval(updateCountdown, 1000 * 60 * 60);

// Pomodoro config
const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;

let isWorking = true;
let timeRemaining = WORK_DURATION;
let timerRunning = false;
let intervalID = null;
let sessionCount = 0;

const reminders = {
  cleaning: "Focus on cleaning your data!",
  analysis: "Keep digging into those patterns!",
  writing: "Just write. Even badly. Edit later.",
  editing: "Tighten those arguments and smooth the flow!"
};

modeReminder.textContent = reminders[taskModeSelect.value];

let modeTimeTracker = {
  cleaning: 0,
  analysis: 0,
  writing: 0,
  editing: 0
};

const writingGoals = {
  Introduction: 500,
  "Literature Review": 2000,
  Methodology: 1500,
  Results: 2000,
  Discussion: 1500,
  Conclusion: 500
};

let userWordCounts = {};
Object.keys(writingGoals).forEach(section => userWordCounts[section] = 0);

// Chart.js setup
let chart;
function updateWordProgress() {
  const container = document.getElementById("wordChart");
  container.innerHTML = "";

  Object.entries(writingGoals).forEach(([section, target]) => {
    const actual = userWordCounts[section] || 0;

    const row = document.createElement("div");
    row.style.margin = "8px 0";

    const label = document.createElement("span");
    label.textContent = `${section}: ${actual} / ${target} `;

    const visual = document.createElement("span");
    if (actual > target) {
      visual.textContent = "💥 Over limit!";
    } else {
      const percent = actual / target;
      const filled = Math.round(percent * 5);
      const empty = 5 - filled;
      visual.textContent = "❤️".repeat(filled) + "🖤".repeat(empty);
    }

    row.appendChild(label);
    row.appendChild(visual);
    container.appendChild(row);
  });
}


function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(timeRemaining);
}

function updateCatImage() {
  catImage.src = isWorking ? "assets/cat_sleeping.gif" : "assets/cat_playing.gif";
  catImage.alt = isWorking ? "Cat Sleeping" : "Cat Playing";
}

function updateButtonLabel() {
  startButton.textContent = isWorking ? "Start Work" : "Start Break";
}

function switchMode() {
  isWorking = !isWorking;

  if (isWorking) {
    sessionCount++;
    timeRemaining = WORK_DURATION;
  } else {
    timeRemaining = sessionCount % 4 === 0 ? LONG_BREAK_DURATION : BREAK_DURATION;
    alert(`Nice work! You completed ${completedThisSession} tasks this session.`);
    completedThisSession = 0;
  }

  updateCatImage();
  updateButtonLabel();

  if (isWorking) workSound.play();
  else breakSound.play();
}

function startTimer() {
  if (timerRunning) return;

  timerRunning = true;
  startButton.disabled = true;

  intervalID = setInterval(() => {
    timeRemaining--;
    updateDisplay();

    const currentMode = taskModeSelect.value;
    modeTimeTracker[currentMode] += 1;

    if (timeRemaining <= 0) {
      clearInterval(intervalID);
      timerRunning = false;
      switchMode();
      updateDisplay();
      startButton.disabled = false;
    }
  }, 1000);
}

function renderWordCountInputs() {
  wordCountInputsDiv.innerHTML = "";

  Object.entries(writingGoals).forEach(([section, goal]) => {
    const container = document.createElement("div");

    const label = document.createElement("label");
    label.textContent = `${section} (target: ${goal}): `;
    label.htmlFor = section;

    const input = document.createElement("input");
    input.type = "number";
    input.id = section;
    input.value = userWordCounts[section];
    input.addEventListener("input", () => {
      userWordCounts[section] = Number(input.value);
      updateWordProgress();
    });

    container.appendChild(label);
    container.appendChild(input);
    wordCountInputsDiv.appendChild(container);
  });

  updateWordProgress();
}


taskModeSelect.addEventListener("change", () => {
  const mode = taskModeSelect.value;
  modeReminder.textContent = reminders[mode];

  if (mode === "writing" || mode == "editing") {
    writingGoalsDiv.style.display = "block";
    renderWordCountInputs();
    updateWordProgress();
  } else {
    writingGoalsDiv.style.display = "none";
  }
});

// Checklist logic
let tasks = JSON.parse(localStorage.getItem("pomocatTasks")) || [];
let completedThisSession = 0;

function saveTasks() {
  localStorage.setItem("pomocatTasks", JSON.stringify(tasks));
}

function renderTasks() {
  checklist.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.setAttribute("draggable", "true");
    li.dataset.index = index;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      if (checkbox.checked) completedThisSession++;
      saveTasks();
      renderTasks();
    });

    const text = document.createElement("span");
    text.textContent = task.text;
    if (task.done) {
      text.style.textDecoration = "line-through";
      text.style.opacity = "0.6";
    }

    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = "🗑️";
    deleteBtn.className = "delete-button";
    deleteBtn.addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    checklist.appendChild(li);
  });

  enableDragAndDrop();
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newTask = taskInput.value.trim();
  if (newTask) {
    tasks.push({ text: newTask, done: false });
    taskInput.value = "";
    saveTasks();
    renderTasks();
  }
});

clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  renderTasks();
});

function enableDragAndDrop() {
  const listItems = checklist.querySelectorAll("li");
  let draggedItem = null;

  listItems.forEach(item => {
    item.addEventListener("dragstart", () => {
      draggedItem = item;
    });

    item.addEventListener("dragover", e => {
      e.preventDefault();
      const draggingOver = e.currentTarget;
      checklist.insertBefore(draggedItem, draggingOver.nextSibling);
    });

    item.addEventListener("drop", () => {
      const newOrder = [];
      checklist.querySelectorAll("li").forEach(li => {
        const index = li.dataset.index;
        newOrder.push(tasks[Number(index)]);
      });
      tasks = newOrder;
      saveTasks();
      renderTasks();
    });
  });
}

// Initial Setup
updateCountdown();
updateDisplay();
updateCatImage();
updateButtonLabel();
renderTasks();
startButton.addEventListener("click", startTimer);
