/* =========================================================
   BADAKUAN
   JAVASCRIPT TAHAP 3
   RUTE DAN MEKANIK MENABUR BIJI DASAR
========================================================= */


/* =========================================================
   VARIABEL PERMAINAN
========================================================= */

let jenisPermainan = "";

let modePemain = "";

let pemainAktif = 1;

const BIJI_AWAL = 7;


/*
 * Index global lubang:
 *
 * 0 - 6   = Pemain 1
 * 7 - 13  = Pemain 2
 */

let lubang = [
    7, 7, 7, 7, 7, 7,
    7,
    7, 7, 7, 7, 7, 7, 7
];


/*
 * Lumbung masing-masing pemain.
 */

let lumbung = {
    1: 0,
    2: 0
};


/*
 * Mencegah pemain mengklik lubang
 * ketika proses menabur sedang berlangsung.
 */

let sedangMenabur = false;


/* =========================================================
   ELEMENT HALAMAN
========================================================= */

const gameSetup =
    document.getElementById("gameSetup");

const modeSection =
    document.getElementById("modeSection");

const confirmationSection =
    document.getElementById("confirmationSection");

const boardSection =
    document.getElementById("boardSection");

const summaryJenis =
    document.getElementById("summaryJenis");

const summaryMode =
    document.getElementById("summaryMode");

const confirmationTitle =
    document.getElementById("confirmationTitle");

const confirmationDescription =
    document.getElementById("confirmationDescription");

const startButton =
    document.getElementById("startButton");


/* =========================================================
   PILIH JENIS PERMAINAN
========================================================= */

document
    .querySelectorAll("[data-jenis]")
    .forEach(function (tombol) {

        tombol.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll("[data-jenis]")
                    .forEach(function (item) {

                        item.classList.remove(
                            "selected"
                        );

                    });


                tombol.classList.add(
                    "selected"
                );


                jenisPermainan =
                    tombol.dataset.jenis;


                modeSection.classList.remove(
                    "hidden"
                );


                modePemain = "";


                document
                    .querySelectorAll("[data-mode]")
                    .forEach(function (item) {

                        item.classList.remove(
                            "selected"
                        );

                    });


                confirmationSection.classList.add(
                    "hidden"
                );


                setTimeout(function () {

                    modeSection.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }, 100);

            }
        );

    });


/* =========================================================
   PILIH MODE PEMAIN
========================================================= */

document
    .querySelectorAll("[data-mode]")
    .forEach(function (tombol) {

        tombol.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll("[data-mode]")
                    .forEach(function (item) {

                        item.classList.remove(
                            "selected"
                        );

                    });


                tombol.classList.add(
                    "selected"
                );


                modePemain =
                    tombol.dataset.mode;


                tampilkanKonfirmasi();


                confirmationSection.classList.remove(
                    "hidden"
                );


                setTimeout(function () {

                    confirmationSection.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }, 100);

            }
        );

    });


/* =========================================================
   TAMPILKAN KONFIRMASI
========================================================= */

function tampilkanKonfirmasi() {

    let namaJenis = "";

    let deskripsiJenis = "";

    let namaMode = "";


    /* Jenis permainan */

    if (
        jenisPermainan === "biasa"
    ) {

        namaJenis =
            "Badakuan Biasa";

        deskripsiJenis =
            "Mainkan Badakuan dengan aturan permainan tradisional.";

    }


    if (
        jenisPermainan === "banjar"
    ) {

        namaJenis =
            "Badakuan + Tantangan Kosakata Bahasa Banjar";

        deskripsiJenis =
            "Mainkan Badakuan sambil menjawab tantangan kosakata Bahasa Banjar.";

    }


    /* Mode pemain */

    if (
        modePemain === "bot"
    ) {

        namaMode =
            "1 Pemain — vs Bot";

    }


    if (
        modePemain === "teman"
    ) {

        namaMode =
            "2 Pemain — vs Teman";

    }


    summaryJenis.textContent =
        namaJenis;

    summaryMode.textContent =
        namaMode;

    confirmationTitle.textContent =
        namaJenis;

    confirmationDescription.textContent =
        deskripsiJenis;

}


/* =========================================================
   MULAI PERMAINAN
========================================================= */

startButton.addEventListener(
    "click",
    function () {

        if (
            !jenisPermainan ||
            !modePemain
        ) {

            alert(
                "Silakan pilih jenis permainan dan mode pemain terlebih dahulu."
            );

            return;

        }


        /* -----------------------------------------
           RESET DATA PERMAINAN
        ----------------------------------------- */

        pemainAktif = 1;

        lubang = [
            7, 7, 7, 7, 7, 7, 7,
            7, 7, 7, 7, 7, 7, 7
        ];

        lumbung = {
            1: 0,
            2: 0
        };

        sedangMenabur = false;


        /* -----------------------------------------
           SIMPAN PILIHAN
        ----------------------------------------- */

        localStorage.setItem(
            "badakuanJenis",
            jenisPermainan
        );

        localStorage.setItem(
            "badakuanMode",
            modePemain
        );


        /* -----------------------------------------
           TAMPILKAN PAPAN
        ----------------------------------------- */

        gameSetup.classList.add(
            "hidden"
        );

        boardSection.classList.remove(
            "hidden"
        );


        renderPapan();


        setTimeout(function () {

            boardSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 100);

    }
);


/* =========================================================
   RENDER PAPAN
========================================================= */

function renderPapan() {

    const semuaLubang =
        document.querySelectorAll(".pit");


    semuaLubang.forEach(function (pit) {

        const pemain =
            Number(
                pit.dataset.player
            );

        const index =
            Number(
                pit.dataset.index
            );


        /*
         * Pemain 1:
         * index 0 - 6
         *
         * Pemain 2:
         * index 0 - 6 disimpan
         * mulai dari index global 7
         */

        const indexGlobal =
            pemain === 1
                ? index
                : 7 + index;


        const jumlah =
            lubang[indexGlobal];


        const wadah =
            pit.querySelector(
                ".seed-container"
            );


        wadah.innerHTML = "";


        /*
         * Buat biji sesuai jumlah.
         */

        for (
            let i = 0;
            i < jumlah;
            i++
        ) {

            const biji =
                document.createElement(
                    "span"
                );

            biji.className =
                "seed";

            wadah.appendChild(
                biji
            );

        }

    });


    /* -----------------------------------------
       UPDATE LUMBUNG
    ----------------------------------------- */

    document.getElementById(
        "lumbungSeeds1"
    ).textContent =
        lumbung[1];

    document.getElementById(
        "lumbungSeeds2"
    ).textContent =
        lumbung[2];


    /* -----------------------------------------
       UPDATE SKOR
    ----------------------------------------- */

    document.getElementById(
        "scorePlayer1"
    ).textContent =
        lumbung[1];

    document.getElementById(
        "scorePlayer2"
    ).textContent =
        lumbung[2];


    /* -----------------------------------------
       UPDATE GILIRAN
    ----------------------------------------- */

    document.getElementById(
        "turnText"
    ).textContent =
        "Giliran Pemain " +
        pemainAktif;

}


/* =========================================================
   RUTE PEMAIN 1
========================================================= */


/*
 * TAMPILAN PAPAN
 *
 *
 *        PEMAIN 2
 *
 * [7] [6] [5] [4] [3] [2] [1]
 *
 * =============================
 *
 * [1] [2] [3] [4] [5] [6] [7]
 *
 *        PEMAIN 1
 *
 *
 *
 * PEMAIN 1:
 *
 * P1-1
 *   →
 * P1-2
 *   →
 * P1-3
 *   →
 * P1-4
 *   →
 * P1-5
 *   →
 * P1-6
 *   →
 * P1-7
 *   →
 * LUMBUNG P1
 *   →
 * P2-1
 *   →
 * P2-2
 *   →
 * P2-3
 *   →
 * P2-4
 *   →
 * P2-5
 *   →
 * P2-6
 *   →
 * P2-7
 *   →
 * P1-1
 *
 *
 * Lumbung P2 dilewati.
 */

function rutePemain1() {

    return [

        /* -------------------------------------
           PEMAIN 1
        ------------------------------------- */

        {
            tipe: "lubang",
            pemain: 1,
            index: 0
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 1
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 2
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 3
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 4
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 5
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 6
        },


        /* -------------------------------------
           LUMBUNG PEMAIN 1
        ------------------------------------- */

        {
            tipe: "lumbung",
            pemain: 1
        },


        /* -------------------------------------
           PEMAIN 2
           Masuk dari sisi kanan P2
           lalu bergerak ke kiri.
        ------------------------------------- */

        {
            tipe: "lubang",
            pemain: 2,
            index: 6
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 5
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 4
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 3
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 2
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 1
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 0
        }

    ];

}


/* =========================================================
   RUTE PEMAIN 2
========================================================= */


/*
 * PEMAIN 2 bergerak ke KIRI secara visual.
 *
 *
 * TAMPILAN:
 *
 * [7] [6] [5] [4] [3] [2] [1]
 *  ←─────────────────────────
 *
 *
 * Dari P2-1:
 *
 * P2-1
 *   →
 * P2-2
 *   →
 * P2-3
 *   →
 * P2-4
 *   →
 * P2-5
 *   →
 * P2-6
 *   →
 * P2-7
 *   →
 * LUMBUNG P2
 *   →
 * P1-1
 *   →
 * P1-2
 *   →
 * P1-3
 *   →
 * P1-4
 *   →
 * P1-5
 *   →
 * P1-6
 *   →
 * P1-7
 *
 *
 * CATATAN PENTING:
 *
 * P2-7 berada di ujung kiri.
 *
 * Setelah P2-7,
 * jalur turun ke P1-1,
 * BUKAN P1-7.
 */

function rutePemain2() {

    return [

        /* -------------------------------------
           PEMAIN 2
           index 6 = P2-1
           index 0 = P2-7
        ------------------------------------- */

        {
            tipe: "lubang",
            pemain: 2,
            index: 6
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 5
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 4
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 3
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 2
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 1
        },

        {
            tipe: "lubang",
            pemain: 2,
            index: 0
        },


        /* -------------------------------------
           LUMBUNG PEMAIN 2
        ------------------------------------- */

        {
            tipe: "lumbung",
            pemain: 2
        },


        /* -------------------------------------
           PEMAIN 1
           MASUK KE P1-1
           
           Ini bagian yang sebelumnya salah.
           
           P2-7 → P1-1
           
           Kemudian bergerak ke kanan:
           
           P1-1 → P1-2 → ... → P1-7
        ------------------------------------- */

        {
            tipe: "lubang",
            pemain: 1,
            index: 0
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 1
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 2
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 3
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 4
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 5
        },

        {
            tipe: "lubang",
            pemain: 1,
            index: 6
        }

    ];

}


/* =========================================================
   DAPATKAN RUTE PEMAIN AKTIF
========================================================= */

function dapatkanRute(pemain) {

    if (
        pemain === 1
    ) {

        return rutePemain1();

    }


    return rutePemain2();

}


/* =========================================================
   CARI POSISI LUBANG DALAM RUTE
========================================================= */

function cariPosisiDalamRute(
    rute,
    pemain,
    index
) {

    return rute.findIndex(
        function (posisi) {

            return (
                posisi.tipe === "lubang" &&
                posisi.pemain === pemain &&
                posisi.index === index
            );

        }
    );

}


/* =========================================================
   KLIK LUBANG
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const pit =
            event.target.closest(
                ".pit"
            );


        if (!pit) {
            return;
        }


        /*
         * Tidak boleh memilih lubang
         * ketika biji sedang berjalan.
         */

        if (
            sedangMenabur
        ) {

            return;

        }


        const pemain =
            Number(
                pit.dataset.player
            );


        /*
         * Pastikan yang bermain
         * adalah pemain yang sedang mendapat giliran.
         */

        if (
            pemain !== pemainAktif
        ) {

            document.getElementById(
                "boardInstructionText"
            ).textContent =
                "Sekarang giliran Pemain " +
                pemainAktif +
                ". Pilih lubang milikmu.";

            return;

        }


        const index =
            Number(
                pit.dataset.index
            );


        const indexGlobal =
            pemain === 1
                ? index
                : 7 + index;


        /*
         * Tidak boleh memilih lubang kosong.
         */

        if (
            lubang[indexGlobal] === 0
        ) {

            document.getElementById(
                "boardInstructionText"
            ).textContent =
                "Lubang itu kosong. Pilih lubang lain yang masih berisi biji.";

            return;

        }


        mulaiMenabur(
            pemain,
            index
        );

    }
);


/* =========================================================
   MULAI MENABUR
========================================================= */

function mulaiMenabur(
    pemain,
    index
) {

    sedangMenabur = true;


    const indexGlobal =
        pemain === 1
            ? index
            : 7 + index;


    /*
     * Ambil semua biji dari lubang.
     */

    const jumlahBiji =
        lubang[indexGlobal];


    lubang[indexGlobal] = 0;


    renderPapan();


    /*
     * Dapatkan rute pemain.
     */

    const rute =
        dapatkanRute(pemain);


    /*
     * Cari posisi lubang awal.
     */

    const posisiAwal =
        cariPosisiDalamRute(
            rute,
            pemain,
            index
        );


    /*
     * Mulai proses menabur.
     */

    taburkanBiji(
        rute,
        posisiAwal,
        jumlahBiji
    );

}


/* =========================================================
   TABURKAN SATU BIJI
========================================================= */

function taburkanBiji(
    rute,
    posisiSekarang,
    sisaBiji
) {

    /*
     * Semua biji sudah habis.
     */

    if (
        sisaBiji <= 0
    ) {

        selesaiMenabur();

        return;

    }


    /*
     * Bergerak ke posisi berikutnya.
     */

    posisiSekarang++;


    /*
     * Jika melewati akhir rute,
     * kembali ke awal rute.
     */

    if (
        posisiSekarang >= rute.length
    ) {

        posisiSekarang = 0;

    }


    const posisi =
        rute[posisiSekarang];


    /* -----------------------------------------
       JIKA MASUK LUMBUNG
    ----------------------------------------- */

    if (
        posisi.tipe === "lumbung"
    ) {

        lumbung[
            posisi.pemain
        ]++;

    }


    /* -----------------------------------------
       JIKA MASUK LUBANG
    ----------------------------------------- */

    else {

        const indexGlobal =
            posisi.pemain === 1
                ? posisi.index
                : 7 + posisi.index;


        lubang[indexGlobal]++;

    }


    /*
     * Perbarui tampilan.
     */

    renderPapan();


    /*
     * Beri jeda supaya biji terlihat
     * berjalan satu per satu.
     */

    setTimeout(
        function () {

            taburkanBiji(
                rute,
                posisiSekarang,
                sisaBiji - 1
            );

        },
        220
    );

}


/* =========================================================
   SELESAI MENABUR
========================================================= */

function selesaiMenabur() {

    sedangMenabur = false;


    /*
     * UNTUK TAHAP INI:
     * giliran langsung berpindah.
     *
     * Pada tahap berikutnya kita akan mengganti
     * bagian ini dengan aturan sebenarnya:
     *
     * 1. Lubang terakhir berisi → lanjut.
     * 2. Lubang kosong sendiri + lawan kosong
     *    → ANDHOK.
     * 3. Lubang kosong sendiri + lawan berisi
     *    → NEMBAK.
     * 4. Masuk lumbung sendiri
     *    → EXTRA TURN.
     * 5. Lubang kosong lawan
     *    → giliran berakhir.
     */

    pemainAktif =
        pemainAktif === 1
            ? 2
            : 1;


    renderPapan();


    document.getElementById(
        "boardInstructionText"
    ).textContent =
        "Giliran berpindah ke Pemain " +
        pemainAktif +
        ".";

}