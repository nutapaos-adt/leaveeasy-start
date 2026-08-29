// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — เชื่อมต่อ Firebase / Firestore
// ตั้งค่าเดียว ใช้ร่วมกันทุกหน้าที่ต้องอ่าน/เขียน Firestore
//
// ⚠️ apiKey ของ Firebase Web App ไม่ใช่ความลับ — ออกแบบมาให้อยู่ใน
// โค้ดฝั่ง client ได้ สิ่งที่ป้องกันข้อมูลจริงคือ Firestore Security Rules
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBf6gpOt7708d-puVYdp_hPesWPr-dyqbU",
  authDomain: "leaveeasy-nutapao.firebaseapp.com",
  projectId: "leaveeasy-nutapao",
  storageBucket: "leaveeasy-nutapao.firebasestorage.app",
  messagingSenderId: "370380335390",
  appId: "1:370380335390:web:373a2e6e73f87fe97a010f",
  measurementId: "G-JWN9CSY8Z5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// เก็บไว้บน window ให้ไฟล์ script ธรรมดา (ไม่ใช่ module) เรียกใช้ต่อได้
window.db = db;
window.firestoreCollection = collection;
window.firestoreGetDocs = getDocs;
