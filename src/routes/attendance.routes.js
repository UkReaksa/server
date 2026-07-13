// src/routes/attendance.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/attendance.controller");
const auth = require("../middlewares/auth.middleware");
const db = require("../config/db");

router.use(auth.verifyToken);

// ── Old routes (keep as is) ────────────────────────────
router.get("/", ctrl.getAll);
router.get("/today", ctrl.getToday);
router.get("/today-summary", ctrl.getTodaySummary);
router.get("/shifts", ctrl.getShifts);
router.get("/monthly-report", ctrl.monthlyReport);
router.post("/check-in", ctrl.checkIn);
router.post("/check-out", ctrl.checkOut);
router.post("/manual", ctrl.manualRecord);
router.post("/shifts/update", ctrl.updateShifts);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

// ── New daily attendance routes (checkbox system) ──────

// GET /api/attendance/daily?date=2026-05-25
router.get("/daily", (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  db.query(
    `SELECT ad.*, s.staff_name, s.position, s.work_shift
     FROM attendance_daily ad
     JOIN staff s ON s.id = ad.staff_id
     WHERE ad.date = ?
     ORDER BY s.staff_name`,
    [date],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    },
  );
});

// GET /api/attendance/daily/report?from=&to=
router.get("/daily/report", (req, res) => {
  const { from, to } = req.query;
  if (!from || !to)
    return res.status(400).json({ message: "from and to required" });
  db.query(
    `SELECT ad.*, s.staff_name, s.position, s.work_shift
     FROM attendance_daily ad
     JOIN staff s ON s.id = ad.staff_id
     WHERE ad.date BETWEEN ? AND ?
     ORDER BY ad.date ASC, s.staff_name`,
    [from, to],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    },
  );
});

// POST /api/attendance/daily — save full day (upsert)
//
// FIX: this used to only write staff_id/date/status/note — check_in_time
// and check_out_time were never in the INSERT column list, VALUES, or the
// ON DUPLICATE KEY UPDATE clause, so they were silently dropped on every
// save even though the frontend sent them correctly. That's why times
// disappeared after every refresh. Both are now included end to end.
router.post("/daily", (req, res) => {
  const { date, records } = req.body;
  if (!date || !records?.length)
    return res.status(400).json({ message: "date and records required" });

  const tasks = records.map(
    (r) =>
      new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO attendance_daily
             (staff_id, date, status, check_in_time, check_out_time, note, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             status         = VALUES(status),
             check_in_time  = VALUES(check_in_time),
             check_out_time = VALUES(check_out_time),
             note           = VALUES(note),
             updated_at     = NOW()`,
          [
            r.staff_id,
            date,
            r.status,
            r.check_in_time || null,
            r.check_out_time || null,
            r.note || null,
            req.user?.id || null,
          ],
          (err) => (err ? reject(err) : resolve()),
        );
      }),
  );

  Promise.all(tasks)
    .then(() => res.json({ message: "Saved successfully" }))
    .catch((err) => res.status(500).json({ message: err.message }));
});

module.exports = router;
