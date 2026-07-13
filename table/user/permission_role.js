const db = require("../../src/config/db");

const sql = `
CREATE TABLE IF NOT EXISTS permission_role (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permission_id INT NOT NULL,
  role_id INT NOT NULL

) ENGINE=InnoDB;
`;

db.query(sql, (err) => {
  if (err) {
    console.error("❌ Error creating permission_role table:", err);
    return;
  }

  console.log("✅ permission_role table created successfully!");
  db.end();
});
