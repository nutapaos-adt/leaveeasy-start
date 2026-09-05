// ─────────────────────────────────────────────────────────────
// js/auth.js — ตรวจสถานะล็อกอิน ใช้ร่วมกันทุกหน้า ยกเว้น login.html และ signup.html
// โหลดต่อจาก firebase-config.js เสมอ — บังคับว่าไม่ล็อกอินแล้วเปิดหน้านี้ไม่ได้
// ─────────────────────────────────────────────────────────────

var รอผู้ใช้ปัจจุบันPromise = new Promise(function (resolve) {
  firebase.auth().onAuthStateChanged(async function (ผู้ใช้) {
    if (!ผู้ใช้) {
      var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";
      location.href = "login.html?next=" + encodeURIComponent(หน้าปัจจุบัน);
      return;
    }

    var โปรไฟล์ = {};
    try {
      var เอกสาร = await window.db.collection("users").doc(ผู้ใช้.uid).get();
      if (เอกสาร.exists) โปรไฟล์ = เอกสาร.data();
    } catch (ผิดพลาด) {
      console.error("อ่านโปรไฟล์ผู้ใช้ไม่สำเร็จ:", ผิดพลาด);
    }

    window.ผู้ใช้ปัจจุบัน = {
      uid: ผู้ใช้.uid,
      email: ผู้ใช้.email,
      name: โปรไฟล์.name || ผู้ใช้.email,
      role: โปรไฟล์.role || "employee"
    };

    แสดงผู้ใช้ในเมนู(window.ผู้ใช้ปัจจุบัน);
    ซ่อนเมนูตามสิทธิ์(window.ผู้ใช้ปัจจุบัน.role);
    resolve(window.ผู้ใช้ปัจจุบัน);
  });
});

// สคริปต์เฉพาะหน้าที่ต้องรู้ว่าใครล็อกอินอยู่ ให้ await ฟังก์ชันนี้ก่อนใช้ window.ผู้ใช้ปัจจุบัน
function รอผู้ใช้ปัจจุบัน() {
  return รอผู้ใช้ปัจจุบันPromise;
}

// เติมชื่อผู้ใช้ + ปุ่มออกจากระบบ ลงในช่อง #navUser ที่ js/nav.js สร้างไว้แล้ว
function แสดงผู้ใช้ในเมนู(ผู้ใช้) {
  var ที่วาง = document.getElementById("navUser");
  if (!ที่วาง) return;

  ที่วาง.innerHTML =
    "<span>" + esc(ผู้ใช้.name) + "</span>" +
    '<button type="button" class="btn-ghost" id="ปุ่มออกจากระบบ">ออกจากระบบ</button>';

  document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", function () {
    firebase.auth().signOut().then(function () { location.href = "login.html"; });
  });
}

// ซ่อนเมนูที่บทบาทนี้ไม่มีสิทธิ์ใช้ — ตาม ACL.md (จัดการประเภทการลาได้เฉพาะ hr)
function ซ่อนเมนูตามสิทธิ์(role) {
  if (role === "hr") return;
  var ลิงก์ = document.querySelector('#nav a[href="leave-types.html"]');
  if (ลิงก์) ลิงก์.remove();
}
