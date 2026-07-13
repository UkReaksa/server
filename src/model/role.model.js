const db = require("../config/db");

// get all roles with permissions
const getAll = (callback) => {
  const sql = `
    SELECT
      r.id,
      r.name,
      p.id   AS permission_id,
      p.name AS permission_name
    FROM roles r
    LEFT JOIN permission_role pr ON pr.role_id = r.id
    LEFT JOIN permissions p      ON p.id = pr.permission_id
    ORDER BY r.id
  `;
  db.query(sql, (err, rows) => {
    if (err) return callback(err, null);

    const rolesMap = {};
    rows.forEach((row) => {
      if (!rolesMap[row.id]) {
        rolesMap[row.id] = {
          id: row.id,
          name: row.name,
          permissions: [],
        };
      }
      if (row.permission_id) {
        rolesMap[row.id].permissions.push({
          id: row.permission_id,
          name: row.permission_name,
        });
      }
    });

    callback(null, Object.values(rolesMap));
  });
};

// get role by id with permissions
const getById = (id, callback) => {
  const sql = `
    SELECT
      r.id,
      r.name,
      p.id   AS permission_id,
      p.name AS permission_name
    FROM roles r
    LEFT JOIN permission_role pr ON pr.role_id = r.id
    LEFT JOIN permissions p      ON p.id = pr.permission_id
    WHERE r.id = ?
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return callback(err, null);
    if (!rows.length) return callback(null, null);

    const role = {
      id: rows[0].id,
      name: rows[0].name,
      permissions: rows
        .filter((r) => r.permission_id)
        .map((r) => ({ id: r.permission_id, name: r.permission_name })),
    };

    callback(null, role);
  });
};

// create role
const create = (name, callback) => {
  const sql = `INSERT INTO roles (name) VALUES (?)`;
  db.query(sql, [name], callback);
};

// insert permissions for role
const addPermissions = (roleId, permissionIds, callback) => {
  const sql = `INSERT INTO permission_role (role_id, permission_id) VALUES ?`;
  const values = permissionIds.map((pid) => [roleId, pid]);
  db.query(sql, [values], callback);
};

// update role name
const update = (id, name, callback) => {
  const sql = `UPDATE roles SET name = ? WHERE id = ?`;
  db.query(sql, [name, id], callback);
};

// delete all permissions for role
const deletePermissions = (roleId, callback) => {
  const sql = `DELETE FROM permission_role WHERE role_id = ?`;
  db.query(sql, [roleId], callback);
};

// delete role
const remove = (id, callback) => {
  const sql = `DELETE FROM roles WHERE id = ?`;
  db.query(sql, [id], callback);
};

module.exports = {
  getAll,
  getById,
  create,
  addPermissions,
  update,
  deletePermissions,
  remove,
};
