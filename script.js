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
let lastWorkDate = localStorage.getItem("lastWorkDate") || null;
let dailyStreak = parseInt(localStorage.getItem("dailyStreak") || "0");


// Audio
const workSound = new Audio("assets/work_start.mp3");
const breakSound = new Audio("assets/break_start.mp3");

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


function completeWorkSession() {
  gainXP(5);
  updateStreak();
  sessionCount++;
  updateCycleIndicator();
  saveStats();
}

//pomostats

let stats = {
  xp: 0,
  level: 1,
  totalMinutes: 0,
  lastActiveDate: null,
  streak: 0,
  modeTimeTracker: {
    cleaning: 0,
    lit_review: 0,
    analysis: 0,
    writing: 0,
    editing: 0,
    life_admin: 0
  }
};


function saveStats() {
  localStorage.setItem("pomocatStats", JSON.stringify(stats));
}

function startTimer() {
  if (timerRunning) return;

  timerRunning = true;
  isPaused = false;
  startButton.textContent = "Pause";

  intervalID = setInterval(() => {
    if (isPaused) return;
    timeRemaining--;
    updateDisplay();

    if (isWorking) {
  stats.totalMinutes++;
  const mode = taskModeSelect.value;
  stats.modeTimeTracker[mode] += 1;

  if (stats.totalMinutes % 60 === 0) {
    stats.xp += 1;
    checkLevelUp();
  }

  updateTimeTrackerDisplay();
  updateXPDisplay();
  saveStats();
}


    if (timeRemaining <= 0) {
      clearInterval(intervalID);
      timerRunning = false;
      startButton.textContent = "Start Work";
      if (isWorking) {
        completeWorkSession();
      } else {
        sessionCount++;
      }
      switchMode();
      updateDisplay();
      startButton.disabled = false;
    }
  }, 1000);
}

function updateXPDisplay() {
  const nextXP = stats.level * 50;
  const xpDisplay = document.getElementById("xpLevelDisplay");
  const streakDisplay = document.getElementById("dailyStreakDisplay");

  if (xpDisplay) {
    xpDisplay.textContent = ` LVL ${stats.level} | XP: ${stats.xp} / ${nextXP}`;
  }
  if (streakDisplay) {
    streakDisplay.textContent = `🔥 Daily Streak: ${stats.streak}`;
  }
}

function loadStats() {
  const storedStats = localStorage.getItem("pomocatStats");
  if (storedStats) {
    stats = JSON.parse(storedStats);
    updateXPDisplay();
  }
}


function checkLevelUp() {
  const xpNeeded = stats.level * 50;
  if (stats.xp >= xpNeeded) {
    stats.level++;
    stats.xp -= xpNeeded;
    showLevelUpAnimation(stats.level);
    saveStats();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // Existing setup
  loadStats();
  updateStreak();
  updateTimeTrackerDisplay();
  updateCountdown();
  updateDisplay();
  updateCatImage();
  updateButtonLabel();
  renderTasks();

  // Button listeners
  document.getElementById("toggleModeButton").addEventListener("click", () => {
    clearInterval(intervalID);
    timerRunning = false;
    isPaused = false;
    startButton.disabled = false;

    switchMode();
    updateDisplay();
  });

  document.getElementById("toggleTimeStats").addEventListener("click", () => {
    const timeStatsDiv = document.getElementById("bottomLeftPanel");
    const toggleBtn = document.getElementById("toggleTimeStats");

    timeStatsDiv.classList.toggle("hidden");
    toggleBtn.textContent = timeStatsDiv.classList.contains("hidden")
      ? "📊 View Time Spent"
      : "📉 Hide Time Spent";
  });

function toggleTimer() {
  if (!timerRunning) {
    startTimer();
    startButton.textContent = "Pause";
  } else if (isPaused) {
    isPaused = false;
    startButton.textContent = "Pause";
  } else {
    isPaused = true;
    startButton.textContent = "Resume";
  }
}

document.getElementById("startButton").addEventListener("click", toggleTimer);

  document.getElementById("playGameButton").addEventListener("click", () => {
    if (!gameRunning) startCatGame();
  });
});


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
    timeRemaining = WORK_DURATION;
    stopCatGame();
    document.getElementById("playGameButton").style.display = "none";
    workSound.play();
  } else {
    completeWorkSession();
    timeRemaining = (sessionCount > 0 && sessionCount % 4 === 0)
      ? LONG_BREAK_DURATION
      : BREAK_DURATION;
    document.getElementById("playGameButton").style.display = "block";
    breakSound.play();
  }

  updateCatImage();
  updateButtonLabel();
  updateCycleIndicator();
}

function logPomodoro(minutes = 25) {
  stats.totalMinutes += minutes;
  stats.xp += 10; // e.g., 10 XP per Pomodoro
  checkLevelUp();
  updateStreak();
  saveStats();
  updateStatsUI();
}

function checkLevelUp() {
  const xpNeeded = stats.level * 50; // e.g., 50 XP per level
  if (stats.xp >= xpNeeded) {
    stats.level++;
    stats.xp = stats.xp - xpNeeded; // carry over extra XP
  }
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
  life_admin: "Sort your life out!",
  lit_review: "There's always more to read!",
  cleaning: "Focus on cleaning your data!",
  analysis: "Keep digging into those patterns!",
  writing: "Just write. Even badly. Edit later.",
  editing: "Tighten those arguments and optimise the flow!"
};

modeReminder.textContent = reminders[taskModeSelect.value];

let modeTimeTracker = {
  cleaning: 0,
  lit_review: 0,
  analysis: 0,
  writing: 0,
  editing: 0,
  life_admin: 0
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
  if (!tracker) return;

  const formatMinutes = (s) => `${Math.floor(s / 60)} min`;

  tracker.innerHTML = `
    <strong>Time Spent:</strong><br>
    Life Admin: ${formatMinutes(stats.modeTimeTracker.life_admin)}<br>
    Lit Review: ${formatMinutes(stats.modeTimeTracker.lit_review)}<br>
    Cleaning: ${formatMinutes(stats.modeTimeTracker.cleaning)}<br>
    Analysis: ${formatMinutes(stats.modeTimeTracker.analysis)}<br>
    Writing: ${formatMinutes(stats.modeTimeTracker.writing)}<br>
    Editing: ${formatMinutes(stats.modeTimeTracker.editing)}
  `;
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

function getXPForLevel(lvl) {
  return 10 * lvl + 5 * (lvl - 1);
}

function gainXP(amount) {
  stats.xp += amount;
  checkLevelUp();
  updateXPDisplay();
  saveStats();
}


function checkLevelUp() {
  const requiredXP = getXPForLevel(stats.level + 1);
  if (stats.xp >= requiredXP) {
    stats.level++;
    stats.xp -= requiredXP;
    const coinsEarned = 5 + Math.floor(stats.level / 2);
    showLevelUpAnimation(stats.level, coinsEarned);
    saveStats();
  }
}


function updateXPDisplay() {
  const nextXP = getXPForLevel(stats.level + 1);
  const xpDisplay = document.getElementById("xpLevelDisplay");
  if (xpDisplay) {
    xpDisplay.textContent = ` LVL ${stats.level} | XP: ${stats.xp} / ${nextXP}`;
  }

  const streakDisplay = document.getElementById("dailyStreakDisplay");
  if (streakDisplay) {
    streakDisplay.textContent = `🔥 Daily Streak: ${stats.streak}`;
  }
}


function showLevelUpAnimation(level, coinsEarned) {
  const overlay = document.getElementById("levelUpOverlay");
  if (!overlay) return;

  overlay.innerHTML = `
    <div>
      🎉 Level Up!<br>
      You’re now level ${level}!<br>
      🪙 +${coinsEarned} coins
    </div>`;
  overlay.style.display = "block";

  setTimeout(() => {
    overlay.style.display = "none";
    overlay.innerHTML = "";
  }, 3000);
}

// Daily streak tracking
function updateStreak() {
  const today = new Date().toDateString();
  const last = stats.lastActiveDate;

  if (last === today) return; // already logged today

  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (last === yesterday) {
    stats.streak++;
  } else {
    stats.streak = 1;
  }

  stats.lastActiveDate = today;
  saveStats();
  updateXPDisplay();
}

function updateStatsDisplay() {
  const statsDisplay = document.getElementById("gameStats");
  if (statsDisplay) {
    statsDisplay.textContent = `Lives: ${lives} | Coins: ${coins} | XP: ${experience} | Level: ${level}`;
  }
}

// Motivational messages
 const motivationalMessages = [
  "Do a little every day! Don't procrastinate!",
  "Every word counts!",
  "Break it into chunks!",
  "Progress, not perfection!",
  "There will be daaaaays like thiiiiiiis!",
  "You gotta roll with it! You've got to take your time!",
  "What's the story morning glory?",
  "You don't need to change the world with your diss.",
  "Just think how hard this would be if you were a clam!"
];

let currentMessageIndex = 0;

function updateCatMessage() {
  const speech = document.getElementById("catSpeech");
  if (!speech) return;

  speech.textContent = motivationalMessages[currentMessageIndex];
  speech.style.display = "block";

  setTimeout(() => {
    speech.style.display = "none";
  }, 60 * 1000);

  const nextDelay = (5 + Math.random() * 5) * 60 * 1000;
  setTimeout(() => {
    currentMessageIndex = (currentMessageIndex + 1) % motivationalMessages.length;
    updateCatMessage();
  }, nextDelay);
}

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(updateCatMessage, 5000);
});


window.addEventListener("DOMContentLoaded", () => {
  updateStreak(); // check on load
});

const notesToggleBtn = document.getElementById("toggleNotesBtn");
const scratchNotesDiv = document.getElementById("scratchNotes");
const notesArea = document.getElementById("notesArea");

if (notesToggleBtn && scratchNotesDiv && notesArea) {
  notesToggleBtn.addEventListener("click", () => {
    scratchNotesDiv.classList.toggle("hidden");
    notesToggleBtn.textContent = scratchNotesDiv.classList.contains("hidden") ? "📝 Notes" : "❌ Hide Notes";
  });

  notesArea.value = localStorage.getItem("pomocatNotes") || "";
  notesArea.addEventListener("input", () => {
    localStorage.setItem("pomocatNotes", notesArea.value);
  });
}

// Auto-load saved notes
function loadScratchNotes() {
  const savedNotes = localStorage.getItem("pomocatNotes");
  if (savedNotes) {
    document.getElementById("notesArea").value = savedNotes;
  }
}

// Save notes on input
document.getElementById("notesArea").addEventListener("input", () => {
  localStorage.setItem("pomocatNotes", document.getElementById("notesArea").value);
});


document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleTimeStats");
  const timeStatsDiv = document.getElementById("bottomLeftPanel");

  toggleBtn.addEventListener("click", () => {
    timeStatsDiv.classList.toggle("hidden");
    toggleBtn.textContent = timeStatsDiv.classList.contains("hidden")
      ? "📊 View Time Spent"
      : "📉 Hide Time Spent";
  });
});

// Initial Setup
updateCountdown();
updateDisplay();
updateCatImage();
updateButtonLabel();
renderTasks();
loadStats();


