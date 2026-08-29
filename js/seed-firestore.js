// ─────────────────────────────────────────────────────────────
// js/seed-firestore.js — ใส่ข้อมูลตัวอย่าง (seed) ลง Firestore ครั้งเดียว
// ใช้ข้อมูลชุดเดียวกับ window.LEAVE_DATA (js/data.js)
// ─────────────────────────────────────────────────────────────

var ปุ่ม = document.getElementById("ปุ่มเริ่ม");
var สถานะ = document.getElementById("สถานะ");

ปุ่ม.addEventListener("click", เริ่มใส่ข้อมูล);

function บันทึก(ข้อความ) {
  สถานะ.textContent += ข้อความ + "\n";
}

async function เริ่มใส่ข้อมูล() {
  ปุ่ม.disabled = true;
  สถานะ.textContent = "";
  var db = window.db;

  try {
    บันทึก("กำลังใส่ users…");
    for (var u of window.LEAVE_DATA.users) {
      await db.collection("users").doc(u.id).set({ name: u.name, email: u.email, role: u.role });
      บันทึก("  ✓ users/" + u.id);
    }

    บันทึก("กำลังใส่ leaveTypes…");
    for (var t of window.LEAVE_DATA.leaveTypes) {
      await db.collection("leaveTypes").doc(t.id).set({ name: t.name });
      บันทึก("  ✓ leaveTypes/" + t.id);
    }

    บันทึก("กำลังใส่ leaveRequests…");
    for (var r of window.LEAVE_DATA.leaveRequests) {
      await db.collection("leaveRequests").doc(r.id).set({
        title: r.title, reason: r.reason, status: r.status,
        requesterId: r.requesterId, requesterName: r.requesterName,
        approverId: r.approverId, approverName: r.approverName,
        leaveTypeId: r.leaveTypeId, leaveTypeName: r.leaveTypeName,
        startDate: r.startDate, endDate: r.endDate, createdAt: r.createdAt
      });
      บันทึก("  ✓ leaveRequests/" + r.id);
    }

    บันทึก("กำลังใส่ approvals (โฟลเดอร์ย่อยของแต่ละใบลา)…");
    for (var a of window.LEAVE_DATA.approvals) {
      await db.collection("leaveRequests").doc(a.requestId).collection("approvals").doc(a.id).set({
        authorId: a.authorId, authorName: a.authorName,
        message: a.message, createdAt: a.createdAt
      });
      บันทึก("  ✓ leaveRequests/" + a.requestId + "/approvals/" + a.id);
    }

    บันทึก("\n✅ ใส่ข้อมูลตัวอย่างครบแล้ว — ไปเปิด leave-requests.html ดูได้เลย");
  } catch (ผิดพลาด) {
    บันทึก("\n❌ ผิดพลาด: " + ผิดพลาด.message);
    console.error(ผิดพลาด);
  } finally {
    ปุ่ม.disabled = false;
  }
}
