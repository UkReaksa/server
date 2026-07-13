const db = require("../../src/config/db");

const sql = `
CREATE TABLE IF NOT EXISTS auth_refresh_token (
  id INT AUTO_INCREMENT PRIMARY KEY,

  refresh_token TEXT NOT NULL,
  access_token_id INT,
  expires_at DATETIME NOT NULL,

  is_revoked BOOLEAN DEFAULT FALSE,

  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  update_by INT,
  update_at DATETIME,

  delete_by INT,
  delete_at DATETIME,

  -- Foreign key (user who created token)
  CONSTRAINT fk_refresh_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB;
`;

db.query(sql, (err) => {
  if (err) {
    console.error("❌ Error creating auth_refresh_token table:", err);
    return;
  }

  console.log("✅ auth_refresh_token table created successfully!");
  db.end();
});
