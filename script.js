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

const mainMenu = document.getElementById("main-menu");
const menuDifficulty = document.getElementById("menu-difficulty");
const menuStart = document.getElementById("menu-start");
const menuBestTime = document.getElementById("menu-best-time");
const menuBestMoves = document.getElementById("menu-best-moves");

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

const imagePool = Array.from({ length: 40 }, (_, i) => `https://picsum.photos/seed/memory-${i + 1}/600/600`);

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(sec) {
  const minutes = String(Math.floor(sec / 60)).padStart(2, "0");
  const secondsPart = String(sec % 60).padStart(2, "0");
  return `${minutes}:${secondsPart}`;
}

function getRecordKey(size) {
  return `memory-record-${size}`;
}

function updateRecordDisplays(size) {
  const key = getRecordKey(size);
  const data = localStorage.getItem(key);

  const displayTime = data ? formatTime(JSON.parse(data).time) : "--";
  const displayMoves = data ? JSON.parse(data).moves : "--";

  bestTimeSpan.textContent = displayTime;
  bestMovesSpan.textContent = displayMoves;
  menuBestTime.textContent = displayTime;
  menuBestMoves.textContent = displayMoves;
}

function loadRecords(size) {
  updateRecordDisplays(size);
}

function saveRecord(size, time, movesCount) {
  const key = getRecordKey(size);
  const data = localStorage.getItem(key);

  if (!data) {
    localStorage.setItem(key, JSON.stringify({ time, moves: movesCount }));
    return;
  }

  const record = JSON.parse(data);
  const betterTime = time < record.time;
  const betterMoves = time === record.time && movesCount < record.moves;

  if (!record.time || betterTime || betterMoves) {
    localStorage.setItem(key, JSON.stringify({ time, moves: movesCount }));
  }
}

function startTimer() {
  stopTimer();
  seconds = 0;
  timeSpan.textContent = "00:00";
  timerInterval = setInterval(() => {
    seconds += 1;
    timeSpan.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function launchParticles() {
  const container = document.getElementById("particles");

  for (let i = 0; i < 90; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.background = `hsl(${Math.random() * 360}, 90%, 65%)`;
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.setProperty("--drift", `${(Math.random() - 0.5) * 200}px`);
    particle.style.animationDuration = `${1.6 + Math.random() * 2.2}s`;
    container.appendChild(particle);
    setTimeout(() => particle.remove(), 3500);
  }
}

function buildBoard(size) {
  game.innerHTML = "";
  firstCard = null;
  secondCard = null;
  lock = false;
  moves = 0;
  matchedPairs = 0;
  totalPairs = (size * size) / 2;
  movesSpan.textContent = "0";

  game.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;

  const neededImages = imagePool.slice(0, totalPairs);
  const cards = shuffle([...neededImages, ...neededImages]).map((src, index) => ({
    id: `${src}-${index}`,
    src
  }));

  cards.forEach(({ src, id }) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.src = src;
    card.dataset.id = id;
    card.setAttribute("aria-label", "Carta del juego de memoria");

    const inner = document.createElement("div");
    inner.classList.add("card-inner");

    const front = document.createElement("div");
    front.classList.add("card-front");

    const back = document.createElement("div");
    back.classList.add("card-back");

    const img = document.createElement("img");
    img.src = src;
    img.alt = "Imagen de memoria";

    back.appendChild(img);
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    game.appendChild(card);
  });
}

function startGame() {
  const size = Number.parseInt(difficultySelect.value, 10);
  buildBoard(size);
  loadRecords(size);
  startTimer();
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lock = false;
}

function checkMatch() {
  const src1 = firstCard.dataset.src;
  const src2 = secondCard.dataset.src;

  if (src1 === src2) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    soundMatch.currentTime = 0;
    soundMatch.play().catch(() => {});

    matchedPairs += 1;
    resetTurn();

    if (matchedPairs === totalPairs) {
      winGame();
    }

    return;
  }

  lock = true;
  soundFail.currentTime = 0;
  soundFail.play().catch(() => {});

  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetTurn();
  }, 600);
}

game.addEventListener("click", (event) => {
  const card = event.target.closest(".card");
  if (!card) return;
  if (lock) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

  card.classList.add("flipped");

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves += 1;
  movesSpan.textContent = String(moves);
  checkMatch();
});

function winGame() {
  stopTimer();
  soundWin.currentTime = 0;
  soundWin.play().catch(() => {});
  launchParticles();

  finalTimeSpan.textContent = formatTime(seconds);
  finalMovesSpan.textContent = String(moves);

  const size = Number.parseInt(difficultySelect.value, 10);
  saveRecord(size, seconds, moves);
  loadRecords(size);

  victoryBestTime.textContent = bestTimeSpan.textContent;
  victoryBestMoves.textContent = bestMovesSpan.textContent;

  victory.classList.remove("hidden");
}

function applyTheme() {
  const isDark = document.body.classList.contains("dark");
  toggleThemeBtn.textContent = isDark ? "Modo claro" : "Modo oscuro";
}

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
  applyTheme();
});

menuStart.addEventListener("click", () => {
  const size = Number.parseInt(menuDifficulty.value, 10);
  difficultySelect.value = String(size);
  loadRecords(size);
  mainMenu.classList.add("hidden");
  startGame();
});

menuDifficulty.addEventListener("change", () => {
  const size = Number.parseInt(menuDifficulty.value, 10);
  updateRecordDisplays(size);
});

applyTheme();
loadRecords(Number.parseInt(difficultySelect.value, 10));
