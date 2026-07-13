// src/models/user.model.js
const db = require("../config/db");

const User = {
  // ── Get all users (with role name + created by) ────────
  getAll: (callback) => {
    const sql = `
      SELECT
        u.id,
        u.username,
        u.gmail,
        u.role_id,
        u.status,
        u.is_admin,
        u.is_staff,
        u.is_active,
        u.created_by,
        u.created_at,
        u.avatar,
        r.name       AS role_name,
        cb.username  AS created_by_name
      FROM users u
      LEFT JOIN roles r   ON r.id  = u.role_id
      LEFT JOIN users cb  ON cb.id = u.created_by
      ORDER BY u.id DESC
    `;
    db.query(sql, callback);
  },

  // ── Get user by ID ─────────────────────────────────────
  getById: (id, callback) => {
    const sql = "SELECT * FROM users WHERE id = ?";
    db.query(sql, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  // ── Get user by email ──────────────────────────────────
  getByEmail: (gmail, callback) => {
    const sql = "SELECT * FROM users WHERE gmail = ?";
    db.query(sql, [gmail], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  // ── Create user ────────────────────────────────────────
  create: (userData, callback) => {
    const sql = "INSERT INTO users SET ?";
    db.query(sql, userData, (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  },

  // ── Update user ────────────────────────────────────────
  update: (id, userData, callback) => {
    const sql = "UPDATE users SET ? WHERE id = ?";
    db.query(sql, [userData, id], (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  },

  // ── Delete user ────────────────────────────────────────
  delete: (id, callback) => {
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [id], (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  },
};

module.exports = User;
