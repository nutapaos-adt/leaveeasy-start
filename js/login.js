// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มล็อกอิน");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่ม = document.getElementById("ปุ่มเข้าสู่ระบบ");

  // ล็อกอินอยู่แล้ว ไม่ต้องมาหน้านี้อีก
  firebase.auth().onAuthStateChanged(function (ผู้ใช้) {
    if (ผู้ใช้) location.href = new URLSearchParams(location.search).get("next") || "leave-requests.html";
  });

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();
    กล่องเตือน.classList.add("hidden");
    ปุ่ม.disabled = true;

    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;

    firebase.auth().signInWithEmailAndPassword(อีเมล, รหัสผ่าน)
      .then(function () {
        location.href = new URLSearchParams(location.search).get("next") || "leave-requests.html";
      })
      .catch(function (ผิดพลาด) {
        กล่องเตือน.textContent = "⚠️ " + แปลข้อผิดพลาดล็อกอิน(ผิดพลาด.code);
        กล่องเตือน.classList.remove("hidden");
        ปุ่ม.disabled = false;
      });
  });
})();
