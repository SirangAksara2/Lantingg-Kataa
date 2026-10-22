// =====================================
// LOGIN LANTING KATA
// =====================================

const loginButton = document.getElementById("loginButton");

loginButton.addEventListener("click", function () {

    // =================================
    // MENGAMBIL DATA DARI INPUT
    // =================================

    const nama = document
        .getElementById("nama")
        .value
        .trim();


    // =================================
    // VALIDASI NAMA
    // =================================

    if (nama === "") {

        alert("Uy! Nama kamu belum diisi 😊");

        document
            .getElementById("nama")
            .focus();

        return;
    }


    // =================================
    // SIMPAN DATA PENGGUNA
    // =================================

    localStorage.setItem(
        "lantingNama",
        nama
    );


    // =================================
    // MENUJU DASHBOARD
    // =================================

    window.location.href =
        "dashboard.html";

});