-- Bulk seed data for CampusKart
-- Contains 100+ products, multiple users, specs, and images
-- Run after schema.sql and rbac_migration.sql

-- Clear existing data (for clean reseeding)
SET FOREIGN_KEY_CHECKS = 0;

DELIMITER $$
CREATE PROCEDURE truncate_if_exists(IN tbl_name VARCHAR(64))
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = DATABASE()
			AND table_name = tbl_name
	) THEN
		SET @s = CONCAT('TRUNCATE TABLE `', tbl_name, '`');
		PREPARE stmt FROM @s;
		EXECUTE stmt;
		DEALLOCATE PREPARE stmt;
	END IF;
END$$
DELIMITER ;

CALL truncate_if_exists('user_ratings');
CALL truncate_if_exists('user_badges');
CALL truncate_if_exists('badges');
CALL truncate_if_exists('add_to_wishlist');
CALL truncate_if_exists('otp_tokens');
CALL truncate_if_exists('proposed_locations');
CALL truncate_if_exists('reschedule_requests');
CALL truncate_if_exists('prod_loc');
CALL truncate_if_exists('prod_img');
CALL truncate_if_exists('prod_spec');
CALL truncate_if_exists('transaction');
CALL truncate_if_exists('product_seller');
CALL truncate_if_exists('products');
CALL truncate_if_exists('users');

DROP PROCEDURE IF EXISTS truncate_if_exists;
SET FOREIGN_KEY_CHECKS = 1;

-- Seed users (1 admin + 19 students)
INSERT INTO users (uid, name, email, password, role, trust_points) VALUES
(1, 'Admin User', 'admin@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'admin', 100),
(2, 'Raj Kumar', 'raj.kumar@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 85),
(3, 'Priya Sharma', 'priya.sharma@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 92),
(4, 'Arjun Patel', 'arjun.patel@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 78),
(5, 'Sneha Reddy', 'sneha.reddy@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 95),
(6, 'Vikram Singh', 'vikram.singh@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 88),
(7, 'Divya Iyer', 'divya.iyer@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 91),
(8, 'Karthik Rao', 'karthik.rao@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 73),
(9, 'Ananya Nair', 'ananya.nair@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 89),
(10, 'Rohan Joshi', 'rohan.joshi@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 82),
(11, 'Meera Das', 'meera.das@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 94),
(12, 'Aditya Gupta', 'aditya.gupta@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 76),
(13, 'Kavya Menon', 'kavya.menon@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 90),
(14, 'Siddharth Bhat', 'siddharth.bhat@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 81),
(15, 'Pooja Hegde', 'pooja.hegde@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 87),
(16, 'Nikhil Shetty', 'nikhil.shetty@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 93),
(17, 'Deepa Kulkarni', 'deepa.kulkarni@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 79),
(18, 'Varun Desai', 'varun.desai@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 86),
(19, 'Ishita Verma', 'ishita.verma@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 84),
(20, 'Akash Mehta', 'akash.mehta@rvce.edu.in', '$2b$10$YourHashedPasswordHere', 'user', 77);

-- Seed products (120 products across categories)
-- Books (30 products)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Database Management Systems - Elmasri Navathe', 'Books', 450, 'available', 2023, '3rd', 1),
('Operating Systems - Galvin', 'Books', 500, 'available', 2022, '2nd', 1),
('Data Structures and Algorithms - Cormen', 'Books', 650, 'available', 2023, 'all', 1),
('Computer Networks - Tanenbaum', 'Books', 420, 'available', 2022, '3rd', 1),
('Software Engineering - Pressman', 'Books', 380, 'available', 2023, '4th', 1),
('Digital Electronics - Morris Mano', 'Books', 350, 'available', 2021, '2nd', 1),
('Microprocessors - Ramesh Gaonkar', 'Books', 400, 'available', 2022, '3rd', 1),
('Theory of Computation - Ullman', 'Books', 480, 'available', 2023, '4th', 1),
('Compiler Design - Aho Ullman', 'Books', 520, 'available', 2022, '4th', 1),
('Artificial Intelligence - Russell Norvig', 'Books', 600, 'available', 2023, 'all', 1),
('Machine Learning - Tom Mitchell', 'Books', 550, 'available', 2023, '4th', 1),
('Computer Graphics - Hearn Baker', 'Books', 430, 'available', 2022, '3rd', 1),
('Web Technologies - Uttam K Roy', 'Books', 320, 'available', 2023, '3rd', 1),
('Python Programming - Mark Lutz', 'Books', 470, 'available', 2022, 'all', 1),
('Java Complete Reference - Herbert Schildt', 'Books', 510, 'available', 2023, '2nd', 1),
('C Programming - Kernighan Ritchie', 'Books', 280, 'available', 2021, '1st', 1),
('Data Science with R - Garrett Grolemund', 'Books', 540, 'available', 2023, '4th', 1),
('Discrete Mathematics - Kenneth Rosen', 'Books', 460, 'available', 2022, '1st', 1),
('Linear Algebra - Gilbert Strang', 'Books', 390, 'available', 2022, '2nd', 1),
('Probability and Statistics - Walpole', 'Books', 410, 'available', 2023, '3rd', 1),
('Engineering Mathematics - BS Grewal', 'Books', 370, 'available', 2021, '1st', 1),
('Object Oriented Programming C++ - E Balagurusamy', 'Books', 340, 'available', 2022, '2nd', 1),
('Design Patterns - Gang of Four', 'Books', 580, 'available', 2023, '4th', 1),
('Cloud Computing - Rajkumar Buyya', 'Books', 490, 'available', 2023, 'all', 1),
('Blockchain Technology - Arvind Narayanan', 'Books', 560, 'available', 2023, '4th', 1),
('Cybersecurity Essentials - Charles Brooks', 'Books', 520, 'available', 2023, 'all', 1),
('Internet of Things - Arshdeep Bahga', 'Books', 480, 'available', 2023, '3rd', 1),
('Big Data Analytics - Seema Acharya', 'Books', 530, 'available', 2023, '4th', 1),
('Computer Architecture - Hamacher', 'Books', 460, 'available', 2022, '3rd', 1),
('Embedded Systems - Raj Kamal', 'Books', 440, 'available', 2022, '4th', 1);

-- Electronics (25 products)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Scientific Calculator Casio FX-991EX', 'Electronics', 800, 'available', 2023, 'all', 1),
('HP Wired Mouse', 'Electronics', 250, 'available', 2022, 'all', 1),
('Logitech Wireless Keyboard', 'Electronics', 1200, 'available', 2023, 'all', 1),
('USB Hub 4-Port', 'Electronics', 350, 'available', 2022, 'all', 1),
('Pendrive 32GB SanDisk', 'Electronics', 400, 'available', 2023, 'all', 1),
('External Hard Drive 1TB Seagate', 'Electronics', 3500, 'available', 2022, 'all', 1),
('Webcam HD Logitech C270', 'Electronics', 2000, 'available', 2023, 'all', 1),
('Wired Earphones Sony', 'Electronics', 450, 'available', 2022, 'all', 1),
('Bluetooth Speaker JBL Go 2', 'Electronics', 2500, 'available', 2023, 'all', 1),
('Power Bank 10000mAh Mi', 'Electronics', 1000, 'available', 2023, 'all', 1),
('Laptop Cooling Pad', 'Electronics', 600, 'available', 2022, 'all', 1),
('HDMI Cable 2m', 'Electronics', 200, 'available', 2023, 'all', 1),
('Ethernet Cable Cat6 5m', 'Electronics', 180, 'available', 2022, 'all', 1),
('USB Type-C Cable', 'Electronics', 150, 'available', 2023, 'all', 1),
('Phone Stand Adjustable', 'Electronics', 300, 'available', 2022, 'all', 1),
('Laptop Stand Portable', 'Electronics', 800, 'available', 2023, 'all', 1),
('Screen Protector Laptop 15.6 inch', 'Electronics', 250, 'available', 2022, 'all', 1),
('Wireless Mouse Logitech M331', 'Electronics', 700, 'available', 2023, 'all', 1),
('Graphic Tablet Wacom', 'Electronics', 4500, 'available', 2023, 'all', 1),
('USB LED Light', 'Electronics', 120, 'available', 2022, 'all', 1),
('Microphone for Podcasting', 'Electronics', 3000, 'available', 2023, 'all', 1),
('Ring Light 10 inch', 'Electronics', 1500, 'available', 2023, 'all', 1),
('Tripod Stand for Phone', 'Electronics', 500, 'available', 2022, 'all', 1),
('Card Reader SD/MicroSD', 'Electronics', 200, 'available', 2023, 'all', 1),
('Numeric Keypad USB', 'Electronics', 350, 'available', 2022, 'all', 1);

-- Gadgets (30 products)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Smartwatch Mi Band 5', 'Gadgets', 2000, 'available', 2023, 'all', 1),
('Fitness Tracker Fitbit Inspire', 'Gadgets', 5000, 'available', 2023, 'all', 1),
('Bluetooth Headphones Boat Rockerz', 'Gadgets', 1500, 'available', 2022, 'all', 1),
('Noise Cancelling Earbuds', 'Gadgets', 3500, 'available', 2023, 'all', 1),
('Portable SSD 500GB Samsung', 'Gadgets', 5500, 'available', 2023, 'all', 1),
('Smart LED Bulb Philips Hue', 'Gadgets', 1200, 'available', 2022, 'all', 1),
('Portable Projector Anker', 'Gadgets', 12000, 'available', 2023, 'all', 1),
('VR Headset Oculus Go', 'Gadgets', 15000, 'available', 2022, 'all', 1),
('Action Camera GoPro Hero 7', 'Gadgets', 18000, 'available', 2023, 'all', 1),
('Drone DJI Mini 2', 'Gadgets', 35000, 'available', 2023, 'all', 1),
('E-Reader Kindle Paperwhite', 'Gadgets', 10000, 'available', 2023, 'all', 1),
('Smart Pen Livescribe', 'Gadgets', 8000, 'available', 2022, 'all', 1),
('Digital Voice Recorder', 'Gadgets', 2500, 'available', 2023, 'all', 1),
('Portable WiFi Hotspot', 'Gadgets', 3000, 'available', 2022, 'all', 1),
('USB Desk Fan', 'Gadgets', 400, 'available', 2023, 'all', 1),
('Digital Photo Frame', 'Gadgets', 2000, 'available', 2022, 'all', 1),
('Smart Watch Strap Leather', 'Gadgets', 500, 'available', 2023, 'all', 1),
('Phone Camera Lens Kit', 'Gadgets', 1800, 'available', 2023, 'all', 1),
('Selfie Stick Bluetooth', 'Gadgets', 600, 'available', 2022, 'all', 1),
('Portable Monitor 15.6 inch', 'Gadgets', 8000, 'available', 2023, 'all', 1),
('Mechanical Keyboard RGB', 'Gadgets', 4000, 'available', 2023, 'all', 1),
('Gaming Mouse Razer DeathAdder', 'Gadgets', 3000, 'available', 2022, 'all', 1),
('Gaming Headset HyperX Cloud', 'Gadgets', 4500, 'available', 2023, 'all', 1),
('Stream Deck Elgato', 'Gadgets', 12000, 'available', 2023, 'all', 1),
('Smart Home Hub Amazon Echo Dot', 'Gadgets', 3500, 'available', 2023, 'all', 1),
('Security Camera Wyze Cam', 'Gadgets', 2500, 'available', 2022, 'all', 1),
('Smart Door Lock', 'Gadgets', 8000, 'available', 2023, 'all', 1),
('Air Purifier Portable', 'Gadgets', 3000, 'available', 2023, 'all', 1),
('Electric Kettle Travel Size', 'Gadgets', 800, 'available', 2022, 'all', 1),
('Smart Thermostat Nest', 'Gadgets', 10000, 'available', 2023, 'all', 1);

-- Furniture (20 products)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Study Table Wooden', 'Furniture', 2500, 'available', 2022, 'all', 1),
('Ergonomic Chair', 'Furniture', 3500, 'available', 2023, 'all', 1),
('Bookshelf 5-Tier', 'Furniture', 2000, 'available', 2022, 'all', 1),
('Laptop Table Foldable', 'Furniture', 800, 'available', 2023, 'all', 1),
('Bean Bag XXL', 'Furniture', 1500, 'available', 2022, 'all', 1),
('Wall Mounted Shelf', 'Furniture', 600, 'available', 2023, 'all', 1),
('Study Lamp LED', 'Furniture', 500, 'available', 2022, 'all', 1),
('Whiteboard 2x3 feet', 'Furniture', 800, 'available', 2023, 'all', 1),
('Cork Board for Notes', 'Furniture', 400, 'available', 2022, 'all', 1),
('Desk Organizer Multi-compartment', 'Furniture', 300, 'available', 2023, 'all', 1),
('Magazine Rack', 'Furniture', 450, 'available', 2022, 'all', 1),
('Shoe Rack 3-Tier', 'Furniture', 1000, 'available', 2023, 'all', 1),
('Cloth Hanging Stand', 'Furniture', 1200, 'available', 2022, 'all', 1),
('Bedside Table', 'Furniture', 1500, 'available', 2023, 'all', 1),
('Mirror Full Length', 'Furniture', 1800, 'available', 2022, 'all', 1),
('Wall Clock Digital', 'Furniture', 600, 'available', 2023, 'all', 1),
('Floor Mat Anti-slip', 'Furniture', 350, 'available', 2022, 'all', 1),
('Curtain Rod Adjustable', 'Furniture', 500, 'available', 2023, 'all', 1),
('Storage Box Plastic Set of 3', 'Furniture', 700, 'available', 2022, 'all', 1),
('Drawer Organizer', 'Furniture', 250, 'available', 2023, 'all', 1);

-- Equipments (15 products)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Arduino Uno R3 Kit', 'Equipments', 1500, 'available', 2023, '3rd', 1),
('Raspberry Pi 4 Model B', 'Equipments', 4500, 'available', 2023, '4th', 1),
('Breadboard with Jumper Wires', 'Equipments', 300, 'available', 2022, '2nd', 1),
('Multimeter Digital', 'Equipments', 800, 'available', 2023, '3rd', 1),
('Soldering Iron Kit', 'Equipments', 600, 'available', 2022, 'all', 1),
('Oscilloscope Handheld', 'Equipments', 8000, 'available', 2023, '4th', 1),
('Power Supply Variable', 'Equipments', 3000, 'available', 2023, '3rd', 1),
('Function Generator', 'Equipments', 5000, 'available', 2022, '4th', 1),
('Logic Analyzer', 'Equipments', 3500, 'available', 2023, '4th', 1),
('3D Printer Ender 3', 'Equipments', 18000, 'available', 2023, 'all', 1),
('Hot Glue Gun', 'Equipments', 250, 'available', 2022, 'all', 1),
('Wire Stripper Tool', 'Equipments', 200, 'available', 2023, 'all', 1),
('Circuit Testing Kit', 'Equipments', 1200, 'available', 2022, '3rd', 1),
('Lab Notebook Hardbound', 'Equipments', 150, 'available', 2023, 'all', 1),
('Safety Goggles', 'Equipments', 100, 'available', 2022, 'all', 1);

-- Link products to sellers (distribute among users 2-20)
INSERT INTO product_seller (pid, sellerid) VALUES
-- Books (pid 1-30) - sellers 2-11
(1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 9), (9, 10), (10, 11),
(11, 2), (12, 3), (13, 4), (14, 5), (15, 6), (16, 7), (17, 8), (18, 9), (19, 10), (20, 11),
(21, 2), (22, 3), (23, 4), (24, 5), (25, 6), (26, 7), (27, 8), (28, 9), (29, 10), (30, 11),
-- Electronics (pid 31-55) - sellers 12-16
(31, 12), (32, 13), (33, 14), (34, 15), (35, 16), (36, 12), (37, 13), (38, 14), (39, 15), (40, 16),
(41, 12), (42, 13), (43, 14), (44, 15), (45, 16), (46, 12), (47, 13), (48, 14), (49, 15), (50, 16),
(51, 12), (52, 13), (53, 14), (54, 15), (55, 16),
-- Gadgets (pid 56-85) - sellers 17-20, 2-6
(56, 17), (57, 18), (58, 19), (59, 20), (60, 2), (61, 3), (62, 4), (63, 5), (64, 6), (65, 7),
(66, 17), (67, 18), (68, 19), (69, 20), (70, 2), (71, 3), (72, 4), (73, 5), (74, 6), (75, 7),
(76, 17), (77, 18), (78, 19), (79, 20), (80, 2), (81, 3), (82, 4), (83, 5), (84, 6), (85, 7),
-- Furniture (pid 86-105) - sellers 8-17
(86, 8), (87, 9), (88, 10), (89, 11), (90, 12), (91, 13), (92, 14), (93, 15), (94, 16), (95, 17),
(96, 8), (97, 9), (98, 10), (99, 11), (100, 12), (101, 13), (102, 14), (103, 15), (104, 16), (105, 17),
-- Equipments (pid 106-120) - sellers 18-20, 2-11
(106, 18), (107, 19), (108, 20), (109, 2), (110, 3), (111, 4), (112, 5), (113, 6), (114, 7), (115, 8),
(116, 9), (117, 10), (118, 11), (119, 18), (120, 19);

-- Add product images (using placeholder service with fallback to local images folder)
-- Format: online URL or relative path like 'dbmstb.jpg' which will be served from /images/dbmstb.jpg
INSERT INTO prod_img (pid, img_url) VALUES
-- Books
(1, '/images/dbms_textbook.jpg'),
(2, '/images/os_galvin.jpg'),
(5, '/images/Software%20Engineering%20-%20Pressman.jpg'),
(6, '/images/Digital%20Electronics%20-%20Morris%20Mano.jpg'),
(9, '/images/Compiler%20Design%20-%20Aho%20Ullman.jpg'),
(10, '/images/aiml_russel.jpg'),
(11, '/images/tom_ml.jpg'),
(12, '/images/computer_graphics_haren.jpg'),
(13, '/images/Web%20Technologies%20-%20Uttam%20K%20Roy.jpg'),
(14, '/images/Python%20Programming%20-%20Mark%20Lutz.jpg'),
(15, '/images/Java%20Complete%20Reference%20-%20Herbert%20Schildt.jpg'),
(16, '/images/cprog_dennis_richie.jpg'),
(17, '/images/Data%20Science%20with%20R%20-%20Garrett%20Grolemund.jpg'),
(18, '/images/Discrete%20Mathematics%20-%20Kenneth%20Rosen.jpg'),
(21, '/images/Engineering%20Mathematics%20Textbook.jpg'),
(27, '/images/iot_arsha.jpg'),
-- Electronics
(31, '/images/Casio%20fx-300ES%20Plus.jpg'),
(32, '/images/mouse.jpg'),
(33, '/images/Wireless%20Keyboard.jpg'),
(36, '/images/External%20Hard%20Drive%201TB.jpg'),
(37, '/images/hd%20webcam%20logitech.jpg'),
(38, '/images/earphone1.jpg'),
(39, '/images/Bluetooth%20Speaker.jpg'),
(40, '/images/Power%20Bank%2010000mAh.jpg'),
(46, '/images/Laptop%20Stand%20Portable.jpg'),
-- Gadgets
(56, '/images/Smartwatch%20Mi%20Band.jpg'),
(57, '/images/Fitness%20Tracker%20Fitbit.jpg'),
(64, '/images/camera1.jpg'),
(65, '/images/Drone%20diji%20mini.jpg'),
(66, '/images/Kindle%20Paperwhite.jpg'),
(75, '/images/Portable%20Monitor.jpg'),
-- Furniture
(86, '/images/Study%20Table.jpg'),
(87, '/images/Ergonomic%20Chair.jpg'),
(88, '/images/Bookshelf.jpg'),
(89, '/images/Laptop%20Table%20Foldable.jpg'),
(90, '/images/Bean%20Bag.jpg'),
(91, '/images/Wall%20Shelf.jpg'),
(95, '/images/Desk%20Organizer.jpg'),
(99, '/images/Bedside%20Table.jpg'),
-- Equipments
(106, '/images/Arduino%20Uno.jpg'),
(107, '/images/raspberry4.jpg'),
(108, '/images/Breadboard%20with%20Jumper%20Wires.jpg'),
(109, '/images/Digital%20Multimeter.jpg'),
(110, '/images/soldering1.jpg'),
(111, '/images/Oscilloscope.jpg'),
(115, '/images/3D%20Printer%20Ender%203.jpg'),
(118, '/images/esp32.jpg'),
(120, '/images/Safety%20Goggles.jpg');

-- Add product specifications (2-3 specs per product for rich analytics)
INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES
-- Books
(1, 'Edition', '7th'),
(1, 'Condition', 'Good'),
(2, 'Edition', '9th'),
(2, 'Condition', 'Excellent'),
(3, 'Edition', '3rd'),
(3, 'Condition', 'Like New'),
(4, 'Edition', '5th'),
(4, 'Condition', 'Good'),
(5, 'Edition', '8th'),
(5, 'Condition', 'Fair'),
-- More Books
(6, 'Edition', '6th'),
(6, 'Condition', 'Good'),
(7, 'Edition', '4th'),
(7, 'Condition', 'Excellent'),
(8, 'Edition', '5th'),
(8, 'Condition', 'Good'),
(9, 'Edition', '4th'),
(9, 'Condition', 'Fair'),
(10, 'Edition', '4th'),
(10, 'Condition', 'Good'),
-- Electronics
(31, 'Model', 'FX-991EX'),
(31, 'Warranty', 'No'),
(32, 'Type', 'Wired'),
(32, 'DPI', '1000'),
(33, 'Type', 'Wireless'),
(33, 'Battery', 'Included'),
-- More Electronics
(34, 'Ports', '4'),
(34, 'Condition', 'Good'),
(35, 'Capacity', '32GB'),
(35, 'Condition', 'Excellent'),
(36, 'Capacity', '1TB'),
(36, 'Condition', 'Good'),
(37, 'Resolution', 'HD'),
(37, 'Condition', 'Good'),
(38, 'Type', 'Wired'),
(38, 'Condition', 'Good'),
(39, 'Power', '5W'),
(39, 'Condition', 'Good'),
(40, 'Capacity', '10000mAh'),
(40, 'Condition', 'Good'),
-- Gadgets
(56, 'Display', 'AMOLED'),
(56, 'Battery Life', '14 days'),
(57, 'Heart Rate', 'Yes'),
(57, 'GPS', 'Yes'),
(58, 'Battery Life', '10 hours'),
(58, 'Bluetooth', 'v5.0'),
-- More Gadgets
(59, 'Type', 'Noise Cancelling'),
(59, 'Battery Life', '6 hours'),
(60, 'Capacity', '500GB'),
(60, 'Condition', 'Excellent'),
(61, 'Type', 'Smart LED'),
(61, 'Condition', 'Good'),
(62, 'Resolution', '1080p'),
(62, 'Condition', 'Good'),
(63, 'Condition', 'Good'),
(64, 'Resolution', '4K'),
(64, 'Condition', 'Excellent'),
-- Furniture
(86, 'Material', 'Wood'),
(86, 'Dimensions', '4x2 feet'),
(87, 'Type', 'Ergonomic'),
(87, 'Adjustable', 'Yes'),
-- More Furniture
(88, 'Shelves', '5'),
(88, 'Condition', 'Good'),
(89, 'Foldable', 'Yes'),
(89, 'Condition', 'Good'),
(90, 'Size', 'XL'),
(90, 'Condition', 'Good'),
-- Equipments
(106, 'Microcontroller', 'ATmega328P'),
(106, 'Voltage', '5V'),
(107, 'RAM', '4GB'),
(107, 'Storage', '32GB MicroSD'),
(108, 'Holes', '830'),
(108, 'Material', 'ABS Plastic');

-- Seed gamification badges (schema: badge_key, name, description, icon)
INSERT IGNORE INTO badges (badge_key, name, description, icon) VALUES
('first_trade', 'First Trade', 'Completed your first transaction', '🎉'),
('trusted_user', 'Trusted User', 'Earned 50+ trust points', '⭐'),
('power_seller', 'Power Seller', 'Sold 10+ products', '🏆');

-- Award some badges to active users
INSERT INTO user_badges (uid, badge_key, earned_at) VALUES
(5, 'first_trade', NOW()),
(5, 'trusted_user', NOW()),
(11, 'first_trade', NOW()),
(11, 'trusted_user', NOW()),
(16, 'first_trade', NOW()),
(16, 'trusted_user', NOW());
