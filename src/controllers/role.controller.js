const Role = require("../model/role.model");

// ---------------- Get all roles ----------------
exports.getRoles = (req, res) => {
  Role.getAll((err, roles) => {
    if (err) return res.status(500).json(err);
    res.json(roles);
  });
};

// ---------------- Get role by ID ----------------
exports.getRoleById = (req, res) => {
  const { id } = req.params;
  Role.getById(id, (err, role) => {
    if (err) return res.status(500).json(err);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  });
};

// ---------------- Create role ----------------
exports.createRole = (req, res) => {
  const { name, permission_ids } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Role name is required" });
  }

  // step 1 — create role
  Role.create(name, (err, result) => {
    if (err) return res.status(500).json(err);

    const roleId = result.insertId;

    // step 2 — if no permissions just return
    if (!permission_ids || permission_ids.length === 0) {
      return res.status(201).json({
        message: "Role created without permissions",
        role_id: roleId,
      });
    }

    // step 3 — add permissions
    Role.addPermissions(roleId, permission_ids, (err2) => {
      if (err2) return res.status(500).json(err2);

      res.status(201).json({
        message: "Role created with permissions",
        role_id: roleId,
      });
    });
  });
};

// ---------------- Update role ----------------
exports.updateRole = (req, res) => {
  const { id } = req.params;
  const { name, permission_ids } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Role name is required" });
  }

  // step 1 — update name
  Role.update(id, name, (err) => {
    if (err) return res.status(500).json(err);

    // step 2 — delete old permissions
    Role.deletePermissions(id, (err2) => {
      if (err2) return res.status(500).json(err2);

      // step 3 — insert new permissions
      if (!permission_ids || permission_ids.length === 0) {
        return res.json({ message: "Role updated without permissions" });
      }

      Role.addPermissions(id, permission_ids, (err3) => {
        if (err3) return res.status(500).json(err3);
        res.json({ message: "Role updated successfully" });
      });
    });
  });
};

// ---------------- Delete role ----------------
exports.deleteRole = (req, res) => {
  const { id } = req.params;

  // step 1 — delete permissions first
  Role.deletePermissions(id, (err) => {
    if (err) return res.status(500).json(err);

    // step 2 — delete role
    Role.remove(id, (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "Role deleted successfully" });
    });
  });
};
