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

function updateCycleIndicator() {
  const dots = document.querySelectorAll(".cycleDot");
  dots.forEach((dot, index) => {
    if (index < sessionCount % 4) {
      dot.classList.add("filled");
    } else {
      dot.classList.remove("filled");
    }
  });
}

// Pomodoro config
const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;

let isWorking = true;
let timeRemaining = WORK_DURATION;
let timerRunning = false;
let intervalID = null;
let sessionCount = 0;
let isPaused = false;


document.getElementById("pauseResumeButton").addEventListener("click", () => {
  if (!timerRunning) return;

  isPaused = !isPaused;
  document.getElementById("pauseResumeButton").textContent = isPaused ? "▶️ Resume" : "⏸️ Pause";
});

document.getElementById("toggleModeButton").addEventListener("click", () => {
  clearInterval(intervalID);
  timerRunning = false;
  isPaused = false;
  document.getElementById("pauseResumeButton").textContent = "⏸️ Pause";
  startButton.disabled = false;

  switchMode();
  updateDisplay();
});

startButton.addEventListener("click", startTimer);

let gameInterval;
let lives = 9;
let coins = 0;
let gameRunning = false;
const canvas = document.getElementById("catGameCanvas");
const ctx = canvas.getContext("2d");
const statsDisplay = document.getElementById("gameStats");

const cat = { x: 50, y: 150, width: 30, height: 30, dy: 0, jumping: false };
const obstacles = [];
const powerUps = [];
const gravity = 0.8;

function startCatGame() {
  if (gameRunning || isWorking) return;

  document.getElementById("catGameContainer").style.display = "block";
  lives = 9;
  coins = 0;
  obstacles.length = 0;
  powerUps.length = 0;
  cat.y = 150;
  cat.dy = 0;
  gameRunning = true;
  gameInterval = setInterval(updateGame, 1000 / 60);
}

function stopCatGame() {
  clearInterval(gameInterval);
  gameRunning = false;
  document.getElementById("catGameContainer").style.display = "none";
}

function drawRect(obj, color) {
  ctx.fillStyle = color;
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
}

function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  cat.dy += gravity;
  cat.y += cat.dy;
  if (cat.y >= 150) {
    cat.y = 150;
    cat.dy = 0;
    cat.jumping = false;
  }
  drawRect(cat, "#fbc531");

  if (Math.random() < 0.01) {
    const height = 30 + Math.random() * 20;
    obstacles.push({ x: 800, y: 200 - height, width: 20, height });
  }
  obstacles.forEach((ob, i) => {
    ob.x -= 2.5;
    drawRect(ob, "red");
    if (checkCollision(cat, ob)) {
      lives--;
      obstacles.splice(i, 1);
      if (lives <= 0) {
        stopCatGame();
        alert("Game over! Your cat used all 9 lives!");
      }
    }
  });

  if (Math.random() < 0.01) {
    powerUps.push({ x: 800, y: 140, width: 20, height: 20 });
  }
  powerUps.forEach((pu, i) => {
    pu.x -= 4;
    drawRect(pu, "blue");
    if (checkCollision(cat, pu)) {
      coins += 1;
      powerUps.splice(i, 1);
    }
  });

  statsDisplay.textContent = `Lives: ${lives} | Coins: ${coins}`;
}

function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !cat.jumping) {
    cat.dy = -14;
    cat.jumping = true;
  }
});

document.getElementById("playGameButton").addEventListener("click", () => {
  if (!gameRunning) startCatGame();
});

function switchMode() {
  isWorking = !isWorking;

  if (isWorking) {
    sessionCount++;
    timeRemaining = WORK_DURATION;
    stopCatGame();
    document.getElementById("playGameButton").style.display = "none";
  } else {
    timeRemaining = (sessionCount > 0 && sessionCount % 4 === 0)
      ? LONG_BREAK_DURATION
      : BREAK_DURATION;
    // Don't start game here — wait for user to press button
    document.getElementById("playGameButton").style.display = "block";
  }

  updateCatImage();
  updateButtonLabel();
  updateCycleIndicator();

  if (isWorking) workSound.play();
  else breakSound.play();
}
function updateWordProgress() {
  const container = document.getElementById("wordChart");
  container.innerHTML = "";

  let totalWritten = 0;
  let totalTarget = 0;

  Object.entries(writingGoals).forEach(([section, target]) => {
    const actual = userWordCounts[section] || 0;
    totalWritten += actual;
    totalTarget += target;

    const row = document.createElement("div");
    row.style.margin = "6px 0";

    const label = document.createElement("span");
    label.textContent = `${section}: ${actual} / ${target}`;
    label.style.fontWeight = "bold";
    label.style.color = actual > target ? "red" : "inherit";

    row.appendChild(label);
    container.appendChild(row);
  });

  document.getElementById("moodPrompt").style.display = isWorking ? "none" : "block";
  // Progress bar
  const barWrapper = document.createElement("div");
  barWrapper.style.marginTop = "10px";
  barWrapper.style.background = "#ddd";
  barWrapper.style.borderRadius = "10px";
  barWrapper.style.overflow = "hidden";
  barWrapper.style.height = "20px";

  const percent = Math.min((totalWritten / totalTarget) * 100, 100);
  const bar = document.createElement("div");
  bar.style.width = `${percent}%`;
  bar.style.height = "100%";
  bar.style.background = percent >= 100 ? "green" : "#4caf50";

  barWrapper.appendChild(bar);
  container.appendChild(barWrapper);

  // Optional text under bar
  const summary = document.createElement("div");
  summary.style.fontSize = "0.9em";
  summary.style.marginTop = "4px";
  summary.textContent = `Total: ${totalWritten} / ${totalTarget} words`;

  container.appendChild(summary);
}

updateCycleIndicator();

const reminders = {
  lifeadmin: "Sort your life out!",
  litreview: "There's always more to read!",
  cleaning: "Focus on cleaning your data!",
  analysis: "Keep digging into those patterns!",
  writing: "Just write. Even badly. Edit later.",
  editing: "Tighten those arguments and optimise the flow!"
};

modeReminder.textContent = reminders[taskModeSelect.value];

let modeTimeTracker = {
  cleaning: 0,
  litreview: 0,
  analysis: 0,
  writing: 0,
  editing: 0,
  lifeadmin: 0
};

const writingGoals = {
  Introduction: 500,
  "Literature Review": 2500,
  Methodology: 2000,
  Results: 3000,
  Discussion: 1500,
  Conclusion: 500
};

let userWordCounts = {};
Object.keys(writingGoals).forEach(section => userWordCounts[section] = 0);

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

function updateTimeTrackerDisplay() {
  const tracker = document.getElementById("timeTrackerDisplay");

  const formatMinutes = seconds => `${Math.floor(seconds / 60)} min`;

  tracker.innerHTML = `
    <strong>Time Spent:</strong><br>
    Life Admin: ${formatMinutes(modeTimeTracker.lifeadmin)}<br>
    Lit Review: ${formatMinutes(modeTimeTracker.litreview)}<br>
    Cleaning: ${formatMinutes(modeTimeTracker.cleaning)}<br>
    Analysis: ${formatMinutes(modeTimeTracker.analysis)}<br>
    Writing: ${formatMinutes(modeTimeTracker.writing)}<br>
    Editing: ${formatMinutes(modeTimeTracker.editing)}
  `;
}

function startTimer() {
  if (timerRunning) return;

  timerRunning = true;
  startButton.disabled = true;

  intervalID = setInterval(() => {
    if (isPaused) return;

    timeRemaining--;
    updateDisplay();

    const currentMode = taskModeSelect.value;
    modeTimeTracker[currentMode] += 1;
    updateTimeTrackerDisplay();


    if (timeRemaining <= 0) {
      clearInterval(intervalID);
      timerRunning = false;
      sessionCount++;
      updateCycleIndicator();
      switchMode();
      updateDisplay();
      startButton.disabled = false;
    }
  }, 1000);
  // Give XP every minute (not paused)
if (!isPaused && timeRemaining % 60 === 0) {
  gainExperience(2);
}
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

// Levelling up

const levelUpSound = new Audio("assets/level_up.mp3");
levelUpSound.onerror = () => console.warn("Level-up sound missing");

if (!document.getElementById("levelUpOverlay")) {
  const overlayDiv = document.createElement("div");
  overlayDiv.id = "levelUpOverlay";
  document.body.appendChild(overlayDiv);
}

// Level logic variables
let level = 1;
let experience = 0;

function getXPForLevel(lvl) {
  return 10 * lvl + 5 * (lvl - 1); // Nonlinear growth
}

function rewardForLevel(lvl) {
  return 5 + Math.floor(lvl / 2); // Increase coins gradually
}

function updateXPDisplay() {
  const nextXP = getXPForLevel(level + 1);
  document.getElementById("xpLevelDisplay").textContent = `🐾 LVL ${level} | XP: ${experience} / ${nextXP}`;
}


function checkLevelUp() {
  const requiredXP = getXPForLevel(level + 1);
  if (experience >= requiredXP) {
    level++;
    const coinsEarned = rewardForLevel(level);
    coins += coinsEarned;
    showLevelUpAnimation(level, coinsEarned);
  }
  updateXPDisplay();
}


function showLevelUpAnimation(level, coinsEarned) {
  const overlay = document.getElementById("levelUpOverlay");
  if (!overlay) return;

  overlay.innerHTML = `
    <div>
      🎉 Level Up!<br>
      You’re now level ${level}!<br>
      🪙 +${coinsEarned} coins
    </div>
  `;
  overlay.style.display = "block";

  const sound = new Audio("assets/levelup.mp3");
  sound.play().catch(e => console.warn("Could not play sound:", e));

  setTimeout(() => {
    overlay.style.display = "none";
    overlay.innerHTML = "";
  }, 3000);
}

function updateStatsDisplay() {
  const statsDisplay = document.getElementById("gameStats");
  if (statsDisplay) {
    statsDisplay.textContent = `Lives: ${lives} | Coins: ${coins} | XP: ${experience} | Level: ${level}`;
  }
}

// Motivational messages
const motivationalMessages = [
  "You’ve got this!",
  "Every word counts!",
  "Break it into chunks!",
  "Progress, not perfection!",
  "Trust the process!",
  "Just think how hard this would be if you were a clam!"
];

let currentMessageIndex = 0;

function updateCatMessage() {
  const speech = document.getElementById("catSpeech");
  speech.textContent = motivationalMessages[currentMessageIndex];
  speech.style.display = "block";

  // Hide after 1 minute
  setTimeout(() => {
    speech.style.display = "none";
  }, 60 * 1000);

  // Schedule next message in 5–10 min
  const nextDelay = (5 + Math.random() * 5) * 60 * 1000; // 5–10 minutes
  setTimeout(() => {
    currentMessageIndex = (currentMessageIndex + 1) % motivationalMessages.length;
    updateCatMessage();
  }, nextDelay);
}

// Start on load
window.addEventListener("load", () => {
  setTimeout(updateCatMessage, 5000); // first message after 5s
});



// Initial Setup
updateCountdown();
updateDisplay();
updateCatImage();
updateButtonLabel();
renderTasks();
