const game = document.getElementById("game");
const difficultySelect = document.getElementById("difficulty");
const startBtn = document.getElementById("start");
const movesSpan = document.getElementById("moves");
const timeSpan = document.getElementById("time");
const bestTimeSpan = document.getElementById("best-time");
const bestMovesSpan = document.getElementById("best-moves");
const victory = document.getElementById("victory");
const finalTimeSpan = document.getElementById("final-time");
const finalMovesSpan = document.getElementById("final-moves");
const victoryBestTime = document.getElementById("victory-best-time");
const victoryBestMoves = document.getElementById("victory-best-moves");
const victoryMenuBtn = document.getElementById("victory-menu");
const victoryRestartBtn = document.getElementById("victory-restart");
const toggleThemeBtn = document.getElementById("toggle-theme");

// MENU
const mainMenu = document.getElementById("main-menu");
const menuDifficulty = document.getElementById("menu-difficulty");
const menuStart = document.getElementById("menu-start");
const menuBestTime = document.getElementById("menu-best-time");
const menuBestMoves = document.getElementById("menu-best-moves");

// SONIDOS
const soundMatch = document.getElementById("sound-match");
const soundFail = document.getElementById("sound-fail");
const soundWin = document.getElementById("sound-win");

let firstCard = null;
let secondCard = null;
let lock = false;
let moves = 0;
let timerInterval = null;
let seconds = 0;
let totalPairs = 0;
let matchedPairs = 0;

// Imágenes reales
const imagePool = Array.from({ length: 40 }, (_, i) => `https://picsum.photos/200?random=${i+1}`);

// UTILIDADES

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function startTimer() {
  stopTimer();
  seconds = 0;
  timeSpan.textContent = "00:00";
  timerInterval = setInterval(() => {
    seconds++;
    timeSpan.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// PARTICULAS

function launchParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 120; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.background = `hsl(${Math.random()*360}, 80%, 60%)`;
    p.style.left = Math.random()*100 + 'vw';
    p.style.top = '-20px';
    p.style.animationDuration = (1 + Math.random()*2) + 's';
    container.appendChild(p);
    setTimeout(() => p.remove(), 3000);
  }
}

// RECORDS

function getRecordKey(size) {
  return `memory-record-${size}`;
}

function loadRecords(size) {
  const key = getRecordKey(size);
  const data = localStorage.getItem(key);
  if (!data) {
    bestTimeSpan.textContent = "--";
    bestMovesSpan.textContent = "--";
    return;
  }
  const record = JSON.parse(data);
  bestTimeSpan.textContent = formatTime(record.time);
  bestMovesSpan.textContent = record.moves;
}

function saveRecord(size, time, moves) {
  const key = getRecordKey(size);
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify({ time, moves }));
    return;
  }
  const record = JSON.parse(data);
  if (time < record.time || moves < record.moves) {
    localStorage.setItem(key, JSON.stringify({ time, moves }));
  }
}

// TABLERO

function buildBoard(size) {
  game.innerHTML = "";
  firstCard = null;
  secondCard = null;
  lock = false;
  moves = 0;
  movesSpan.textContent = moves;
  matchedPairs = 0;
  totalPairs = (size * size) / 2;

  game.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  const neededImages = imagePool.slice(0, totalPairs);
  const cards = shuffle([...neededImages, ...neededImages]);

  cards.forEach(src => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.src = src;

    const inner = document.createElement("div");
    inner.classList.add("card-inner");

    const front = document.createElement("div");
    front.classList.add("card-front");
    front.textContent = "?";

    const back = document.createElement("div");
    back.classList.add("card-back");
    const img = document.createElement("img");
    img.src = src;
    back.appendChild(img);

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    game.appendChild(card);
  });
}

// JUEGO

function startGame() {
  const size = parseInt(difficultySelect.value, 10);
  buildBoard(size);
  loadRecords(size);
  startTimer();
}

game.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (!card) return;
  if (lock) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

  card.classList.add("flipped");

  if (!firstCard) {
    firstCard = card;
  } else {
    secondCard = card;
    moves++;
    movesSpan.textContent = moves;
    checkMatch();
  }
});

function checkMatch() {
  const src1 = firstCard.dataset.src;
  const src2 = secondCard.dataset.src;

  if (src1 === src2) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    soundMatch.currentTime = 0;
    soundMatch.play();
    matchedPairs++;
    resetTurn();
    if (matchedPairs === totalPairs) {
      winGame();
    }
  } else {
    lock = true;
    soundFail.currentTime = 0;
    soundFail.play();
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();
    }, 800);
  }
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lock = false;
}

function winGame() {
  stopTimer();
  soundWin.currentTime = 0;
  soundWin.play();
  launchParticles();

  finalTimeSpan.textContent = formatTime(seconds);
  finalMovesSpan.textContent = moves;

  const size = parseInt(difficultySelect.value, 10);
  saveRecord(size, seconds, moves);
  loadRecords(size);

  victoryBestTime.textContent = bestTimeSpan.textContent;
  victoryBestMoves.textContent = bestMovesSpan.textContent;

  victory.classList.remove("hidden");
}

// UI EXTRA

startBtn.addEventListener("click", startGame);

victoryMenuBtn.addEventListener("click", () => {
  victory.classList.add("hidden");
  mainMenu.classList.remove("hidden");
});

victoryRestartBtn.addEventListener("click", () => {
  victory.classList.add("hidden");
  startGame();
});

toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// MENÚ PRINCIPAL

menuStart.addEventListener("click", () => {
  const size = parseInt(menuDifficulty.value, 10);
  difficultySelect.value = size;

  loadRecords(size);

  menuBestTime.textContent = bestTimeSpan.textContent;
  menuBestMoves.textContent = bestMovesSpan.textContent;

  mainMenu.classList.add("hidden");
  startGame();
});

// Inicial
loadRecords(parseInt(difficultySelect.value, 10));
