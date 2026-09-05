// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 6 (ต้นสัปดาห์): อ่านจากข้อมูลปลอม และเปลี่ยนสถานะในหน่วยความจำ
// ─────────────────────────────────────────────────────────────

(async function () {
  var ผู้ใช้ปัจจุบัน = await รอผู้ใช้ปัจจุบัน();
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");

  // หาใบลาจากข้อมูลปลอม บวกกับใบที่เพิ่งยื่นในหน้าที่ 2
  var ใบลาที่ยื่นใหม่ = JSON.parse(sessionStorage.getItem("ใบลาที่ยื่นใหม่") || "[]");
  var ใบ = window.LEAVE_DATA.leaveRequests.concat(ใบลาที่ยื่นใหม่)
    .find(function (x) { return x.id === รหัสใบลา; });

  if (!ใบ) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  var ความเห็น = window.LEAVE_DATA.approvals.filter(function (c) { return c.requestId === ใบ.id; });

  var เป็นผู้อนุมัติหรือฝ่ายบุคคล = ผู้ใช้ปัจจุบัน.role === "manager" || ผู้ใช้ปัจจุบัน.role === "hr";
  var เป็นเจ้าของใบลา = ใบ.requesterId === ผู้ใช้ปัจจุบัน.uid;
  var ลบได้ = ผู้ใช้ปัจจุบัน.role === "employee" && เป็นเจ้าของใบลา;

  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

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

    // ปุ่มอนุมัติ / ไม่อนุมัติ ขึ้นเฉพาะใบที่ยังรอพิจารณา และเฉพาะผู้อนุมัติ/ฝ่ายบุคคล (ตาม ACL.md)
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

  // ── เปลี่ยนสถานะ (สัปดาห์นี้เปลี่ยนแค่ในหน่วยความจำ) ──
  function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }
    ใบ.status = สถานะใหม่;   // แก้เฉพาะช่อง status เท่านั้น
    วาดใบลา();
  }

  // ── ลบใบลา (เฉพาะเจ้าของที่เป็น employee และยังรอพิจารณา) ──
  function ลบใบลา() {
    if (!confirm('ยืนยันการลบใบลา "' + ใบ.title + '" หรือไม่ — ลบแล้วกู้คืนไม่ได้')) return;
    var รายการที่ยื่นใหม่ = JSON.parse(sessionStorage.getItem("ใบลาที่ยื่นใหม่") || "[]");
    sessionStorage.setItem("ใบลาที่ยื่นใหม่",
      JSON.stringify(รายการที่ยื่นใหม่.filter(function (x) { return x.id !== ใบ.id; })));
    location.href = "leave-requests.html";
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
})();
