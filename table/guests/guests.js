CREATE TABLE guests (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(100)  NOT NULL,
  phone_number    VARCHAR(20)   DEFAULT NULL,
  email           VARCHAR(100)  DEFAULT NULL,
  nationality     VARCHAR(50)   DEFAULT NULL,
  number_passport VARCHAR(30)   DEFAULT NULL,  -- លេខ passport/ID
  gender          ENUM('male','female','other') DEFAULT 'male',
  date_of_birth   DATE          DEFAULT NULL,
  address         TEXT          DEFAULT NULL,
  note            TEXT          DEFAULT NULL,
  status          ENUM('active','inactive','blacklist') DEFAULT 'active',
  avatar          VARCHAR(255)  DEFAULT NULL,
  created_at      DATETIME      DEFAULT NOW(),
  created_by      INT           DEFAULT NULL,
  update_at       DATETIME      DEFAULT NULL,
  update_by       INT           DEFAULT NULL,
  delete_at       DATETIME      DEFAULT NULL,
  delete_by       INT           DEFAULT NULL,
 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (update_by)  REFERENCES users(id) ON DELETE SET NULL
);