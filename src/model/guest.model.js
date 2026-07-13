// models/guestModel.js
const db = require("../config/db"); // your existing callback-style mysql/mysql2 connection or pool

// Columns the app actually reads/writes (matches the clean `hotel_guests` schema)
const COLUMNS = [
  "full_name",
  "gender",
  "phone_number",
  "email",
  "nationality",
  "number_passport",
  "date_of_birth",
  "address",
  "check_in",
  "check_out",
  "room_number",
  "room_type",
  "rent_type",
  "rent_months",
  "rent_price_per_month",
  "rent_check_in",
  "rent_check_out",
  "water_fee",
  "water_meter_old",
  "water_meter_new",
  "water_unit_price",
  "electricity_cost",
  "elec_meter_old",
  "elec_meter_new",
  "elec_unit_price",
  "extra_fee",
  "invoice_month",
  "invoice_date",
  "monthly_total",
  "payment_amount",
  "payment_method",
  "payment_status",
  "note",
  "status",
];

// ─── Promise wrapper around the callback-style db.query ────
// Your `db` module (see location.routes.js) uses:
//   db.query(sql, params, (err, rows) => { ... })
// This wraps that in a Promise so the model can use async/await
// without changing the shape of your existing db.js.
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

const GuestModel = {
  // ─── READ ──────────────────────────────────────────
  async getAll() {
    const rows = await query(
      "SELECT * FROM hotel_guests ORDER BY created_at DESC",
    );
    return rows;
  },

  async getById(id) {
    const rows = await query("SELECT * FROM hotel_guests WHERE id = ?", [id]);
    return rows[0] || null;
  },

  // ─── CREATE ────────────────────────────────────────
  async create(data) {
    const values = COLUMNS.map((col) =>
      data[col] === undefined ? null : data[col],
    );
    const placeholders = COLUMNS.map(() => "?").join(", ");
    const result = await query(
      `INSERT INTO hotel_guests (${COLUMNS.join(", ")}) VALUES (${placeholders})`,
      values,
    );
    return this.getById(result.insertId);
  },

  // ─── UPDATE ────────────────────────────────────────
  async update(id, data) {
    const setClause = COLUMNS.map((col) => `${col} = ?`).join(", ");
    const values = COLUMNS.map((col) =>
      data[col] === undefined ? null : data[col],
    );
    values.push(id);

    const result = await query(
      `UPDATE hotel_guests SET ${setClause} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) return null;
    return this.getById(id);
  },

  // ─── DELETE ────────────────────────────────────────
  async remove(id) {
    const result = await query("DELETE FROM hotel_guests WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  // ─── Helpers used by KPIs / dashboards (optional) ──
  async countByStatus(status) {
    const rows = await query(
      "SELECT COUNT(*) AS total FROM hotel_guests WHERE status = ?",
      [status],
    );
    return rows[0].total;
  },

  async countByRentType(rentType) {
    const rows = await query(
      "SELECT COUNT(*) AS total FROM hotel_guests WHERE rent_type = ?",
      [rentType],
    );
    return rows[0].total;
  },

  // ─── Stats for GET /api/guests/stats ───────────────
  async getStats() {
    const [totalRow] = await query(
      "SELECT COUNT(*) AS total FROM hotel_guests",
    );
    const [activeRow] = await query(
      `SELECT COUNT(*) AS total FROM hotel_guests WHERE status = 'active'`,
    );
    const [stayingRow] = await query(
      `SELECT COUNT(*) AS total FROM hotel_guests WHERE check_in IS NOT NULL AND check_out IS NULL`,
    );
    const [monthlyRow] = await query(
      `SELECT COUNT(*) AS total FROM hotel_guests WHERE rent_type = 'monthly'`,
    );
    const [revenueRow] = await query(
      `SELECT COALESCE(SUM(payment_amount), 0) AS total FROM hotel_guests`,
    );

    return {
      total: totalRow.total,
      active: activeRow.total,
      staying: stayingRow.total,
      monthly: monthlyRow.total,
      revenue: Number(revenueRow.total),
    };
  },

  // ─── Search for GET /api/guests/search?q=... ───────
  async search(q) {
    const like = `%${q}%`;
    const rows = await query(
      `SELECT * FROM hotel_guests
       WHERE full_name LIKE ? OR phone_number LIKE ? OR nationality LIKE ? OR email LIKE ?
       ORDER BY created_at DESC`,
      [like, like, like, like],
    );
    return rows;
  },
};

module.exports = GuestModel;
