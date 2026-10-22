// ========================================
// LANTING KATA - KAMUS
// ========================================

// ========================================
// LINK GOOGLE SHEET
// ========================================

const urlSheet =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYJ3ve7IUTIBC6hy24is1rTu309JDuksk97G-lC4RpQ2R4cHHigvwje29XgnnZVINMAGYWq29yvmPM/pub?output=csv";

let dataKata = [];


// ========================================
// KEMBALI KE DASHBOARD
// ========================================

function kembaliDashboard() {
    window.location.href = "dashboard.html";
}


// ========================================
// MENGAMBIL DATA GOOGLE SHEET
// ========================================

async function ambilData() {
    try {
        const response = await fetch(urlSheet);

        if (!response.ok) {
            throw new Error("Data tidak dapat diambil.");
        }

        const csv = await response.text();

        dataKata = bacaCSV(csv);

        console.log("Data Kamus berhasil diambil:", dataKata);
        console.log("Contoh link audio:", dataKata[0]?.audio);

    } catch (error) {
        console.error("Terjadi kesalahan:", error);

        const hasil = document.getElementById("hasilKamus");

        if (hasil) {
            hasil.innerHTML = `
                <div class="pesan">
                    ⚠️ Data kosakata belum dapat dimuat.
                </div>
            `;
        }
    }
}


// ========================================
// MEMBACA CSV
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

    // Lewati baris pertama karena merupakan header
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
// MENGAMANKAN TEKS HTML
// ========================================

function escapeHTML(teks) {
    return String(teks ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ========================================
// MENGUBAH LINK GAMBAR GOOGLE DRIVE
// ========================================

function ubahLinkGambar(link) {
    if (!link) {
        return "";
    }

    link = String(link).trim();

    // Mengambil ID file Google Drive
    const cocok = link.match(/\/file\/d\/([^/]+)/);

    if (cocok && cocok[1]) {
        const idFile = cocok[1];

        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(idFile)}&sz=w800`;
    }

    // Link gambar lainnya tetap digunakan
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

        // GitHub biasa: ubah /blob/ menjadi link MP3 langsung
        if (
            url.hostname === "github.com" &&
            url.pathname.includes("/blob/")
        ) {
            const bagian = url.pathname.split("/");
            const indeksBlob = bagian.indexOf("blob");

            if (indeksBlob >= 3) {
                const pemilik = bagian[1];
                const repositori = bagian[2];
                const cabang = bagian[indeksBlob + 1];
                const lokasiFile = bagian
                    .slice(indeksBlob + 2)
                    .join("/");

                return `https://raw.githubusercontent.com/${pemilik}/${repositori}/${cabang}/${lokasiFile}`;
            }
        }

        // Link raw GitHub sudah bisa digunakan langsung
        if (url.hostname === "raw.githubusercontent.com") {
            return url.href;
        }

        // Link Google Drive berbentuk /file/d/ID
        if (
            url.hostname === "drive.google.com" &&
            url.pathname.startsWith("/file/d/")
        ) {
            const bagian = url.pathname.split("/");
            const idFile = bagian[3];

            if (idFile) {
                return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(idFile)}`;
            }
        }

        // Link Google Drive dengan parameter ?id=ID
        if (
            url.hostname === "drive.google.com" &&
            url.searchParams.has("id")
        ) {
            const idFile = url.searchParams.get("id");

            if (idFile) {
                return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(idFile)}`;
            }
        }

        // Link GitHub Pages dan URL lainnya tetap digunakan
        return url.href;

    } catch (error) {
        console.error("Link audio tidak valid:", error);
        return "";
    }
}


// ========================================
// PILIH KATEGORI
// ========================================

function pilihKategori(namaKategori) {
    console.log("Kategori dipilih:", namaKategori);

    const hasil = document.getElementById("hasilKamus");

    if (!hasil) {
        return;
    }

    const bagianKategori = document.querySelector(".bagian-kategori");

    if (bagianKategori) {
        bagianKategori.scrollIntoView({
            behavior: "smooth"
        });
    }

    // Filter data berdasarkan kategori
    const ditemukan = dataKata.filter(kata =>
        kata.kategori.toLowerCase().trim() ===
        namaKategori.toLowerCase().trim()
    );

    console.log("Kosakata kategori:", ditemukan);

    // Jika kosakata tidak ditemukan
    if (ditemukan.length === 0) {
        hasil.innerHTML = `
            <div class="pesan">
                😔 Belum ada kosakata untuk kategori
                <strong>${escapeHTML(namaKategori)}</strong>.
            </div>
        `;

        hasil.scrollIntoView({
            behavior: "smooth"
        });

        return;
    }

    // Judul dan daftar hasil
    hasil.innerHTML = `
        <div class="judul-hasil-kamus">
            <h2>📖 ${escapeHTML(namaKategori)}</h2>
            <p>${ditemukan.length} kosakata ditemukan</p>
        </div>

        <div class="daftar-kosakata">
            ${ditemukan.map(kata => buatKartuKata(kata)).join("")}
        </div>
    `;

    hasil.scrollIntoView({
        behavior: "smooth"
    });
}


// ========================================
// MEMBUAT KARTU KOSAKATA
// ========================================

function buatKartuKata(kata) {
    const gambar = ubahLinkGambar(kata.gambar);
    const audio = ubahLinkAudio(kata.audio);

    return `
        <div class="kartu-kosakata">

            ${
                gambar
                    ? `
                        <img
                            src="${escapeHTML(gambar)}"
                            alt="${escapeHTML(kata.banjar)}"
                            class="gambar-kosakata"
                            onerror="this.style.display='none'"
                        >
                    `
                    : ""
            }

            <div class="isi-kosakata">

                <h3>
                    ${escapeHTML(kata.banjar)}
                </h3>

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

                ${
                    audio
                        ? `
                            <div class="audio-kosakata">
                                <audio controls preload="metadata">
                                    <source
                                        src="${escapeHTML(audio)}"
                                        type="audio/mpeg"
                                    >
                                    Browser kamu tidak mendukung pemutar audio.
                                </audio>
                            </div>
                        `
                        : ""
                }

            </div>

        </div>
    `;
}


// ========================================
// JALANKAN SAAT HALAMAN DIBUKA
// ========================================

ambilData();