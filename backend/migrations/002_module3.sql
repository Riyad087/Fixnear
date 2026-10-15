-- FixNear Module 3 migration. Non-destructive: adds tables only.
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  provider_id INT NOT NULL,
  rating TINYINT NOT NULL,
  review_text VARCHAR(2000) NOT NULL,
  service_quality_rating TINYINT NULL,
  punctuality_rating TINYINT NULL,
  communication_rating TINYINT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  moderation_reason VARCHAR(500) NULL,
  moderated_by INT NULL,
  moderated_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_provider FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_moderator FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_reviews_provider_visible (provider_id, is_visible)
);

CREATE TABLE IF NOT EXISTS provider_verification_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  applicant_information JSON NOT NULL,
  document_reference VARCHAR(255) NULL,
  application_status ENUM('pending','approved','rejected','revoked') NOT NULL DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  rejection_reason VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_verification_provider FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  CONSTRAINT fk_verification_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_verification_status (application_status, created_at)
);

CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  reporter_user_id INT NOT NULL,
  reported_provider_id INT NOT NULL,
  category ENUM('provider_did_not_arrive','poor_service','unexpected_price','inappropriate_behavior','booking_dispute','misleading_information','other') NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open','under_review','awaiting_response','resolved','dismissed') NOT NULL DEFAULT 'open',
  assigned_admin_id INT NULL,
  admin_response TEXT NULL,
  resolution_notes TEXT NULL,
  resolution_reason VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  CONSTRAINT fk_complaint_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaint_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaint_provider FOREIGN KEY (reported_provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaint_admin FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_complaints_status (status, created_at),
  INDEX idx_complaints_reporter (reporter_user_id)
);

CREATE TABLE IF NOT EXISTS complaint_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  changed_by_user_id INT NOT NULL,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  note VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaint_history_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaint_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_complaint_history (complaint_id, created_at)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id INT NULL,
  reason VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_entity (entity_type, entity_id)
);
