// ─────────────────────────────────────────────────────────────
// js/test-ai.js — หน้าทดสอบชั่วคราว: กดปุ่มแล้วส่ง "สวัสดี" ไปหา OpenRouter
// แล้วเอาคำตอบมาแสดงบนหน้า
// ─────────────────────────────────────────────────────────────

(function () {
  var ปุ่ม = document.getElementById("ปุ่มทดสอบ");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var กล่องคำตอบ = document.getElementById("กล่องคำตอบ");

  ปุ่ม.addEventListener("click", async function () {
    ซ่อน(กล่องเตือน);
    ซ่อน(กล่องคำตอบ);
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลังส่ง...";

    try {
      var ผลลัพธ์ = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + window.OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: window.OPENROUTER_MODEL,
          messages: [{ role: "user", content: "สวัสดี" }]
        })
      });

      var ข้อมูล = await ผลลัพธ์.json();

      if (!ผลลัพธ์.ok) {
        throw new Error((ข้อมูล.error && ข้อมูล.error.message) || "เรียก API ไม่สำเร็จ");
      }

      var คำตอบ = ข้อมูล.choices[0].message.content;
      กล่องคำตอบ.textContent = คำตอบ;
      แสดง(กล่องคำตอบ);
    } catch (ผิดพลาด) {
      console.error("เรียก OpenRouter ไม่สำเร็จ:", ผิดพลาด);
      กล่องเตือน.textContent = "⚠️ เรียก AI ไม่สำเร็จ — " + ผิดพลาด.message;
      แสดง(กล่องเตือน);
    } finally {
      ปุ่ม.disabled = false;
      ปุ่ม.textContent = "ส่งข้อความทดสอบ \"สวัสดี\"";
    }
  });

  function แสดง(องค์ประกอบ) {
    องค์ประกอบ.classList.remove("hidden");
  }
  function ซ่อน(องค์ประกอบ) {
    องค์ประกอบ.classList.add("hidden");
  }
})();
