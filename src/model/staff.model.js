// src/model/staff.model.js
const db = require("../config/db");

const Staff = {
  getAll: (callback) => {
    const sql = `
      SELECT s.*, cb.username AS created_by_name
      FROM staff s
      LEFT JOIN users cb ON cb.id = s.created_by
      ORDER BY s.staff_name ASC
    `;
    db.query(sql, callback);
  },

  getById: (id, callback) => {
    const sql = `
      SELECT s.*, cb.username AS created_by_name
      FROM staff s
      LEFT JOIN users cb ON cb.id = s.created_by
      WHERE s.id = ?
    `;
    db.query(sql, [id], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || null);
    });
  },

  create: (data, callback) => {
    const d = { ...data, created_at: new Date() };
    db.query("INSERT INTO staff SET ?", d, callback);
  },

  update: (id, data, callback) => {
    db.query("UPDATE staff SET ? WHERE id = ?", [data, id], callback);
  },

  // Real delete — actually removes the row from MySQL, not a status flag.
  // (Unlike Rooms, this does NOT assume a delete_at/delete_by soft-delete
  // column exists on your staff table — since I haven't seen your real
  // schema, adding a filter on a column that might not exist would just
  // throw "Unknown column" and break everything. If you DO have those
  // columns and want soft-delete instead, tell me and I'll switch this.)
  delete: (id, callback) => {
    db.query("DELETE FROM staff WHERE id = ?", [id], callback);
  },

  stats: (callback) => {
    db.query(
      `
      SELECT
        COUNT(*)                  AS total,
        SUM(status='active')      AS active,
        SUM(status='inactive')    AS inactive,
        SUM(work_shift='full_time') AS full_time
      FROM staff
    `,
      (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
      },
    );
  },
};

module.exports = Staff;
