const db = require("../config/db");

// GET ALL
const getAllPermissions = (callback) => {
  db.query("SELECT * FROM permissions", callback);
};

// GET BY ID
const getPermissionById = (id, callback) => {
  db.query("SELECT * FROM permissions WHERE id = ?", [id], callback);
};

// CREATE
const createPermission = (name, callback) => {
  db.query("INSERT INTO permissions (name) VALUES (?)", [name], callback);
};

// UPDATE
const updatePermission = (id, name, callback) => {
  db.query(
    "UPDATE permissions SET name = ? WHERE id = ?",
    [name, id],
    callback,
  );
};

// DELETE
const deletePermission = (id, callback) => {
  db.query("DELETE FROM permissions WHERE id = ?", [id], callback);
};

module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
};
