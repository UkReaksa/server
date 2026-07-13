const db = require("../../src/config/db");

const sql = `
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  \`group\` VARCHAR(100),
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at DATETIME,
  deleted_at DATETIME
) ENGINE=InnoDB;
`;

db.query(sql, (err) => {
  if (err) throw err;
  console.log("✅ permissions table created successfully!");
  db.end();
});
