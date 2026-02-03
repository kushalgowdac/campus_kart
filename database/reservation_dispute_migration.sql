-- Reservation cancellation tracking + disputes

CREATE TABLE IF NOT EXISTS reservation_cancellations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pid INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    cancelled_by INT NOT NULL,
    stage VARCHAR(40) NOT NULL,
    is_pre_otp TINYINT(1) NOT NULL DEFAULT 0,
    reason VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_res_cancel_buyer (buyer_id),
    INDEX idx_res_cancel_pid (pid),
    INDEX idx_res_cancel_created (created_at),
    FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (cancelled_by) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pid INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    status ENUM('open', 'resolved', 'rejected') DEFAULT 'open',
    reason VARCHAR(100) NOT NULL,
    details TEXT NULL,
    evidence_url VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dispute_pid (pid),
    INDEX idx_dispute_buyer (buyer_id),
    INDEX idx_dispute_status (status),
    FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(uid) ON DELETE CASCADE
);
