-- FixNear Module 2 migration. This adds tables only; it does not drop existing tables.
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  provider_id INT NOT NULL,
  service_category VARCHAR(100) NOT NULL,
  problem_title VARCHAR(150) NOT NULL,
  problem_description TEXT NOT NULL,
  service_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  area VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  urgency ENUM('normal','urgent') NOT NULL DEFAULT 'normal',
  status ENUM('requested','accepted','rejected','on_the_way','in_service','completed','cancelled') NOT NULL DEFAULT 'requested',
  cancellation_reason VARCHAR(500) NULL,
  rejection_reason VARCHAR(500) NULL,
  accepted_at DATETIME NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_provider FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  INDEX idx_booking_customer (customer_id),
  INDEX idx_booking_provider_status (provider_id, status),
  INDEX idx_booking_date (preferred_date, preferred_time)
);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  changed_by_user_id INT NOT NULL,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_history_booking (booking_id, created_at)
);

CREATE TABLE IF NOT EXISTS quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  provider_id INT NOT NULL,
  problem_description TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  area VARCHAR(100) NOT NULL,
  service_address VARCHAR(255) NOT NULL,
  budget_min DECIMAL(10,2) NULL,
  budget_max DECIMAL(10,2) NULL,
  estimated_price DECIMAL(10,2) NULL,
  estimated_duration VARCHAR(100) NULL,
  provider_message TEXT NULL,
  status ENUM('requested','quoted','accepted','rejected','expired') NOT NULL DEFAULT 'requested',
  valid_until DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quotes_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_quotes_provider FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  INDEX idx_quote_customer (customer_id),
  INDEX idx_quote_provider_status (provider_id, status)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  booking_id INT NULL,
  quote_id INT NULL,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  INDEX idx_notification_user_read (user_id, is_read, created_at)
);
