
// ========================================================
// LANTING KATA BERLAYAR
// 5 ronde | 10 pilihan | 3 jawaban benar per ronde
// 20 poin per ronde | Skor maksimal 100 | 5 nyawa
// ========================================================

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwJaZhoaDdKjlyyQOhyICRY7APeQrLvJesOxTel-qQy6xTIuvBqQZ0Y5dX7HEAZu695/exec";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYJ3ve7IUTIBC6hy24is1rTu309JDuksk97G-lC4RpQ2R4cHHigvwje29XgnnZVINMAGYWq29yvmPM/pub?output=csv";

const TOTAL_ROUNDS = 5;
const OPTIONS_PER_ROUND = 10;
const TARGETS_PER_ROUND = 3;
const POINTS_PER_ROUND = 20;
const STARTING_LIVES = 5;

let vocabulary = [];
let currentRound = 0;
let score = 0;
let lives = STARTING_LIVES;
let currentTargets = [];
let currentOptions = [];
let collectedWords = [];
let gameActive = false;
let isMoving = false;

const $ = (id) => document.getElementById(id);

const startSection = $("startSection");
const startButton = $("startButton");
const loadingText = $("loadingText");
const categoryChoices = $("categoryChoices");
const gameSection = $("gameSection");
const resultSection = $("resultSection");
const missionTitle = $("missionTitle");
const missionText = $("missionText");
const scoreDisplay = $("score");
const marketArea = $("marketArea");
const playerBoat = $("playerBoat");
const basket = $("basket");
const progressDisplay = $("progress");
const feedback = $("feedback");
const resultText = $("resultText");
const finalScore = $("finalScore");
const playAgainButton = $("playAgainButton");

function ensureElement(id, parent, className) {
  let element = $(id);

  if (!element && parent) {
    element = document.createElement("div");
    element.id = id;

    if (className) element.className = className;

    parent.appendChild(element);
  }

  return element;
}

const roundIndicator = ensureElement(
  "roundIndicator",
  document.querySelector(".mission-card"),
  "small-label"
);

const livesDisplay = ensureElement(
  "lives",
  document.querySelector(".mission-card"),
  "small-label"
);

// --------------------------------------------------------
// PENGATURAN TAMPILAN AWAL
// --------------------------------------------------------

function setupInitialScreen() {
  const heading = startSection?.querySelector("h2");
  const description = startSection?.querySelector("p");

  if (heading) heading.textContent = "Siap Berlayar?";

  if (description) {
    description.textContent =
      "Baca 3 arti Bahasa Indonesia, lalu temukan kosakata Bahasa Banjar yang sesuai dari 10 pilihan perahu!";
  }

  if (categoryChoices) {
    categoryChoices.hidden = true;
    categoryChoices.innerHTML = "";
  }

  if (startButton) {
    startButton.textContent = "🛶 Mulai Berlayar";
    startButton.disabled = true;
  }

  if (loadingText) {
    loadingText.textContent =
      "Memuat kosakata dari Kamus LANTING KATA...";
    loadingText.style.textAlign = "center";
  }
}

// --------------------------------------------------------
// MEMBACA DATA CSV GOOGLE SHEETS
// --------------------------------------------------------

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !insideQuotes
    ) {
      if (char === "\r" && next === "\n") i++;

      row.push(cell.trim());

      if (row.some((value) => value !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());

    if (row.some((value) => value !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("id-ID")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function uniqueWords(words) {
  const seen = new Set();

  return words.filter((item) => {
    const key = normalize(item.banjar);

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

async function loadVocabulary() {
  setupInitialScreen();

  const controller = new AbortController();

  const timeoutId = window.setTimeout(
    () => controller.abort(),
    15000
  );

  try {
    const response = await fetch(CSV_URL, {
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(
        `Google Sheets memberikan status ${response.status}.`
      );
    }

    const csvText = await response.text();

    if (
      !csvText.trim() ||
      csvText.trim().startsWith("<!DOCTYPE html")
    ) {
      throw new Error(
        "Data yang diterima bukan CSV. Periksa publikasi Google Sheets."
      );
    }

    const rows = parseCSV(csvText);

    vocabulary = rows
      .slice(1)
      .map((row) => ({
        banjar: (row[1] || "").trim(),
        indonesia: (row[2] || "").trim(),
        kategori: (row[3] || "").trim(),
        contoh: (row[4] || "").trim(),
        gambar: (row[5] || "").trim(),
        audio: (row[6] || "").trim()
      }))
      .filter((item) => item.banjar && item.indonesia);

    vocabulary = uniqueWords(vocabulary);

    if (vocabulary.length < OPTIONS_PER_ROUND) {
      throw new Error(
        `Hanya ${vocabulary.length} kosakata valid ditemukan. Minimal diperlukan 10.`
      );
    }

    if (loadingText) {
      loadingText.textContent =
        `${vocabulary.length} kosakata berhasil dimuat. Ayo mulai petualangan!`;
    }

    if (startButton) startButton.disabled = false;

  } catch (error) {
    console.error("Gagal memuat kamus LANTING KATA:", error);

    if (loadingText) {
      loadingText.textContent =
        error.name === "AbortError"
          ? "Pemuatan terlalu lama. Periksa koneksi internet, lalu muat ulang halaman."
          : `Kamus belum berhasil dimuat. ${error.message} Coba muat ulang halaman.`;
    }

    if (startButton) startButton.disabled = true;

  } finally {
    window.clearTimeout(timeoutId);
  }
}

// --------------------------------------------------------
// MEMULAI PERMAINAN
// --------------------------------------------------------

function startGame() {
  if (vocabulary.length < OPTIONS_PER_ROUND) {
    if (loadingText) {
      loadingText.textContent =
        "Kamus belum siap. Muat ulang halaman dan coba lagi.";
    }
    return;
  }

  currentRound = 0;
  score = 0;
  lives = STARTING_LIVES;
  collectedWords = [];
  gameActive = true;
  isMoving = false;

  startSection?.classList.add("hidden");
  resultSection?.classList.add("hidden");
  gameSection?.classList.remove("hidden");

  updateScore();
  updateLives();
  prepareRound();
}

// --------------------------------------------------------
// MENYIAPKAN RONDE
// --------------------------------------------------------

function prepareRound() {
  if (!gameActive) return;

  if (currentRound >= TOTAL_ROUNDS) {
    finishGame(true);
    return;
  }

  currentRound++;
  collectedWords = [];

  currentTargets = shuffle(vocabulary).slice(
    0,
    TARGETS_PER_ROUND
  );

  const targetWords = new Set(
    currentTargets.map((item) => normalize(item.banjar))
  );

  const distractors = shuffle(
    vocabulary.filter(
      (item) => !targetWords.has(normalize(item.banjar))
    )
  ).slice(0, OPTIONS_PER_ROUND - TARGETS_PER_ROUND);

  currentOptions = shuffle([
    ...currentTargets,
    ...distractors
  ]);

  if (currentOptions.length !== OPTIONS_PER_ROUND) {
    showFeedback(
      "Pilihan kosakata belum mencukupi. Periksa data kamus.",
      "wrong"
    );

    gameActive = false;
    return;
  }

  renderRound();
  updateScore();
  updateLives();
  resetPlayerBoat();
}

// --------------------------------------------------------
// MENAMPILKAN MISI DAN 10 PERAHU
// --------------------------------------------------------

function renderRound() {
  if (roundIndicator) {
    roundIndicator.textContent =
      `RONDE ${currentRound} / ${TOTAL_ROUNDS}`;
  }

  if (missionTitle) {
    missionTitle.textContent = "🎯 Temukan Kosakata Banjar!";
  }

  if (missionText) {
    missionText.innerHTML = "";

    const instruction = document.createElement("p");

    instruction.textContent =
      "Pilih kosakata Bahasa Banjar yang sesuai dengan ketiga arti berikut:";

    const list = document.createElement("ol");
    list.className = "mission-word-list";

    currentTargets.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.indonesia;
      list.appendChild(li);
    });

    missionText.append(instruction, list);
  }

  if (marketArea) {
    marketArea.innerHTML = "";

    currentOptions.forEach((item, index) => {
      const boat = document.createElement("button");

      boat.type = "button";
      boat.className = "market-boat";
      boat.dataset.word = item.banjar;
      boat.dataset.index = String(index);

      boat.setAttribute(
        "aria-label",
        `Pilihan kosakata Bahasa Banjar: ${item.banjar}`
      );

      const vendor = document.createElement("span");
      vendor.className = "vendor";
      vendor.textContent = "🧑‍🌾";

      const goods = document.createElement("span");
      goods.className = "goods";
      goods.textContent = "🧺";

      const word = document.createElement("span");
      word.className = "boat-name";
      word.textContent = item.banjar;

      boat.append(vendor, goods, word);

      boat.addEventListener("click", () => {
        handleWordChoice(item, boat);
      });

      marketArea.appendChild(boat);
    });
  }

  updateBasket();
  updateProgress();

  showFeedback(
    "Ayo berlayar! Temukan 3 kosakata yang sesuai dengan arti di atas.",
    ""
  );
}

// --------------------------------------------------------
// MEMERIKSA PILIHAN PEMAIN
// --------------------------------------------------------

async function handleWordChoice(item, boat) {
  if (!gameActive || isMoving || boat.disabled) return;

  isMoving = true;

  await movePlayerBoat(boat);

  if (!gameActive) {
    isMoving = false;
    return;
  }

  boat.disabled = true;

  const isCorrect = currentTargets.some(
    (target) =>
      normalize(target.banjar) === normalize(item.banjar)
  );

  if (isCorrect) {
    boat.classList.add("correct");
    collectedWords.push(item);

    showFeedback(
      `Benar! "${item.banjar}" berarti "${item.indonesia}".`,
      "correct"
    );

    updateBasket();
    updateProgress();

    if (collectedWords.length === TARGETS_PER_ROUND) {
      score += POINTS_PER_ROUND;
      updateScore();

      showFeedback(
        `Hebat! Semua jawaban benar. Kamu mendapat ${POINTS_PER_ROUND} poin!`,
        "correct"
      );

      isMoving = false;

      window.setTimeout(() => {
        if (!gameActive) return;

        if (currentRound >= TOTAL_ROUNDS) {
          finishGame(true);
        } else {
          prepareRound();
        }
      }, 1200);

      return;
    }

  } else {
    boat.classList.add("wrong");
    lives--;

    showFeedback(
      `Belum tepat. "${item.banjar}" berarti "${item.indonesia}". Coba pilihan lain!`,
      "wrong"
    );

    updateLives();

    if (lives <= 0) {
      isMoving = false;

      window.setTimeout(() => {
        finishGame(false);
      }, 900);

      return;
    }
  }

  isMoving = false;
}

// --------------------------------------------------------
// PERBAIKAN GERAK JUKUNG
// Titik tujuan = titik tengah perahu yang diklik.
// Posisi dihitung relatif terhadap river-scene.
// --------------------------------------------------------

function resetPlayerBoat() {
  if (!playerBoat) return;

  playerBoat.classList.remove("boat-sailing");

  playerBoat.style.left = "50%";
  playerBoat.style.top = "78%";

  const label = document.querySelector(".boat-label");

  if (label) {
    label.style.left = "50%";
    label.style.top = "84%";
  }
}

function movePlayerBoat(targetBoat) {
  return new Promise((resolve) => {
    if (!playerBoat || !targetBoat) {
      resolve();
      return;
    }

    const scene = document.querySelector(".river-scene");

    if (!scene) {
      resolve();
      return;
    }

    // Pastikan pengukuran dilakukan setelah layout diperbarui.
    const sceneRect = scene.getBoundingClientRect();
    const targetRect = targetBoat.getBoundingClientRect();

    // Koordinat relatif terhadap area sungai.
    let targetX =
      targetRect.left -
      sceneRect.left +
      targetRect.width / 2;

    let targetY =
      targetRect.top -
      sceneRect.top +
      targetRect.height / 2;

    // Sesuaikan jika river-scene memiliki border.
    targetX -= scene.clientLeft;
    targetY -= scene.clientTop;

    // Batas aman agar jukung tetap berada di dalam sungai.
    const boatWidth = playerBoat.offsetWidth || 50;
    const boatHeight = playerBoat.offsetHeight || 35;

    targetX = Math.max(
      boatWidth / 2,
      Math.min(scene.clientWidth - boatWidth / 2, targetX)
    );

    targetY = Math.max(
      boatHeight / 2,
      Math.min(scene.clientHeight - boatHeight / 2, targetY)
    );

    // Animasi menuju titik tengah perahu yang dipilih.
    playerBoat.classList.add("boat-sailing");
    playerBoat.style.left = `${targetX}px`;
    playerBoat.style.top = `${targetY}px`;

    // Label mengikuti jukung.
    const label = document.querySelector(".boat-label");

    if (label) {
      label.style.left = `${targetX}px`;
      label.style.top = `${Math.min(
        scene.clientHeight - 8,
        targetY + boatHeight / 2 + 12
      )}px`;
    }

    // Tunggu animasi selesai sebelum memeriksa jawaban.
    window.setTimeout(resolve, 700);
  });
}

// --------------------------------------------------------
// SKOR, NYAWA, PROGRES, DAN KERANJANG
// --------------------------------------------------------

function updateScore() {
  if (scoreDisplay) {
    scoreDisplay.textContent = String(score);
  }
}

function updateLives() {
  if (livesDisplay) {
    livesDisplay.textContent =
      `❤️ Nyawa: ${"❤️".repeat(lives)}${"🖤".repeat(
        STARTING_LIVES - lives
      )}`;
  }
}

function updateProgress() {
  if (progressDisplay) {
    progressDisplay.textContent =
      `${collectedWords.length} / ${TARGETS_PER_ROUND}`;
  }
}

function updateBasket() {
  if (!basket) return;

  basket.innerHTML = "";

  if (collectedWords.length === 0) {
    const empty = document.createElement("span");
    empty.className = "basket-item";
    empty.textContent = "Belum ada kosakata";
    basket.appendChild(empty);
    return;
  }

  collectedWords.forEach((item) => {
    const word = document.createElement("span");
    word.className = "basket-item";
    word.textContent = `✓ ${item.banjar}`;
    basket.appendChild(word);
  });
}

function showFeedback(message, type) {
  if (!feedback) return;

  feedback.textContent = message;
  feedback.classList.remove("correct", "wrong");

  if (type) feedback.classList.add(type);
}

// --------------------------------------------------------
// AKHIR PERMAINAN
// --------------------------------------------------------


function finishGame(completedAllRounds) {
  gameActive = false;
  isMoving = false;

  gameSection?.classList.add("hidden");
  resultSection?.classList.remove("hidden");

  const resultIcon = document.querySelector(".result-icon");
  const resultTitle = resultSection?.querySelector("h2");

  // Sembunyikan indikator ronde jika ikut muncul di halaman hasil.
  if (roundIndicator) {
    roundIndicator.textContent = "";
    roundIndicator.style.display = "none";
  }

  if (resultIcon) {
    resultIcon.textContent = completedAllRounds ? "🎉" : "🛶";
  }

  if (resultTitle) {
    resultTitle.textContent = completedAllRounds
      ? "Misi Selesai!"
      : "Perjalanan Berakhir!";
  }

  if (finalScore) {
    finalScore.textContent = String(score);
  }

  if (resultText) {
    resultText.textContent = completedAllRounds
      ? "Luar biasa! Kamu berhasil menyelesaikan lima ronde petualangan Bahasa Banjar!"
      : `Nyawamu habis pada ronde ${currentRound}. Tetap semangat dan coba lagi!`;
  }

  // Pastikan tautan kembali ke Games tersedia pada halaman hasil.
  let backLink = document.getElementById("resultBackLink");

  if (!backLink && resultSection) {
    backLink = document.createElement("a");
    backLink.id = "resultBackLink";
    backLink.href = "games.html";
    backLink.textContent = "← Kembali ke Games";
    backLink.className = "result-back-link";

    if (playAgainButton) {
      playAgainButton.insertAdjacentElement("afterend", backLink);
    } else {
      resultSection.appendChild(backLink);
    }
  }

  saveScore();
}


// --------------------------------------------------------
// SIMPAN SKOR KE GOOGLE APPS SCRIPT
// --------------------------------------------------------

function saveScore() {
  let playerName = "Pemain";

  try {
    playerName =
      localStorage.getItem("lantingNama") ||
      localStorage.getItem("lantingKataNamaPemain") ||
      "Pemain";
  } catch (error) {
    console.warn("Nama pemain tidak dapat dibaca.", error);
  }

  const params = new URLSearchParams({
    action: "simpanSkor",
    nama: playerName,
    game: "7",
    skor: String(score)
  });

  fetch(`${WEB_APP_URL}?${params.toString()}`, {
    method: "GET",
    mode: "no-cors"
  }).catch((error) => {
    console.warn("Pengiriman skor gagal:", error);
  });
}

// --------------------------------------------------------
// TOMBOL
// --------------------------------------------------------

if (startButton) {
  startButton.addEventListener("click", startGame);
}

if (playAgainButton) {
  playAgainButton.addEventListener("click", () => {
    resultSection?.classList.add("hidden");
    startSection?.classList.remove("hidden");
    gameSection?.classList.add("hidden");

    gameActive = false;
    isMoving = false;
    collectedWords = [];

    updateScore();
    updateLives();
    resetPlayerBoat();
  });
}

// --------------------------------------------------------
// JALANKAN
// --------------------------------------------------------

setupInitialScreen();
loadVocabulary();
