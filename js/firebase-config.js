// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — เชื่อมต่อ Firebase / Firestore
// ตั้งค่าเดียว ใช้ร่วมกันทุกหน้าที่ต้องอ่าน/เขียน Firestore
//
// ใช้ Firebase SDK แบบ "compat" (สคริปต์ธรรมดา ไม่ใช่ ES module)
// เพราะโปรเจกต์นี้ไม่มีขั้นตอน build — ให้ดับเบิลคลิกเปิดไฟล์ได้ตามปกติ
// (ต้องโหลดไฟล์นี้ต่อจาก firebase-app-compat.js และ firebase-firestore-compat.js เท่านั้น)
//
// ⚠️ apiKey ของ Firebase Web App ไม่ใช่ความลับ — ออกแบบมาให้อยู่ใน
// โค้ดฝั่ง client ได้ สิ่งที่ป้องกันข้อมูลจริงคือ Firestore Security Rules
// ─────────────────────────────────────────────────────────────

var firebaseConfig = {
  apiKey: "AIzaSyBf6gpOt7708d-puVYdp_hPesWPr-dyqbU",
  authDomain: "leaveeasy-nutapao.firebaseapp.com",
  projectId: "leaveeasy-nutapao",
  storageBucket: "leaveeasy-nutapao.firebasestorage.app",
  messagingSenderId: "370380335390",
  appId: "1:370380335390:web:373a2e6e73f87fe97a010f",
  measurementId: "G-JWN9CSY8Z5"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
