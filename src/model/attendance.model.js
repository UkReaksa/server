// src/model/attendance.model.js
// NOTE: No changes needed here. The /attendance/daily routes talk
// directly to the `attendance_daily` table via db.query() inside
// attendance.routes.js — they do NOT use this model. This file only
// powers the older event-based check-in/check-out button flow
// (the `attendance` table with a `type` column), which is untouched.
const db = require("../config/db");

const Attendance = {
  getAll: (filters, callback) => {
    let sql = `
      SELECT a.*,
        s.staff_name, s.position, s.work_shift,
        cb.username AS created_by_name
      FROM attendance a
      LEFT JOIN staff s  ON s.id = a.staff_id
      LEFT JOIN users cb ON cb.id = a.created_by
      WHERE a.delete_at IS NULL
    `;
    const params = [];
    if (filters.date) {
      sql += " AND a.date = ?";
      params.push(filters.date);
    }
    if (filters.staff_id) {
      sql += " AND a.staff_id = ?";
      params.push(filters.staff_id);
    }
    if (filters.type) {
      sql += " AND a.type = ?";
      params.push(filters.type);
    }
    if (filters.status) {
      sql += " AND a.status = ?";
      params.push(filters.status);
    }
    if (filters.from) {
      sql += " AND a.date >= ?";
      params.push(filters.from);
    }
    if (filters.to) {
      sql += " AND a.date <= ?";
      params.push(filters.to);
    }
    sql += " ORDER BY a.scan_time DESC";
    db.query(sql, params, callback);
  },

  getToday: (callback) => {
    db.query(
      `
      SELECT a.*,
        s.staff_name, s.position, s.work_shift, s.card_id
      FROM attendance a
      LEFT JOIN staff s ON s.id = a.staff_id
      WHERE a.date = CURDATE() AND a.delete_at IS NULL
      ORDER BY a.scan_time DESC
    `,
      callback,
    );
  },

  getTodaySummary: (callback) => {
    db.query(
      `
      SELECT
        s.id, s.staff_name, s.position, s.work_shift,
        MAX(CASE WHEN a.type='check_in'  THEN a.scan_time END) AS check_in_time,
        MAX(CASE WHEN a.type='check_out' THEN a.scan_time END) AS check_out_time,
        MAX(CASE WHEN a.type='check_in'  THEN a.status    END) AS check_in_status
      FROM staff s
      LEFT JOIN attendance a ON a.staff_id = s.id AND a.date = CURDATE() AND a.delete_at IS NULL
      WHERE s.delete_at IS NULL AND s.status = 'active'
      GROUP BY s.id, s.staff_name, s.position, s.work_shift
      ORDER BY s.staff_name
    `,
      callback,
    );
  },

  getByStaff: (staffId, callback) => {
    db.query(
      `
      SELECT * FROM attendance
      WHERE staff_id = ? AND delete_at IS NULL
      ORDER BY date DESC, scan_time DESC
    `,
      [staffId],
      callback,
    );
  },

  // Get work shifts config
  getShifts: (callback) => {
    db.query("SELECT * FROM work_shifts ORDER BY check_in_time", callback);
  },

  // Determine status based on shift time
  checkStatus: (staffId, type, scanTime, callback) => {
    db.query(
      `
      SELECT ws.* FROM work_shifts ws
      JOIN staff s ON s.work_shift = ws.name
      WHERE s.id = ?
    `,
      [staffId],
      (err, shifts) => {
        if (err) return callback(err, "on_time");
        const shift = shifts[0];
        if (!shift) return callback(null, "on_time");

        const scan = new Date(scanTime);
        const scanMin = scan.getHours() * 60 + scan.getMinutes();

        if (type === "check_in") {
          const [h, m] = shift.check_in_time.split(":").map(Number);
          const shiftMin = h * 60 + m;
          const status =
            scanMin > shiftMin + (shift.late_after || 15) ? "late" : "on_time";
          callback(null, status);
        } else {
          const [h, m] = shift.check_out_time.split(":").map(Number);
          const shiftMin = h * 60 + m;
          const status =
            scanMin < shiftMin - (shift.early_leave_before || 30)
              ? "early_leave"
              : "on_time";
          callback(null, status);
        }
      },
    );
  },

  create: (data, callback) => {
    db.query(
      "INSERT INTO attendance SET ?",
      { ...data, created_at: new Date() },
      callback,
    );
  },

  update: (id, data, callback) => {
    db.query(
      "UPDATE attendance SET ?, update_at = NOW() WHERE id = ?",
      [data, id],
      callback,
    );
  },

  delete: (id, deletedBy, callback) => {
    db.query(
      "UPDATE attendance SET delete_at = NOW(), delete_by = ? WHERE id = ?",
      [deletedBy, id],
      callback,
    );
  },

  // Monthly report
  monthlyReport: (year, month, callback) => {
    db.query(
      `
      SELECT
        s.id AS staff_id, s.staff_name, s.position, s.work_shift,
        s.employment_type, s.part_time_hours, s.salary, s.status,
        COUNT(DISTINCT CASE WHEN a.type='check_in' THEN a.date END) AS days_present,
        SUM(CASE WHEN a.status='late' AND a.type='check_in' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN a.status='early_leave' THEN 1 ELSE 0 END)               AS early_leave_count,
        MIN(CASE WHEN a.type='check_in'  THEN a.scan_time END) AS first_checkin,
        MAX(CASE WHEN a.type='check_out' THEN a.scan_time END) AS last_checkout
      FROM staff s
      LEFT JOIN attendance a ON a.staff_id = s.id
        AND YEAR(a.date) = ? AND MONTH(a.date) = ?
        AND a.delete_at IS NULL
      WHERE s.delete_at IS NULL AND s.status='active'
      GROUP BY s.id, s.staff_name, s.position, s.work_shift
      ORDER BY s.staff_name
    `,
      [year, month],
      callback,
    );
  },
};

module.exports = Attendance;
