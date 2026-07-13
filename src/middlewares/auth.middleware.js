const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.verifyToken = (req, res, next) => {
  const bearer = req.headers["authorization"];
  if (!bearer) return res.status(403).json({ message: "No token provided" });

  const token = bearer.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    // ── Workspace owner token — skip DB check ──────────
    if (decoded.role === "workspace_owner") {
      req.user = decoded;
      req.userId = decoded.id;
      return next();
    }

    // ── Normal user token — check auth_access_token ────
    const sql = `SELECT * FROM auth_access_token WHERE access_token = ? AND is_revoked = FALSE`;
    db.query(sql, [token], (err2, results) => {
      if (err2) return res.status(500).json(err2);
      if (!results.length)
        return res.status(401).json({ message: "Token not found or revoked" });
      if (new Date(results[0].expires_at) < new Date())
        return res.status(401).json({ message: "Token expired" });

      req.user = decoded;
      req.userId = decoded.id;
      next();
    });
  });
};
