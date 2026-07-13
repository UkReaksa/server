const Permission = require("../model/permission.model");

// GET ALL
exports.getPermissions = (req, res) => {
  Permission.getAllPermissions((err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(results);
  });
};

// GET BY ID
exports.getPermission = (req, res) => {
  const id = req.params.id;

  Permission.getPermissionById(id, (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(results);
  });
};

// CREATE
exports.createPermission = (req, res) => {
  const { name } = req.body;

  Permission.createPermission(name, (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Permission created",
      results,
    });
  });
};

// UPDATE
exports.updatePermission = (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  Permission.updatePermission(id, name, (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Permission updated",
    });
  });
};

// DELETE
exports.deletePermission = (req, res) => {
  const id = req.params.id;

  Permission.deletePermission(id, (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Permission deleted",
    });
  });
};