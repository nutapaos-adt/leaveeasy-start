// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก
// สมัครสำเร็จแล้วสร้างไฟล์ใหม่ในโฟลเดอร์ users พร้อมช่อง role เริ่มต้นเป็น employee
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่ม = document.getElementById("ปุ่มสมัคร");
  var กำลังสมัคร = false;

  // ล็อกอินอยู่แล้ว ไม่ต้องมาหน้านี้อีก
  // (เว้นไว้ระหว่างกำลังสมัคร เพราะสมัครสำเร็จจะทำให้ล็อกอินทันที
  //  ถ้าเด้งไปเลยจะเด้งไปก่อนที่จะเขียนโปรไฟล์ผู้ใช้ลง Firestore เสร็จ)
  firebase.auth().onAuthStateChanged(function (ผู้ใช้) {
    if (ผู้ใช้ && !กำลังสมัคร) location.href = "leave-requests.html";
  });

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();
    กล่องเตือน.classList.add("hidden");
    ปุ่ม.disabled = true;
    กำลังสมัคร = true;

    var ชื่อ = document.getElementById("name").value.trim();
    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;

    firebase.auth().createUserWithEmailAndPassword(อีเมล, รหัสผ่าน)
      .then(function (ผลลัพธ์) {
        var ผู้ใช้ = ผลลัพธ์.user;
        return ผู้ใช้.updateProfile({ displayName: ชื่อ })
          .then(function () {
            return window.db.collection("users").doc(ผู้ใช้.uid).set({
              name: ชื่อ,
              email: อีเมล,
              role: "employee"
            });
          });
      })
      .then(function () {
        location.href = "leave-requests.html";
      })
      .catch(function (ผิดพลาด) {
        กำลังสมัคร = false;
        กล่องเตือน.textContent = "⚠️ " + แปลข้อผิดพลาดล็อกอิน(ผิดพลาด.code);
        กล่องเตือน.classList.remove("hidden");
        ปุ่ม.disabled = false;
      });
  });
})();
