USE campuskart;

INSERT INTO users (name, email, password) VALUES
('Kushal Gowda', 'kushal@rvce.edu.in', 'hash1'),
('Harshith Kumar', 'harshith@rvce.edu.in', 'hash2'),
('Ananya Rao', 'ananya@rvce.edu.in', 'hash3'),
('Vikram Jain', 'vikram@rvce.edu.in', 'hash4'),
('Neha Sharma', 'neha@rvce.edu.in', 'hash5');

INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Scientific Calculator', 'Electronics', 850.00, 'available', 2023, '1st', 2),
('Data Structures Book', 'Books', 450.00, 'available', 2022, '2nd', 1),
('Lab Coat', 'Lab', 300.00, 'available', 2024, 'all', 3),
('Electronics Lab Kit', 'Lab', 1200.00, 'available', 2023, '2nd', 1),
('Engineering Drawing Set', 'Stationery', 250.00, 'available', 2024, '1st', 5),
('C Programming Book', 'Books', 320.00, 'available', 2021, '1st', 2),
('Digital Multimeter', 'Electronics', 900.00, 'available', 2023, '3rd', 1),
('USB Pendrive 64GB', 'Electronics', 400.00, 'available', 2024, 'all', 4),
('Apron', 'Lab', 180.00, 'available', 2024, 'all', 6),
('Graph Sheets Pack', 'Stationery', 120.00, 'available', 2024, 'all', 10);

INSERT INTO product_seller (pid, sellerid) VALUES
(1, 1),
(2, 2),
(3, 1),
(4, 3),
(5, 4),
(6, 5),
(7, 2),
(8, 3),
(9, 4),
(10, 5);

INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES
(1, 'Brand', 'Casio'),
(1, 'Model', 'fx-991EX'),
(2, 'Edition', '3rd'),
(3, 'Size', 'M'),
(4, 'Kit', 'Basic'),
(5, 'Items', '10'),
(6, 'Language', 'C'),
(7, 'Range', 'Auto'),
(8, 'Type', 'USB 3.0'),
(9, 'Size', 'L'),
(10, 'Sheets', '50');

INSERT INTO prod_img (pid, img_url) VALUES
(1, '/images/Casio%20fx-300ES%20Plus.jpg'),
(2, '/images/dbms_textbook.jpg'),
(3, '/images/lab_coat.png'),
(4, '/images/esp32.jpg'),
(5, '/images/cprog_dennis_richie.jpg'),
(6, '/images/cprog_dennis_richie.jpg'),
(7, '/images/esp32.jpg'),
(8, '/images/phone1.jpg'),
(9, '/images/lab_coat.png'),
(10, '/images/dbms_textbook.jpg');

INSERT INTO prod_loc (pid, location) VALUES
(1, 'Kriyakalpa'),
(2, 'Mingos'),
(3, 'CS ground'),
(4, 'Kriyakalpa'),
(5, 'Mingos'),
(6, 'CS ground'),
(7, 'Kriyakalpa'),
(8, 'Mingos'),
(9, 'CS ground'),
(10, 'Kriyakalpa');

INSERT INTO add_to_wishlist (uid, pid) VALUES
(2, 1),
(3, 2),
(4, 7),
(5, 5);

INSERT INTO `transaction` (buyerid, pid, quantity, status) VALUES
(2, 3, 1, 'completed'),
(4, 1, 1, 'completed');
