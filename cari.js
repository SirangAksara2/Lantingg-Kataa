// ========================================
// LINK GOOGLE SHEET LANTING KATA
// ========================================

const urlSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYJ3ve7IUTIBC6hy24is1rTu309JDuksk97G-lC4RpQ2R4cHHigvwje29XgnnZVINMAGYWq29yvmPM/pub?output=csv";

let dataKata = [];

// ========================================
// RIWAYAT PENCARIAN
// ========================================

const kunciRiwayat = "lantingKataRiwayatPencarian";
let riwayatPencarian = [];

// ========================================
// MENGAMBIL DATA DARI GOOGLE SHEETS
// ========================================

async function ambilData() {
    try {
        const response = await fetch(urlSheet);

        if (!response.ok) {
            throw new Error("Data tidak dapat diambil.");
        }

        const csv = await response.text();
        dataKata = bacaCSV(csv);

        console.log("Data berhasil diambil:", dataKata);
        console.log("Gambar pertama:", dataKata[0]?.gambar);
        console.log("Audio pertama:", dataKata[0]?.audio);

    } catch (error) {
        console.error("Terjadi kesalahan:", error);

        document.getElementById("hasil").innerHTML = `
            <div class="pesan">
                ⚠️ Data kosakata belum dapat dimuat.
            </div>
        `;
    }
}

// ========================================
// MEMBACA DATA CSV
// ========================================

function bacaCSV(csv) {
    const baris = csv.trim().split(/\r?\n/);

    function pecahCSV(barisData) {
        const hasil = [];
        let nilai = "";
        let dalamKutipan = false;

        for (let i = 0; i < barisData.length; i++) {
            const karakter = barisData[i];

            if (karakter === '"') {
                if (
                    dalamKutipan &&
                    barisData[i + 1] === '"'
                ) {
                    nilai += '"';
                    i++;
                } else {
                    dalamKutipan = !dalamKutipan;
                }
            } else if (
                karakter === "," &&
                !dalamKutipan
            ) {
                hasil.push(nilai.trim());
                nilai = "";
            } else {
                nilai += karakter;
            }
        }

        hasil.push(nilai.trim());
        return hasil;
    }

    return baris.slice(1).map(barisData => {
        const kolom = pecahCSV(barisData);

        return {
            no: kolom[0] || "",
            banjar: kolom[1] || "",
            indonesia: kolom[2] || "",
            kategori: kolom[3] || "",
            contoh: kolom[4] || "",
            gambar: kolom[5] || "",
            audio: kolom[6] || ""
        };
    });
}

// ========================================
// MENGUBAH LINK GAMBAR GOOGLE DRIVE
// ========================================

function ubahLinkGambar(link) {
    if (!link) {
        return "";
    }

    const cocok = String(link).match(/\/file\/d\/([^/]+)/);

    if (cocok && cocok[1]) {
        const idFile = cocok[1];

        return `https://drive.google.com/thumbnail?id=${idFile}&sz=w800`;
    }

    return link;
}

// ========================================
// MENGUBAH LINK AUDIO
// MENDUKUNG GITHUB DAN GOOGLE DRIVE
// ========================================

function ubahLinkAudio(link) {
    if (!link) {
        return "";
    }

    link = String(link).trim();

    try {
        const url = new URL(link);

        // Mengubah halaman file GitHub menjadi link audio langsung
        if (
            url.hostname === "github.com" &&
            url.pathname.includes("/blob/")
        ) {
            const bagian = url.pathname.split("/");
            const blobIndex = bagian.indexOf("blob");

            if (blobIndex >= 3) {
                const owner = bagian[1];
                const repo = bagian[2];
                const branch = bagian[blobIndex + 1];
                const pathFile = bagian
                    .slice(blobIndex + 2)
                    .join("/");

                return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${pathFile}`;
            }
        }

        // Link raw GitHub sudah merupakan link langsung
        if (url.hostname === "raw.githubusercontent.com") {
            return url.href;
        }

        // Link Google Drive dengan format /file/d/ID
        if (
            url.hostname === "drive.google.com" &&
            url.pathname.startsWith("/file/d/")
        ) {
            const idFile = url.pathname.split("/")[3] || "";

            if (idFile) {
                return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(idFile)}`;
            }
        }

        // Link Google Drive dengan parameter ?id=ID
        if (
            url.hostname === "drive.google.com" &&
            url.searchParams.has("id")
        ) {
            const idFile = url.searchParams.get("id") || "";

            if (idFile) {
                return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(idFile)}`;
            }
        }

        return url.href;

    } catch (error) {
        return link;
    }
}

// ========================================
// MENGAMANKAN TEKS HTML
// ========================================

function escapeHTML(teks) {
    return String(teks)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========================================
// MEMUAT RIWAYAT PENCARIAN
// ========================================

function muatRiwayatPencarian() {
    try {
        const tersimpan = localStorage.getItem(kunciRiwayat);

        if (tersimpan) {
            const dataTersimpan = JSON.parse(tersimpan);

            if (Array.isArray(dataTersimpan)) {
                riwayatPencarian = dataTersimpan.slice(0, 10);
            } else {
                riwayatPencarian = [];
            }
        } else {
            riwayatPencarian = [];
        }

    } catch (error) {
        console.error(
            "Riwayat pencarian tidak dapat dimuat:",
            error
        );

        riwayatPencarian = [];
    }

    tampilkanRiwayatPencarian();
}

// ========================================
// MENYIMPAN RIWAYAT PENCARIAN
// ========================================

function simpanRiwayatPencarian(kata) {
    if (!kata) {
        return;
    }

    // Menghapus kata yang sama jika sudah ada
    riwayatPencarian = riwayatPencarian.filter(
        item => item.toLowerCase() !== kata.toLowerCase()
    );

    // Pencarian terbaru ditempatkan paling depan
    riwayatPencarian.unshift(kata);

    // Maksimal 10 riwayat
    riwayatPencarian = riwayatPencarian.slice(0, 10);

    try {
        localStorage.setItem(
            kunciRiwayat,
            JSON.stringify(riwayatPencarian)
        );
    } catch (error) {
        console.error(
            "Riwayat pencarian tidak dapat disimpan:",
            error
        );
    }

    tampilkanRiwayatPencarian();
}

// ========================================
// MENAMPILKAN RIWAYAT PENCARIAN
// ========================================

function tampilkanRiwayatPencarian() {
    const daftar = document.getElementById("daftarRiwayat");
    const tombolHapus = document.getElementById("hapusRiwayat");

    if (!daftar) {
        return;
    }

    // Jika belum ada riwayat
    if (riwayatPencarian.length === 0) {
        daftar.innerHTML = `
            <div class="riwayat-kosong">
                Belum ada kata yang dicari.
            </div>
        `;

        if (tombolHapus) {
            tombolHapus.style.display = "none";
        }

        return;
    }

    // Menampilkan tombol hapus riwayat
    if (tombolHapus) {
        tombolHapus.style.display = "inline-block";
    }

    daftar.innerHTML = "";

    riwayatPencarian.forEach(kata => {
        const tombol = document.createElement("button");

        tombol.type = "button";
        tombol.className = "riwayat-item";
        tombol.innerHTML = `🔎 ${escapeHTML(kata)}`;

        tombol.addEventListener("click", function () {
            cariDariRiwayat(kata);
        });

        daftar.appendChild(tombol);
    });
}

// ========================================
// MENCARI DARI RIWAYAT
// ========================================

function cariDariRiwayat(kata) {
    const input = document.getElementById("inputPencarian");

    if (!input) {
        return;
    }

    input.value = kata;
    cariKata();
}

// ========================================
// MENGHAPUS SEMUA RIWAYAT
// ========================================

function hapusSemuaRiwayat() {
    if (riwayatPencarian.length === 0) {
        return;
    }

    const yakin = confirm("Hapus semua riwayat pencarian?");

    if (!yakin) {
        return;
    }

    riwayatPencarian = [];

    try {
        localStorage.removeItem(kunciRiwayat);
    } catch (error) {
        console.error(
            "Riwayat pencarian tidak dapat dihapus:",
            error
        );
    }

    tampilkanRiwayatPencarian();
}

// ========================================
// FUNGSI PENCARIAN KOSAKATA
// ========================================

function cariKata() {
    const elemenInput = document.getElementById("inputPencarian");
    const hasil = document.getElementById("hasil");

    if (!elemenInput || !hasil) {
        return;
    }

    const input = elemenInput.value.toLowerCase().trim();

    // Jika input kosong
    if (input === "") {
        hasil.innerHTML = `
            <div class="pesan">
                Silakan ketik kata yang ingin dicari.
            </div>
        `;

        return;
    }

    // Mencari kosakata Bahasa Banjar atau Bahasa Indonesia
    const ditemukan = dataKata.filter(kata =>
        kata.banjar.toLowerCase().includes(input) ||
        kata.indonesia.toLowerCase().includes(input)
    );

    console.log("HASIL PENCARIAN:", ditemukan);
    console.log("DATA GAMBAR:", ditemukan[0]?.gambar);
    console.log("DATA AUDIO:", ditemukan[0]?.audio);

    // Jika kosakata tidak ditemukan
    if (ditemukan.length === 0) {
        hasil.innerHTML = `
            <div class="pesan">
                😔 Kosakata
                "<strong>${escapeHTML(input)}</strong>"
                belum ditemukan.
            </div>
        `;

        return;
    }

    // Menyimpan riwayat jika pencarian berhasil
    simpanRiwayatPencarian(input);

    // Menampilkan hasil pencarian
    hasil.innerHTML = ditemukan.map(kata => {
        const gambar = ubahLinkGambar(kata.gambar);
        const audio = ubahLinkAudio(kata.audio);

        return `
            <div class="hasil-card">

                <h3>
                    ${escapeHTML(kata.banjar)}
                </h3>

                ${
                    gambar
                    ? `
                        <img
                            src="${escapeHTML(gambar)}"
                            alt="${escapeHTML(kata.banjar)}"
                            class="gambar-kata"
                            onerror="this.style.display='none'"
                        >
                    `
                    : ""
                }

                ${
                    audio
                    ? `
                        <div class="audio-kata">
                            <audio controls preload="metadata">
                                <source
                                    src="${escapeHTML(audio)}"
                                    type="audio/mpeg"
                                >
                                Browser kamu tidak mendukung pemutaran audio.
                            </audio>

                        </div>
                    `
                    : ""
                }

                <p>
                    <strong>Arti:</strong>
                    ${escapeHTML(kata.indonesia)}
                </p>

                <p>
                    <strong>Kategori:</strong>
                    ${escapeHTML(kata.kategori)}
                </p>

                <p>
                    <strong>Contoh Kalimat:</strong>
                    ${escapeHTML(kata.contoh)}
                </p>

            </div>
        `;
    }).join("");
}

// ========================================
// TEKAN ENTER UNTUK MENCARI
// ========================================

function tekanEnter(event) {
    if (event.key === "Enter") {
        cariKata();
    }
}

// ========================================
// MENJALANKAN FUNGSI SAAT HALAMAN DIBUKA
// ========================================

ambilData();
muatRiwayatPencarian();