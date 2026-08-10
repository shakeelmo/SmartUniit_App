-- Delivery Notes module tables
CREATE TABLE IF NOT EXISTS delivery_notes (
  id VARCHAR(191) PRIMARY KEY,
  note_number VARCHAR(50) UNIQUE,
  customer_id VARCHAR(191),
  invoice_id VARCHAR(191),
  delivery_date VARCHAR(50),
  recipient_name VARCHAR(255),
  signature LONGTEXT,
  notes LONGTEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_by VARCHAR(191),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS delivery_note_items (
  id VARCHAR(191) PRIMARY KEY,
  delivery_note_id VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  quantity DOUBLE DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'pcs',
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dn_items FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
