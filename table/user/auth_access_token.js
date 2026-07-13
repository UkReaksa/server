const db = require("../../src/config/db");

const sql = `
CREATE TABLE IF NOT EXISTS auth_access_token (
  id INT AUTO_INCREMENT PRIMARY KEY,

  access_token TEXT NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,

  is_revoked BOOLEAN DEFAULT FALSE,

  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_by INT,
  updated_at DATETIME,

  deleted_by INT,
  deleted_at DATETIME,

  -- Foreign Key (token belongs to user)
  CONSTRAINT fk_access_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB;
`;

db.query(sql, (err) => {
  if (err) {
    console.error("❌ Error creating auth_access_token table:", err);
    return;
  }

  console.log("✅ auth_access_token table created successfully!");
  db.end();
});
