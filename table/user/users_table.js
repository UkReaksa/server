const db = require("../../src/config/db");

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  gmail VARCHAR(100),
  password VARCHAR(255),
  role VARCHAR(50),
  status VARCHAR(50),
  photo_path VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_owner BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_staff BOOLEAN DEFAULT FALSE,
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

db.query(createUsersTable, (err, result) => {
  if (err) throw err;
  console.log("Users table created!");
  db.end();
});
