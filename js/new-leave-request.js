// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกใบลาใหม่ลงโฟลเดอร์ leaveRequests บน Firestore จริง
// ─────────────────────────────────────────────────────────────

(async function () {
  var ผู้ใช้ปัจจุบัน = await รอผู้ใช้ปัจจุบัน();

  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ช่องเหตุผล = document.getElementById("reason");
  var ปุ่มให้AI = document.getElementById("ปุ่มให้AIจัดประเภท");
  var ป้ายAI = document.getElementById("ป้ายAI");
  var เตือนAI = document.getElementById("ข้อความเตือนAI");

  // เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่
  window.LEAVE_DATA.leaveTypes.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  ปุ่มให้AI.addEventListener("click", จัดประเภทด้วยAI);

  ฟอร์ม.addEventListener("submit", async function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = window.LEAVE_DATA.leaveTypes.find(function (t) { return t.id === ค่า.leaveTypeId; });

    var ใบใหม่ = {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: ผู้ใช้ปัจจุบัน.uid, requesterName: ผู้ใช้ปัจจุบัน.name,
      approverId: "",      approverName: "",
      leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    };

    try {
      await window.db.collection("leaveRequests").add(ใบใหม่);
      location.href = "leave-requests.html";
    } catch (ผิดพลาด) {
      console.error("บันทึกใบลาลง Firestore ไม่สำเร็จ:", ผิดพลาด);
      เตือน("บันทึกไม่สำเร็จ (" + ผิดพลาด.message + ") — ลองใหม่อีกครั้ง");
    }
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  // ปุ่ม "ให้ AI ช่วยจัดประเภทการลา" — อ่านช่องเหตุผล ส่งไปพร้อมชื่อประเภทที่มีอยู่จริง แล้วให้ AI เลือกให้
  async function จัดประเภทด้วยAI() {
    ป้ายAI.classList.add("hidden");
    เตือนAI.classList.add("hidden");

    var เหตุผล = ช่องเหตุผล.value.trim();
    if (!เหตุผล) {
      เตือนAI.textContent = "⚠️ พิมพ์เหตุผลการลาก่อน จึงจะให้ AI ช่วยจัดประเภทได้";
      เตือนAI.classList.remove("hidden");
      return;
    }

    var ชื่อประเภททั้งหมด = window.LEAVE_DATA.leaveTypes.map(function (t) { return t.name; });

    ปุ่มให้AI.disabled = true;
    ปุ่มให้AI.textContent = "AI กำลังคิด...";

    var ตัวตัดเวลา = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวตัดเวลา.abort(); }, 15000);

    try {
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
            content: "เหตุผลการลานี้: \"" + เหตุผล + "\"\n" +
              "ประเภทการลาที่มีอยู่จริงในระบบมีเท่านี้: " + ชื่อประเภททั้งหมด.join(", ") + "\n" +
              "ตอบกลับมาเป็นชื่อประเภทที่ตรงที่สุดเพียงชื่อเดียว คัดลอกให้ตรงตัวจากรายการด้านบนเป๊ะ ๆ ห้ามมีคำอื่นปนหรืออธิบายเพิ่ม"
          }]
        })
      });

      var ข้อมูล = await ผลลัพธ์.json();
      if (!ผลลัพธ์.ok) {
        throw new Error((ข้อมูล.error && ข้อมูล.error.message) || "เรียก API ไม่สำเร็จ");
      }

      var ชื่อที่AIเลือก = ข้อมูล.choices[0].message.content.trim();
      var ประเภทที่ตรง = window.LEAVE_DATA.leaveTypes.find(function (t) { return t.name === ชื่อที่AIเลือก; });

      if (!ประเภทที่ตรง) {
        เตือนAI.textContent = "⚠️ AI จัดประเภทให้ไม่ได้ — ลองเลือกเองจากรายการ";
        เตือนAI.classList.remove("hidden");
        return;
      }

      ช่องประเภท.value = ประเภทที่ตรง.id;
      ป้ายAI.classList.remove("hidden");
    } catch (ผิดพลาด) {
      console.error("เรียก AI จัดประเภทการลาไม่สำเร็จ:", ผิดพลาด);
      เตือนAI.textContent = ผิดพลาด.name === "AbortError"
        ? "⚠️ AI ตอบช้าเกิน 15 วินาที — ลองเลือกเอง"
        : "⚠️ เรียก AI ไม่สำเร็จ — ลองเลือกเอง";
      เตือนAI.classList.remove("hidden");
    } finally {
      clearTimeout(หมดเวลา);
      ปุ่มให้AI.disabled = false;
      ปุ่มให้AI.textContent = "ให้ AI ช่วยจัดประเภทการลา";
    }
  }
})();
