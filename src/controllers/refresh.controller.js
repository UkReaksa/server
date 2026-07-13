// src/controllers/refresh.controller.js
const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.refreshToken = (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token)
    return res.status(400).json({ message: "No refresh token provided" });

  const sql = `SELECT * FROM auth_refresh_token WHERE refresh_token = ? AND is_revoked = FALSE`;
  db.query(sql, [refresh_token], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res.status(401).json({ message: "Invalid refresh token" });

    const tokenData = results[0];
    const newAccessToken = jwt.sign(
      { id: tokenData.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({ access_token: newAccessToken });
  });
};
