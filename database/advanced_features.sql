USE campuskart;

-- Sustainability Reuse Scoring
CREATE TABLE IF NOT EXISTS reuse_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    pid INT NOT NULL,
    last_owner_id INT,
    reuse_count INT DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE,
    FOREIGN KEY (last_owner_id) REFERENCES users(uid) ON DELETE SET NULL
);

CREATE OR REPLACE VIEW product_reuse_score AS
SELECT p.pid,
       p.pname,
       COALESCE(r.reuse_count, 0) AS reuse_count,
       COALESCE(r.reuse_count, 0) + 1 AS reuse_score
FROM products p
LEFT JOIN reuse_history r ON p.pid = r.pid;

CREATE OR REPLACE VIEW user_reuse_score AS
SELECT u.uid,
       u.name,
       COALESCE(SUM(r.reuse_count), 0) AS total_reuse_count,
       ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(r.reuse_count), 0) DESC) AS reuse_rank
FROM users u
LEFT JOIN product_seller ps ON u.uid = ps.sellerid
LEFT JOIN reuse_history r ON ps.pid = r.pid
GROUP BY u.uid, u.name;

DELIMITER $$
CREATE TRIGGER trg_reuse_history
AFTER INSERT ON `transaction`
FOR EACH ROW
BEGIN
    INSERT INTO reuse_history (pid, last_owner_id, reuse_count)
    VALUES (NEW.pid, NEW.buyerid, 1)
    ON DUPLICATE KEY UPDATE
        reuse_count = reuse_count + 1,
        last_owner_id = NEW.buyerid,
        last_updated = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- Dynamic Group Buy Optimizer
CREATE TABLE IF NOT EXISTS group_buy (
    group_id INT PRIMARY KEY AUTO_INCREMENT,
    pid INT NOT NULL,
    initiator_id INT NOT NULL,
    min_threshold INT NOT NULL DEFAULT 3,
    current_joins INT NOT NULL DEFAULT 1,
    prorated_price DECIMAL(10,2),
    status ENUM('open', 'threshold_met', 'closed') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE,
    FOREIGN KEY (initiator_id) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_buy_members (
    group_id INT NOT NULL,
    uid INT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, uid),
    FOREIGN KEY (group_id) REFERENCES group_buy(group_id) ON DELETE CASCADE,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
);

DELIMITER $$
CREATE PROCEDURE join_group_buy(IN p_group_id INT, IN p_uid INT)
BEGIN
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_min INT;
    DECLARE v_current INT;

    INSERT IGNORE INTO group_buy_members (group_id, uid) VALUES (p_group_id, p_uid);

    SELECT p.price, gb.min_threshold, gb.current_joins
    INTO v_price, v_min, v_current
    FROM group_buy gb
    JOIN products p ON gb.pid = p.pid
    WHERE gb.group_id = p_group_id
    FOR UPDATE;

    UPDATE group_buy
    SET current_joins = current_joins + 1
    WHERE group_id = p_group_id;

    SELECT current_joins INTO v_current
    FROM group_buy WHERE group_id = p_group_id;

    IF v_current >= v_min THEN
        UPDATE group_buy
        SET status = 'threshold_met',
            prorated_price = ROUND(v_price / v_current, 2)
        WHERE group_id = p_group_id;
    END IF;
END$$
DELIMITER ;

-- Predictive Inventory Alerts
CREATE TABLE IF NOT EXISTS low_stock_alerts (
    pid INT PRIMARY KEY,
    pname VARCHAR(150),
    category VARCHAR(100),
    no_of_copies INT,
    recent_sales INT,
    trend_indicator INT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$
CREATE PROCEDURE refresh_low_stock_alerts()
BEGIN
    DELETE FROM low_stock_alerts;

    INSERT INTO low_stock_alerts (pid, pname, category, no_of_copies, recent_sales, trend_indicator)
    SELECT p.pid,
           p.pname,
           p.category,
           p.no_of_copies,
           IFNULL(sales.last_30_days, 0) AS recent_sales,
           IFNULL(sales.trend_indicator, 0) AS trend_indicator
    FROM products p
    LEFT JOIN (
        SELECT t.pid,
               SUM(CASE WHEN t.time_of_purchase >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) THEN t.quantity ELSE 0 END) AS last_30_days,
               SUM(CASE WHEN t.time_of_purchase >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) THEN t.quantity ELSE 0 END)
               - SUM(CASE WHEN t.time_of_purchase BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY) AND DATE_SUB(CURRENT_DATE, INTERVAL 31 DAY) THEN t.quantity ELSE 0 END) AS trend_indicator
        FROM `transaction` t
        GROUP BY t.pid
    ) sales ON p.pid = sales.pid
    WHERE p.no_of_copies <= 2 OR IFNULL(sales.last_30_days, 0) >= 3;
END$$
DELIMITER ;

-- Optional scheduled refresh (requires event_scheduler = ON)
-- CREATE EVENT IF NOT EXISTS ev_refresh_low_stock
-- ON SCHEDULE EVERY 1 DAY
-- DO CALL refresh_low_stock_alerts();
