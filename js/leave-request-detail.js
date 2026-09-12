// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่านใบลาและความเห็นจริงจาก Firestore · เปลี่ยนสถานะ/ลบเขียนจริง
// จำกัดปุ่มตามบทบาทและเจ้าของใบลา (ดู ACL.md)
// (การส่งความเห็นใหม่ยังเก็บไว้แค่ในหน่วยความจำ — ยังไม่เขียนลง Firestore)
// ─────────────────────────────────────────────────────────────

(async function () {
  var ผู้ใช้ปัจจุบัน = await รอผู้ใช้ปัจจุบัน();
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");
  var ใบ, ความเห็น;

  try {
    var เอกสาร = await window.db.collection("leaveRequests").doc(รหัสใบลา).get();
    if (!เอกสาร.exists) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return;
    }
    ใบ = Object.assign({ id: เอกสาร.id }, เอกสาร.data());

    var ผลลัพธ์ความเห็น = await window.db.collection("leaveRequests").doc(รหัสใบลา).collection("approvals").get();
    ความเห็น = [];
    ผลลัพธ์ความเห็น.forEach(function (แถว) {
      ความเห็น.push(Object.assign({ id: แถว.id }, แถว.data()));
    });
  } catch (ผิดพลาด) {
    console.error("อ่านข้อมูลจาก Firestore ไม่สำเร็จ:", ผิดพลาด);
    showConfigWarning("อ่านข้อมูลจาก Firestore ไม่สำเร็จ (" + ผิดพลาด.message + ")");
    return;
  }

  var เป็นผู้อนุมัติหรือฝ่ายบุคคล = ผู้ใช้ปัจจุบัน.role === "manager" || ผู้ใช้ปัจจุบัน.role === "hr";
  var เป็นเจ้าของใบลา = ใบ.requesterId === ผู้ใช้ปัจจุบัน.uid;
  var ลบได้ = ผู้ใช้ปัจจุบัน.role === "employee" && เป็นเจ้าของใบลา;

  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

  // กล่องผู้ช่วย AI สรุปใบลา — ให้เห็นเฉพาะคนที่มีสิทธิ์อนุมัติ (คนที่ต้องอ่านสรุปก่อนกดอนุมัติ)
  var กล่องสรุปAI = document.getElementById("กล่องสรุปAI");
  if (เป็นผู้อนุมัติหรือฝ่ายบุคคล) {
    กล่องสรุปAI.classList.remove("hidden");
    วาดสรุปAI();
    document.getElementById("ปุ่มสรุปAI").addEventListener("click", สรุปด้วยAI);
  }

  // ตาม ACL.md — employee เขียนความเห็นได้เฉพาะใบของตัวเอง ส่วนผู้อนุมัติ/ฝ่ายบุคคลเขียนได้ทุกใบ
  if (!เป็นผู้อนุมัติหรือฝ่ายบุคคล && !เป็นเจ้าของใบลา) {
    document.getElementById("เขียนความเห็น").classList.add("hidden");
  }

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ/ไม่อนุมัติ เฉพาะผู้อนุมัติ/ฝ่ายบุคคล · ปุ่มลบ เฉพาะเจ้าของที่เป็น employee (ตาม ACL.md)
    if (ใบ.status === "รอพิจารณา" && เป็นผู้อนุมัติหรือฝ่ายบุคคล) {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        "</div>";
    } else if (ใบ.status === "รอพิจารณา" && ลบได้) {
      html +=
        '<p class="hint">รอหัวหน้าพิจารณา</p>' +
        '<div class="btn-row"><button type="button" class="btn-danger" id="ปุ่มลบใบลา">ลบใบลานี้</button></div>';
    } else if (ใบ.status === "รอพิจารณา") {
      html += '<p class="hint">รอหัวหน้าพิจารณา</p>';
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา" && เป็นผู้อนุมัติหรือฝ่ายบุคคล) {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
    }
    if (document.getElementById("ปุ่มลบใบลา")) {
      document.getElementById("ปุ่มลบใบลา").addEventListener("click", ลบใบลา);
    }
  }

  // ── ลบใบลา — เขียนจริงลง Firestore ต้องยืนยันก่อนทุกครั้ง (เฉพาะเจ้าของที่เป็น employee และยังรอพิจารณา) ──
  async function ลบใบลา() {
    if (!confirm('ยืนยันการลบใบลา "' + ใบ.title + '" หรือไม่ — ลบแล้วกู้คืนไม่ได้')) return;
    try {
      await window.db.collection("leaveRequests").doc(ใบ.id).delete();
      location.href = "leave-requests.html";
    } catch (ผิดพลาด) {
      console.error("ลบใบลาไม่สำเร็จ:", ผิดพลาด);
      alert("ลบไม่สำเร็จ (" + ผิดพลาด.message + ") — ลองใหม่อีกครั้ง");
    }
  }

  // ── เปลี่ยนสถานะ — เขียนจริงลง Firestore เฉพาะช่อง status ──
  async function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }

    document.getElementById("ปุ่มอนุมัติ").disabled = true;
    document.getElementById("ปุ่มไม่อนุมัติ").disabled = true;

    try {
      await window.db.collection("leaveRequests").doc(ใบ.id).update({ status: สถานะใหม่ });
      ใบ.status = สถานะใหม่;   // แก้เฉพาะช่อง status เท่านั้น
      วาดใบลา();
    } catch (ผิดพลาด) {
      console.error("เปลี่ยนสถานะไม่สำเร็จ:", ผิดพลาด);
      alert("เปลี่ยนสถานะไม่สำเร็จ (" + ผิดพลาด.message + ") — ลองใหม่อีกครั้ง");
      document.getElementById("ปุ่มอนุมัติ").disabled = false;
      document.getElementById("ปุ่มไม่อนุมัติ").disabled = false;
    }
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    ความเห็น.push({
      id: "ap-ใหม่-" + Date.now(),
      requestId: ใบ.id,
      authorId: ผู้ใช้ปัจจุบัน.uid, authorName: ผู้ใช้ปัจจุบัน.name,
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    });
    ช่อง.value = "";
    วาดความเห็น();
  }

  // ── แสดงสรุปล่าสุดจาก AI (ถ้ามี) ──
  function วาดสรุปAI() {
    var ที่วาง = document.getElementById("เนื้อหาสรุปAI");
    ที่วาง.innerHTML = ใบ.aiSuggestion
      ? '<p class="alert alert-ai">🤖 ' + esc(ใบ.aiSuggestion) + "</p>"
      : '<p class="hint">ยังไม่มีสรุปจาก AI</p>';
  }

  // ── ให้ AI อ่านใบลา + ความเห็นที่มีอยู่ แล้วสรุปสั้น ๆ ให้หัวหน้าอ่านก่อนกดอนุมัติ ──
  async function สรุปด้วยAI() {
    var ปุ่ม = document.getElementById("ปุ่มสรุปAI");
    var เตือน = document.getElementById("เตือนสรุปAI");
    เตือน.classList.add("hidden");

    // ขั้นที่ 1 — อ่านใบลาใบนี้ (รวมความเห็นที่มีอยู่แล้ว) มาประกอบเป็น context
    var บริบท = "หัวข้อ: " + ใบ.title + "\n" +
      "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
      "เหตุผล: " + ใบ.reason + "\n" +
      "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
      "ผู้ขอลา: " + ใบ.requesterName + "\n" +
      "ความเห็นที่มีอยู่แล้ว: " + (ความเห็น.length
        ? ความเห็น.map(function (c) { return c.authorName + ": " + c.message; }).join(" / ")
        : "ยังไม่มีความเห็น");

    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "AI กำลังสรุป...";

    var ตัวตัดเวลา = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวตัดเวลา.abort(); }, 15000);

    try {
      // ขั้นที่ 2 — เขียนสรุปสั้น ๆ
      var ผลลัพธ์ = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: ตัวตัดเวลา.signal,
        headers: {
          "Authorization": "Bearer " + window.OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: window.OPENROUTER_MODEL,
          messages: [{
            role: "user",
            content: "นี่คือใบขอลาในระบบ HR:\n" + บริบท + "\n\n" +
              "สรุปใบลานี้เป็นภาษาไทยสั้น ๆ ไม่เกิน 3 ประโยค ให้หัวหน้าอ่านก่อนตัดสินใจอนุมัติหรือไม่อนุมัติ " +
              "ตอบเฉพาะเนื้อสรุป ห้ามแนะนำว่าควรอนุมัติหรือไม่อนุมัติ"
          }]
        })
      });

      var ข้อมูล = await ผลลัพธ์.json();
      if (!ผลลัพธ์.ok) {
        throw new Error((ข้อมูล.error && ข้อมูล.error.message) || "เรียก API ไม่สำเร็จ");
      }
      var สรุป = ข้อมูล.choices[0].message.content.trim();

      // ขั้นที่ 3 — เขียนสรุปกลับลงฐาน: อัปเดตช่อง aiSuggestion + จดบันทึกใน aiLog
      await window.db.collection("leaveRequests").doc(ใบ.id).update({ aiSuggestion: สรุป });
      await window.db.collection("leaveRequests").doc(ใบ.id).collection("aiLog").add({
        input: บริบท,
        output: สรุป,
        createdAt: เวลาตอนนี้()
      });

      ใบ.aiSuggestion = สรุป;
      วาดสรุปAI();
    } catch (ผิดพลาด) {
      console.error("สรุปใบลาด้วย AI ไม่สำเร็จ:", ผิดพลาด);
      เตือน.textContent = ผิดพลาด.name === "AbortError"
        ? "⚠️ AI ตอบช้าเกิน 15 วินาที — ลองใหม่อีกครั้ง"
        : "⚠️ สรุปด้วย AI ไม่สำเร็จ — ลองใหม่อีกครั้ง";
      เตือน.classList.remove("hidden");
    } finally {
      clearTimeout(หมดเวลา);
      ปุ่ม.disabled = false;
      ปุ่ม.textContent = "ให้ AI ช่วยสรุปใบลาให้หัวหน้าอ่านก่อนกดอนุมัติ";
    }
  }
})();
