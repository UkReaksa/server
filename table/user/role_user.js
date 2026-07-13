const db = require("../../src/config/db");

const sql = `
CREATE TABLE IF NOT EXISTS role_user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  user_id INT NOT NULL,

 created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  update_by INT,
  update_at DATETIME,

  deleted_by INT,
  deleted_at DATETIME,

  sort_order INT,
  code VARCHAR(100)

);
`;

db.query(sql, (err) => {
  if (err) throw err;
  console.log("✅ role_user table created successfully!");
  db.end();
});
