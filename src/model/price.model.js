// models/price.model.js
const db = require("../config/db");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

const PriceModel = {
  async getAll() {
    return query("SELECT * FROM price_presets ORDER BY name ASC");
  },

  async getById(id) {
    const rows = await query("SELECT * FROM price_presets WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create({ name, water_unit_price, elec_unit_price, extra_fee }) {
    const result = await query(
      "INSERT INTO price_presets (name, water_unit_price, elec_unit_price, extra_fee) VALUES (?, ?, ?, ?)",
      [name, water_unit_price || 0, elec_unit_price || 0, extra_fee || 0],
    );
    return this.getById(result.insertId);
  },

  async update(id, { name, water_unit_price, elec_unit_price, extra_fee }) {
    const result = await query(
      "UPDATE price_presets SET name = ?, water_unit_price = ?, elec_unit_price = ?, extra_fee = ? WHERE id = ?",
      [name, water_unit_price || 0, elec_unit_price || 0, extra_fee || 0, id],
    );
    if (result.affectedRows === 0) return null;
    return this.getById(id);
  },

  async remove(id) {
    const result = await query("DELETE FROM price_presets WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

module.exports = PriceModel;
