CREATE DATABASE campuskart;
USE campuskart;

CREATE TABLE users (
    uid INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE products (
    pid INT PRIMARY KEY AUTO_INCREMENT,
    pname VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'sold', 'inactive') DEFAULT 'available',
    bought_year INT,
    preferred_for ENUM('1st', '2nd', '3rd', '4th', 'all'),
    no_of_copies INT DEFAULT 1
);

CREATE TABLE product_seller (
    pid INT PRIMARY KEY,
    sellerid INT,
    FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE,
    FOREIGN KEY (sellerid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE prod_spec (
    pid INT,
    spec_name VARCHAR(100),
    spec_value VARCHAR(100),
    PRIMARY KEY (pid, spec_name),
    FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE
);

CREATE TABLE prod_img (
    pid INT,
    img_url VARCHAR(255),
    PRIMARY KEY (pid, img_url),
    FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE
);


CREATE TABLE prod_loc (
    pid INT,
    location ENUM('Kriyakalpa', 'Mingos', 'CS ground') DEFAULT 'Kriyakalpa',
    PRIMARY KEY (pid, location),
    FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE
);

CREATE TABLE transaction (
    tid INT PRIMARY KEY AUTO_INCREMENT,
    buyerid INT,
    pid INT,
    quantity INT NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    time_of_purchase DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyerid) REFERENCES users(uid),
    FOREIGN KEY (pid) REFERENCES products(pid)
);

CREATE TABLE add_to_wishlist (
    uid INT,
    pid INT,
    PRIMARY KEY (uid, pid),
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE
);


CREATE INDEX idx_transaction_pid 
ON transaction(pid);

CREATE INDEX idx_transaction_buyerid 
ON transaction(buyerid);

CREATE INDEX idx_products_pid 
ON products(pid);

CREATE INDEX idx_wishlist_pid 
ON add_to_wishlist(pid);


SHOW INDEX FROM transaction;

ALTER TABLE transaction
ADD CONSTRAINT chk_quantity_positive 
CHECK (quantity > 0);
