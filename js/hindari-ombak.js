/* =========================================================
   HINDARI OMBAK — LANTING KATA
   Sumber kosakata: Kamus LANTING KATA
   Bahasa Indonesia → Bahasa Banjar
   Versi: TANPA TIMER JAWABAN
========================================================= */


/* =========================================================
   KONFIGURASI
========================================================= */

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYJ3ve7IUTIBC6hy24is1rTu309JDuksk97G-lC4RpQ2R4cHHigvwje29XgnnZVINMAGYWq29yvmPM/pub?output=csv";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwJaZhoaDdKjlyyQOhyICRY7APeQrLvJesOxTel-qQy6xTIuvBqQZ0Y5dX7HEAZu695/exec";

const MAX_LIVES = 3;

const SCORE_CORRECT = 10;

/*
 * Jumlah kotak dalam jalur.
 *
 * Kotak:
 * 1  = paling bawah
 * 15 = paling atas
 */
const TOTAL_STEPS = 15;

/*
 * Tinggi air awal.
 */
const INITIAL_WATER_HEIGHT = 85;

/*
 * Ombak naik ketika jawaban salah.
 */
const WRONG_WAVE_STEP = 24;

/*
 * Ombak naik perlahan selama permainan.
 */
const PASSIVE_WAVE_STEP = 6;

/*
 * Ombak naik setiap 5 detik.
 */
const WAVE_INTERVAL_TIME = 5000;

/*
 * Jeda antar lompatan.
 */
const CLIMB_STEP_DELAY = 300;

/*
 * Durasi cache kosakata.
 * 10 menit.
 */
const CACHE_DURATION = 10 * 60 * 1000;


/* =========================================================
   ELEMENT
========================================================= */

const startSection =
  document.getElementById("startSection");

const gameSection =
  document.getElementById("gameSection");

const resultSection =
  document.getElementById("resultSection");

const startButton =
  document.getElementById("startButton");

const playAgainButton =
  document.getElementById("playAgainButton");

const loadingText =
  document.getElementById("loadingText");

const scoreElement =
  document.getElementById("score");

const livesElement =
  document.getElementById("lives");

const levelElement =
  document.getElementById("level");

const gameWorld =
  document.getElementById("gameWorld");

const player =
  document.getElementById("player");

const boxPath =
  document.getElementById("boxPath");

const water =
  document.getElementById("water");

const indonesiaWord =
  document.getElementById("indonesiaWord");

const answerForm =
  document.getElementById("answerForm");

const answerInput =
  document.getElementById("answerInput");

const feedback =
  document.getElementById("feedback");

const resultIcon =
  document.getElementById("resultIcon");

const resultTitle =
  document.getElementById("resultTitle");

const resultText =
  document.getElementById("resultText");

const finalScore =
  document.getElementById("finalScore");

const finalLives =
  document.getElementById("finalLives");

const finalLevel =
  document.getElementById("finalLevel");


/* =========================================================
   STATE GAME
========================================================= */

let vocabulary = [];

let remainingVocabulary = [];

let currentQuestion = null;

let score = 0;

let lives = MAX_LIVES;

let progress = 0;

let level = 0;

let waterHeight = INITIAL_WATER_HEIGHT;

let waveInterval = null;

let gameStarted = false;

let answerLocked = false;

let gameEnded = false;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    prepareGame();
    loadVocabulary();
  }
);


/* =========================================================
   PREPARE GAME
========================================================= */

function prepareGame() {

  if (startButton) {
    startButton.disabled = true;
  }

  if (loadingText) {
    loadingText.textContent =
      "Memuat kosakata dari Kamus LANTING KATA...";
  }
}


/* =========================================================
   LOAD VOCABULARY
========================================================= */

async function loadVocabulary() {

  /*
   * -------------------------------------------------------
   * 1. Coba gunakan cache terlebih dahulu.
   * -------------------------------------------------------
   */

  const cachedVocabulary =
    getCachedVocabulary();

  if (
    cachedVocabulary &&
    cachedVocabulary.length > 0
  ) {

    vocabulary =
      cachedVocabulary;

    remainingVocabulary =
      shuffleArray(
        [...vocabulary]
      );

    if (startButton) {
      startButton.disabled = false;
    }

    if (loadingText) {
      loadingText.textContent =
        `${vocabulary.length} kosakata siap dimainkan!`;
    }

    /*
     * Tetap ambil data terbaru di belakang.
     */
    refreshVocabularyInBackground();

    return;
  }


  /*
   * -------------------------------------------------------
   * 2. Kalau belum ada cache,
   *    ambil langsung dari Google Sheets.
   * -------------------------------------------------------
   */

  try {

    const freshVocabulary =
      await fetchVocabulary();

    vocabulary =
      freshVocabulary;

    remainingVocabulary =
      shuffleArray(
        [...vocabulary]
      );

    saveVocabularyToCache(
      vocabulary
    );

    if (startButton) {
      startButton.disabled = false;
    }

    if (loadingText) {
      loadingText.textContent =
        `${vocabulary.length} kosakata siap dimainkan!`;
    }

  }

  catch (error) {

    console.error(
      "Hindari Ombak - Load Vocabulary:",
      error
    );

    if (loadingText) {
      loadingText.textContent =
        "Gagal memuat Kamus. Silakan muat ulang halaman.";
    }

    if (startButton) {
      startButton.disabled = true;
    }
  }
}


/* =========================================================
   FETCH VOCABULARY
========================================================= */

async function fetchVocabulary() {

  /*
   * AbortController supaya request tidak menggantung
   * terlalu lama.
   */

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      15000
    );


  try {

    const response =
      await fetch(
        SHEET_URL,
        {
          method: "GET",
          cache: "default",
          signal: controller.signal
        }
      );


    if (!response.ok) {

      throw new Error(
        `Gagal mengambil Kamus. Status: ${response.status}`
      );

    }


    const csvText =
      await response.text();


    if (!csvText.trim()) {

      throw new Error(
        "Data Kamus kosong."
      );

    }


    const rows =
      parseCSV(csvText);


    const result =
      convertRowsToVocabulary(
        rows
      );


    if (!result.length) {

      throw new Error(
        "Tidak ditemukan kosakata yang valid."
      );

    }


    return result;

  }

  finally {

    clearTimeout(timeout);

  }
}


/* =========================================================
   BACKGROUND REFRESH
========================================================= */

async function refreshVocabularyInBackground() {

  try {

    const freshVocabulary =
      await fetchVocabulary();


    if (
      freshVocabulary.length > 0
    ) {

      vocabulary =
        freshVocabulary;

      saveVocabularyToCache(
        vocabulary
      );

      /*
       * Hanya reset daftar pertanyaan jika
       * permainan belum dimulai.
       */

      if (!gameStarted) {

        remainingVocabulary =
          shuffleArray(
            [...vocabulary]
          );

        if (loadingText) {

          loadingText.textContent =
            `${vocabulary.length} kosakata siap dimainkan!`;

        }
      }
    }

  }

  catch (error) {

    /*
     * Tidak perlu mengganggu pemain.
     * Cache lama tetap digunakan.
     */

    console.warn(
      "Pembaruan Kamus di latar belakang gagal:",
      error
    );
  }
}


/* =========================================================
   CACHE VOCABULARY
========================================================= */

function saveVocabularyToCache(data) {

  try {

    const cacheData = {
      timestamp: Date.now(),
      vocabulary: data
    };

    sessionStorage.setItem(
      "lantingKataHindariOmbakVocabulary",
      JSON.stringify(cacheData)
    );

  }

  catch (error) {

    console.warn(
      "Cache vocabulary tidak dapat disimpan:",
      error
    );

  }
}


function getCachedVocabulary() {

  try {

    const raw =
      sessionStorage.getItem(
        "lantingKataHindariOmbakVocabulary"
      );


    if (!raw) {
      return null;
    }


    const data =
      JSON.parse(raw);


    if (
      !data ||
      !Array.isArray(data.vocabulary)
    ) {

      return null;

    }


    const age =
      Date.now() -
      Number(data.timestamp || 0);


    /*
     * Cache sudah terlalu lama.
     */

    if (
      age > CACHE_DURATION
    ) {

      sessionStorage.removeItem(
        "lantingKataHindariOmbakVocabulary"
      );

      return null;
    }


    return data.vocabulary;

  }

  catch (error) {

    console.warn(
      "Cache vocabulary tidak dapat dibaca:",
      error
    );

    return null;
  }
}


/* =========================================================
   CSV PARSER
========================================================= */

function parseCSV(text) {

  const rows = [];

  let row = [];

  let cell = "";

  let insideQuotes = false;


  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    const char =
      text[i];

    const nextChar =
      text[i + 1];


    /*
     * Kutip ganda di dalam isi.
     */

    if (
      char === '"' &&
      insideQuotes &&
      nextChar === '"'
    ) {

      cell += '"';

      i++;

      continue;
    }


    /*
     * Buka / tutup kutip.
     */

    if (
      char === '"'
    ) {

      insideQuotes =
        !insideQuotes;

      continue;
    }


    /*
     * Pemisah kolom.
     */

    if (
      char === "," &&
      !insideQuotes
    ) {

      row.push(cell);

      cell = "";

      continue;
    }


    /*
     * Akhir baris.
     */

    if (
      (
        char === "\n" ||
        char === "\r"
      ) &&
      !insideQuotes
    ) {

      if (
        char === "\r" &&
        nextChar === "\n"
      ) {

        i++;
      }


      row.push(cell);


      if (
        row.some(
          value =>
            String(value).trim() !== ""
        )
      ) {

        rows.push(row);
      }


      row = [];

      cell = "";

      continue;
    }


    cell += char;
  }


  /*
   * Baris terakhir.
   */

  if (
    cell !== "" ||
    row.length > 0
  ) {

    row.push(cell);


    if (
      row.some(
        value =>
          String(value).trim() !== ""
      )
    ) {

      rows.push(row);
    }
  }


  return rows;
}


/* =========================================================
   CONVERT CSV
========================================================= */

function convertRowsToVocabulary(rows) {

  if (
    !rows.length
  ) {

    return [];
  }


  const headers =
    rows[0].map(
      header =>
        normalizeHeader(header)
    );


  const banjarIndex =
    findHeaderIndex(
      headers,
      [
        "banjar",
        "bahasabanjar",
        "katabanjar",
        "kosakatabanjar"
      ]
    );


  const indonesiaIndex =
    findHeaderIndex(
      headers,
      [
        "indonesia",
        "bahasaindonesia",
        "arti",
        "artibahasaindonesia",
        "makna"
      ]
    );


  /*
   * Kalau header tidak ditemukan,
   * gunakan kolom pertama dan kedua.
   */

  const finalBanjarIndex =
    banjarIndex !== -1
      ? banjarIndex
      : 0;


  const finalIndonesiaIndex =
    indonesiaIndex !== -1
      ? indonesiaIndex
      : 1;


  const result = [];


  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    const row =
      rows[i];


    if (!row) {
      continue;
    }


    const banjar =
      cleanValue(
        row[finalBanjarIndex]
      );


    const indonesia =
      cleanValue(
        row[finalIndonesiaIndex]
      );


    if (
      !banjar ||
      !indonesia
    ) {

      continue;
    }


    result.push({
      banjar,
      indonesia
    });
  }


  return removeDuplicates(
    result
  );
}


/* =========================================================
   HEADER HELPER
========================================================= */

function normalizeHeader(value) {

  return String(value || "")
    .toLowerCase()
    .replace(
      /[\s_\-()./]/g,
      ""
    )
    .trim();
}


function findHeaderIndex(
  headers,
  possibleNames
) {

  for (
    const name of possibleNames
  ) {

    const index =
      headers.indexOf(name);


    if (
      index !== -1
    ) {

      return index;
    }
  }


  return -1;
}


/* =========================================================
   CLEAN VALUE
========================================================= */

function cleanValue(value) {

  return String(value || "")
    .replace(
      /^\uFEFF/,
      ""
    )
    .trim();
}


/* =========================================================
   REMOVE DUPLICATES
========================================================= */

function removeDuplicates(items) {

  const seen =
    new Set();


  return items.filter(
    item => {

      const key =
        normalizeAnswer(
          item.banjar
        ) +
        "|" +
        normalizeAnswer(
          item.indonesia
        );


      if (
        seen.has(key)
      ) {

        return false;
      }


      seen.add(key);

      return true;
    }
  );
}


/* =========================================================
   START BUTTON
========================================================= */

if (startButton) {

  startButton.addEventListener(
    "click",
    startGame
  );
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

  if (
    !vocabulary.length ||
    gameStarted
  ) {

    return;
  }


  gameStarted = true;

  gameEnded = false;

  answerLocked = false;

  score = 0;

  lives = MAX_LIVES;

  progress = 0;

  level = 0;

  waterHeight =
    INITIAL_WATER_HEIGHT;


  remainingVocabulary =
    shuffleArray(
      [...vocabulary]
    );


  updateScore();

  updateLives();

  updateLevel();


  /*
   * Buat 15 kotak.
   */

  createSteps();


  /*
   * Karakter mulai di bawah kotak 1.
   */

  resetPlayer();


  /*
   * Reset ombak.
   */

  resetWater();


  /*
   * Tampilkan game.
   */

  startSection.classList.add(
    "hidden"
  );

  resultSection.classList.add(
    "hidden"
  );

  gameSection.classList.remove(
    "hidden"
  );


  feedback.textContent = "";

  feedback.className =
    "feedback";


  /*
   * Pertanyaan pertama.
   */

  nextQuestion();


  /*
   * Mulai ombak.
   */

  startWaveSystem();


  /*
   * Hitung ulang posisi karakter setelah
   * game world benar-benar terlihat.
   */

  requestAnimationFrame(
    () => {
      resetPlayer();
    }
  );
}


/* =========================================================
   CREATE BOXES
========================================================= */

function createSteps() {

  boxPath.innerHTML = "";


  /*
   * Tetap dibuat 1 → 15.
   *
   * CSS column-reverse membuat:
   *
   *        15
   *        14
   *        ...
   *         2
   *         1
   */

  for (
    let i = 0;
    i < TOTAL_STEPS;
    i++
  ) {

    const step =
      document.createElement("div");


    step.className =
      "step-box";


    step.dataset.step =
      String(i + 1);


    step.textContent =
      i + 1;


    /*
     * Pola kiri-kanan.
     */

    const side =
      i % 2 === 0
        ? "-42px"
        : "42px";


    step.style.setProperty(
      "--step-x",
      side
    );


    boxPath.appendChild(
      step
    );
  }


  updateSteps();
}


/* =========================================================
   NEXT QUESTION
========================================================= */

function nextQuestion() {

  if (
    gameEnded
  ) {

    return;
  }


  answerLocked = false;


  /*
   * Jika semua kosakata sudah digunakan,
   * acak ulang seluruh Kamus.
   */

  if (
    remainingVocabulary.length === 0
  ) {

    remainingVocabulary =
      shuffleArray(
        [...vocabulary]
      );
  }


  /*
   * Ambil satu kosakata secara acak.
   */

  currentQuestion =
    remainingVocabulary.pop();


  if (
    !currentQuestion
  ) {

    return;
  }


  indonesiaWord.textContent =
    currentQuestion.indonesia;


  answerInput.value = "";

  answerInput.disabled = false;


  feedback.textContent = "";

  feedback.className =
    "feedback";


  /*
   * Fokus input.
   */

  requestAnimationFrame(
    () => {

      if (
        !gameEnded &&
        !answerInput.disabled
      ) {

        answerInput.focus();
      }
    }
  );
}


/* =========================================================
   ANSWER FORM
========================================================= */

if (answerForm) {

  answerForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      checkAnswer();
    }
  );
}


/* =========================================================
   CHECK ANSWER
========================================================= */

function checkAnswer() {

  if (
    answerLocked ||
    gameEnded ||
    !currentQuestion
  ) {

    return;
  }


  const userAnswer =
    normalizeAnswer(
      answerInput.value
    );


  if (!userAnswer) {

    return;
  }


  const correctAnswer =
    normalizeAnswer(
      currentQuestion.banjar
    );


  answerLocked = true;

  answerInput.disabled = true;


  if (
    userAnswer === correctAnswer
  ) {

    handleCorrectAnswer();

  }

  else {

    handleWrongAnswer();
  }
}


/* =========================================================
   CORRECT ANSWER
========================================================= */

function handleCorrectAnswer() {

  const answerLength =
    countLetters(
      currentQuestion.banjar
    );


  const previousProgress =
    progress;


  /*
   * +10 poin.
   */

  score += SCORE_CORRECT;


  /*
   * Setiap huruf = 1 kotak.
   */

  progress += answerLength;


  if (
    progress > TOTAL_STEPS
  ) {

    progress =
      TOTAL_STEPS;
  }


  level =
    progress;


  updateScore();

  updateLevel();

  updateSteps();


  feedback.textContent =
    `✓ Benar! "${currentQuestion.banjar}" — naik ${answerLength} kotak!`;

  feedback.className =
    "feedback correct";


  /*
   * Karakter naik.
   */

  animatePlayerToProgress(
    previousProgress,
    progress
  );


  /*
   * Jawaban benar TIDAK membuat ombak naik.
   * Bahkan sedikit mengurangi air agar pemain
   * merasa mendapat ruang bernapas.
   */

  decreaseWave(8);


  /*
   * Durasi animasi.
   */

  const climbDuration =
    Math.max(
      900,
      (progress - previousProgress) *
        CLIMB_STEP_DELAY +
        250
    );


  /*
   * Menang jika mencapai kotak 15.
   */

  if (
    progress >= TOTAL_STEPS
  ) {

    setTimeout(
      () => {

        if (!gameEnded) {

          endGame(true);
        }

      },
      climbDuration
    );

    return;
  }


  /*
   * Soal berikutnya.
   */

  setTimeout(
    () => {

      if (!gameEnded) {

        nextQuestion();
      }

    },
    climbDuration
  );
}


/* =========================================================
   WRONG ANSWER
========================================================= */

function handleWrongAnswer() {

  lives--;

  updateLives();


  feedback.textContent =
    `✗ Belum tepat. Jawabannya: ${currentQuestion.banjar}`;

  feedback.className =
    "feedback wrong";


  /*
   * Jawaban salah = ombak naik besar.
   */

  advanceWave(
    WRONG_WAVE_STEP,
    true
  );


  /*
   * Efek karakter panik.
   */

  player.classList.remove(
    "danger"
  );

  void player.offsetWidth;

  player.classList.add(
    "danger"
  );


  /*
   * Jika nyawa habis.
   */

  if (
    lives <= 0
  ) {

    setTimeout(
      () => {

        if (!gameEnded) {

          endGame(false);
        }

      },
      1000
    );

    return;
  }


  /*
   * Lanjut ke soal berikutnya.
   */

  setTimeout(
    () => {

      if (!gameEnded) {

        nextQuestion();
      }

    },
    1200
  );
}


/* =========================================================
   WAVE SYSTEM
========================================================= */

function startWaveSystem() {

  stopWaveSystem();


  waveInterval =
    setInterval(
      () => {

        if (
          gameEnded
        ) {

          return;
        }


        /*
         * Ombak naik perlahan setiap 5 detik.
         */

        advanceWave(
          PASSIVE_WAVE_STEP,
          false
        );

      },
      WAVE_INTERVAL_TIME
    );
}


function stopWaveSystem() {

  if (
    waveInterval
  ) {

    clearInterval(
      waveInterval
    );

    waveInterval = null;
  }
}


/* =========================================================
   ADVANCE WAVE
========================================================= */

function advanceWave(
  amount,
  isPenalty = false
) {

  if (
    gameEnded
  ) {

    return;
  }


  waterHeight += amount;


  /*
   * Jangan membuat batas air sebagai
   * penyebab langsung game over.
   */

  waterHeight =
    Math.max(
      INITIAL_WATER_HEIGHT,
      waterHeight
    );


  /*
   * Visual air.
   */

  water.style.height =
    `${waterHeight}px`;


  /*
   * Animasi naik.
   */

  water.classList.remove(
    "rising"
  );

  void water.offsetWidth;

  water.classList.add(
    "rising"
  );


  /*
   * Efek surge ketika jawaban salah.
   */

  if (
    isPenalty
  ) {

    water.classList.remove(
      "surge"
    );

    void water.offsetWidth;

    water.classList.add(
      "surge"
    );
  }


  updateWaveDanger();


  /*
   * Setelah air bergerak,
   * cek apakah benar-benar sudah
   * mencapai karakter.
   */

  requestAnimationFrame(
    () => {

      checkWaterReachedPlayer();
    }
  );
}


/* =========================================================
   CHECK WATER REACH PLAYER
========================================================= */

function checkWaterReachedPlayer() {

  if (
    gameEnded ||
    !gameStarted ||
    !gameWorld ||
    !water ||
    !player
  ) {

    return;
  }


  /*
   * Kalau sudah sampai kotak 15,
   * jangan game over karena ombak.
   */

  if (
    progress >= TOTAL_STEPS
  ) {

    return;
  }


  const worldRect =
    gameWorld.getBoundingClientRect();


  const playerRect =
    player.getBoundingClientRect();


  const waterRect =
    water.getBoundingClientRect();


  /*
   * Posisi atas air relatif terhadap
   * game world.
   */

  const waterTop =
    waterRect.top -
    worldRect.top;


  /*
   * JANGAN menggunakan kaki karakter.
   *
   * Air boleh menyentuh kaki terlebih dahulu.
   * Pemain baru dianggap tertangkap ketika
   * air mencapai bagian tubuh bawah.
   */

  const playerTop =
    playerRect.top -
    worldRect.top;


  /*
   * Titik tangkap air.
   *
   * 45% dari tinggi karakter dihitung
   * dari bagian atas karakter.
   *
   * Bisa diubah menjadi 50% jika ingin
   * karakter lebih cepat tertangkap.
   */

  const playerCatchLine =
    playerTop +
    playerRect.height * 0.45;


  /*
   * Air mencapai tubuh karakter.
   */

  if (
    waterTop <= playerCatchLine
  ) {

    endGame(false);
  }
}


/* =========================================================
   WAVE BERKURANG
========================================================= */

function decreaseWave(amount) {

  waterHeight =
    Math.max(
      INITIAL_WATER_HEIGHT,
      waterHeight - amount
    );


  water.style.height =
    `${waterHeight}px`;


  water.classList.remove(
    "rising"
  );


  updateWaveDanger();


  /*
   * Pastikan pengurangan air
   * tidak menyebabkan collision.
   */

  requestAnimationFrame(
    () => {

      checkWaterReachedPlayer();
    }
  );
}


/* =========================================================
   WAVE DANGER
========================================================= */

function updateWaveDanger() {

  /*
   * Gunakan tinggi relatif terhadap
   * game world untuk menentukan warning.
   */

  if (
    !gameWorld ||
    !water
  ) {

    return;
  }


  const worldHeight =
    gameWorld.clientHeight;


  if (
    worldHeight <= 0
  ) {

    return;
  }


  const dangerRatio =
    waterHeight /
    worldHeight;


  /*
   * Ombak mulai mengancam.
   */

  if (
    dangerRatio >= 0.55
  ) {

    player.classList.add(
      "danger"
    );

  }

  else {

    player.classList.remove(
      "danger"
    );
  }


  /*
   * Peringatan.
   *
   * Jangan terus-menerus menimpa
   * feedback jawaban benar/salah.
   */

  if (
    dangerRatio >= 0.78 &&
    !answerLocked
  ) {

    feedback.textContent =
      "⚠️ Ombak semakin dekat! Terus naik!";

    feedback.className =
      "feedback wrong";
  }
}


/* =========================================================
   RESET WATER
========================================================= */

function resetWater() {

  waterHeight =
    INITIAL_WATER_HEIGHT;


  water.style.height =
    `${INITIAL_WATER_HEIGHT}px`;


  water.classList.remove(
    "rising",
    "surge"
  );


  player.classList.remove(
    "danger"
  );
}


/* =========================================================
   UPDATE STEPS
========================================================= */

function updateSteps() {

  const steps =
    boxPath.querySelectorAll(
      ".step-box"
    );


  steps.forEach(
    (step, index) => {

      const stepNumber =
        index + 1;


      step.classList.remove(
        "reached",
        "current"
      );


      /*
       * Kotak yang sudah dilewati.
       */

      if (
        stepNumber <= progress
      ) {

        step.classList.add(
          "reached"
        );
      }


      /*
       * Kotak tujuan berikutnya.
       */

      if (
        stepNumber ===
          progress + 1 &&
        progress < TOTAL_STEPS
      ) {

        step.classList.add(
          "current"
        );
      }
    }
  );
}


/* =========================================================
   ANIMATE PLAYER TO PROGRESS
========================================================= */

function animatePlayerToProgress(
  previousProgress,
  newProgress
) {

  if (
    newProgress <= previousProgress
  ) {

    return;
  }


  const steps =
    boxPath.querySelectorAll(
      ".step-box"
    );


  let currentStep =
    previousProgress + 1;


  const climbNext =
    () => {

      if (
        gameEnded
      ) {

        return;
      }


      if (
        currentStep > newProgress
      ) {

        return;
      }


      const step =
        steps[currentStep - 1];


      if (!step) {

        return;
      }


      /*
       * Efek kotak.
       */

      step.classList.add(
        "climbing-to"
      );


      /*
       * Pindahkan karakter.
       */

      placePlayerOnStep(
        step,
        true
      );


      /*
       * Tandai kotak tercapai.
       */

      step.classList.add(
        "reached"
      );


      currentStep++;


      /*
       * Lanjut ke kotak berikutnya.
       */

      if (
        currentStep <= newProgress
      ) {

        setTimeout(
          climbNext,
          CLIMB_STEP_DELAY
        );
      }
    };


  climbNext();
}


/* =========================================================
   PLACE PLAYER ON STEP
========================================================= */

function placePlayerOnStep(
  step,
  animate = true
) {

  if (!step) {

    return;
  }


  const worldRect =
    gameWorld.getBoundingClientRect();


  const stepRect =
    step.getBoundingClientRect();


  /*
   * Tengah kotak secara horizontal.
   */

  const stepCenterX =
    stepRect.left +
    stepRect.width / 2;


  /*
   * X relatif terhadap game world.
   */

  const relativeX =
    stepCenterX -
    worldRect.left;


  /*
   * Posisi karakter berdiri
   * di atas kotak.
   */

  const playerBottom =
    worldRect.bottom -
    stepRect.top -
    player.offsetHeight +
    6;


  player.style.left =
    `${relativeX}px`;


  player.style.bottom =
    `${playerBottom}px`;


  player.style.top =
    "auto";


  player.style.transform =
    "translateX(-50%)";


  if (
    animate
  ) {

    player.classList.remove(
      "jumping"
    );

    void player.offsetWidth;

    player.classList.add(
      "jumping"
    );
  }
}


/* =========================================================
   RESET PLAYER
========================================================= */

function resetPlayer() {

  player.classList.remove(
    "jumping",
    "danger"
  );


  /*
   * Karakter mulai tepat sebelum
   * kotak nomor 1.
   */

  player.style.left =
    "50%";


  player.style.top =
    "auto";


  player.style.bottom =
    "105px";


  player.style.transform =
    "translateX(-50%)";
}


/* =========================================================
   UPDATE SCORE
========================================================= */

function updateScore() {

  if (scoreElement) {

    scoreElement.textContent =
      score;
  }
}


/* =========================================================
   UPDATE LIVES
========================================================= */

function updateLives() {

  if (!livesElement) {
    return;
  }


  const hearts =
    "❤️ ".repeat(
      Math.max(
        lives,
        0
      )
    ).trim();


  livesElement.textContent =
    hearts ||
    "💔";
}


/* =========================================================
   UPDATE LEVEL
========================================================= */

function updateLevel() {

  if (levelElement) {

    levelElement.textContent =
      level;
  }
}


/* =========================================================
   NORMALIZE ANSWER
========================================================= */

function normalizeAnswer(value) {

  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


/* =========================================================
   COUNT LETTERS
========================================================= */

function countLetters(word) {

  return String(word || "")
    .replace(
      /\s/g,
      ""
    )
    .length;
}


/* =========================================================
   SHUFFLE ARRAY
========================================================= */

function shuffleArray(array) {

  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
          (i + 1)
      );


    [
      array[i],
      array[j]
    ] = [
      array[j],
      array[i]
    ];
  }


  return array;
}


/* =========================================================
   SIMPAN SKOR GAME 8
========================================================= */

async function simpanSkor() {

  /*
   * Ambil nama pemain dari login.
   *
   * lantingNama = nama dari sistem login baru.
   *
   * lantingKataNamaPemain = nama yang digunakan
   * oleh beberapa game lama.
   */

  const nama =
    localStorage.getItem("lantingNama") ||
    localStorage.getItem("lantingKataNamaPemain") ||
    "";


  /*
   * Kalau nama tidak ditemukan,
   * permainan tetap boleh selesai.
   */

  if (!nama) {

    console.warn(
      "Hindari Ombak: nama pemain tidak ditemukan."
    );

    return null;
  }


  try {

    const params =
      new URLSearchParams();


    params.append(
      "action",
      "simpanSkor"
    );


    params.append(
      "nama",
      nama
    );


    params.append(
      "skor",
      score
    );


    /*
     * Game 8 = Hindari Ombak.
     */

    params.append(
      "game",
      "8"
    );


    const response =
      await fetch(
        `${WEB_APP_URL}?${params.toString()}`
      );


    if (!response.ok) {

      throw new Error(
        "Server tidak dapat diakses."
      );
    }


    const data =
      await response.json();


    console.log(
      "Skor Game 08 berhasil disimpan:",
      data
    );


    return data;

  }

  catch (error) {

    /*
     * Jangan membuat permainan gagal
     * hanya karena penyimpanan skor gagal.
     */

    console.error(
      "Gagal menyimpan skor Game 08:",
      error
    );


    return null;
  }
}


/* =========================================================
   END GAME
========================================================= */

async function endGame(success) {

  if (
    gameEnded
  ) {

    return;
  }


  gameEnded = true;

  gameStarted = false;

  answerLocked = true;


  stopWaveSystem();


  if (answerInput) {

    answerInput.disabled =
      true;
  }


  player.classList.remove(
    "jumping",
    "danger"
  );


  finalScore.textContent =
    score;


  finalLives.textContent =
    lives;


  finalLevel.textContent =
    level;


  if (
    success
  ) {

    resultIcon.textContent =
      "🎉";


    resultTitle.textContent =
      "Kamu Berhasil!";


    resultText.textContent =
      "Hebat! Kamu berhasil menghindari ombak dan mencapai tempat yang aman.";

  }

  else {

    resultIcon.textContent =
      "🌊";


    resultTitle.textContent =
      "Ombak Menyusul!";


    resultText.textContent =
      "Permainan selesai. Jangan menyerah, coba lagi dan taklukkan ombaknya!";
  }


  gameSection.classList.add(
    "hidden"
  );


  resultSection.classList.remove(
    "hidden"
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  /*
   * Simpan skor setelah permainan selesai.
   *
   * Game 8 = Hindari Ombak.
   */

  await simpanSkor();
}


/* =========================================================
   PLAY AGAIN
========================================================= */

if (playAgainButton) {

  playAgainButton.addEventListener(
    "click",
    () => {

      resultSection.classList.add(
        "hidden"
      );


      startSection.classList.remove(
        "hidden"
      );


      gameStarted = false;

      gameEnded = false;

      answerLocked = false;


      /*
       * Kosakata tidak perlu dimuat ulang.
       * Kita sudah menyimpannya.
       */

      if (vocabulary.length > 0) {

        loadingText.textContent =
          `${vocabulary.length} kosakata siap dimainkan!`;

        startButton.disabled =
          false;
      }
    }
  );
}