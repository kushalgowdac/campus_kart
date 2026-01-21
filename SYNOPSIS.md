# CampusKart Synopsis (Aligned to ER + Normalization)

## Introduction
CampusKart is a campus-only marketplace that enables students to buy and sell academic items such as calculators, lab coats, and textbooks. The system emphasizes a normalized relational design for reliable, consistent storage of listings, ownership, and transactions.

## Existing System
Current exchanges rely on informal channels (notice boards, group chats) with no structured data, limited searchability, and poor traceability of sales and inventory.

## Proposed System
CampusKart provides a centralized platform using a normalized relational database (3NF) with strict referential integrity. The design focuses on accurate product ownership, listing attributes, and transaction history.

### Core Entities (ER-Aligned)
- **Users**: Verified student accounts.
- **Products**: Listings with price, category, status, and availability.
- **Product_Seller**: Links each product to its seller.
- **Product_Spec**: Key-value specifications for items.
- **Product_Image**: Product image URLs.
- **Product_Location**: Pickup/meetup locations.
- **Transaction**: Purchases with quantities and status.
- **Add_to_Wishlist**: Interested items per user.

## Key Features
- **Product lifecycle management**: Create, update, and mark items sold.
- **Structured seller mapping**: Clear product ownership via `product_seller`.
- **Flexible specifications**: Key-value specs for any item type.
- **Wishlist tracking**: Users can save items for later.
- **Transaction history**: Purchases recorded with quantities and timestamps.

## Database Design
The schema follows 3NF:
- Avoids redundant seller data by using `product_seller`.
- Uses associative tables for specs, images, locations, and wishlists.
- Enforces referential integrity with foreign keys and cascade rules.

## Optional Extension
A MongoDB store can be added for chat messages if needed, but it is not required for the normalized ER model.



RV College of Engineering®, Bengaluru – 59
Department of Computer Science and Engineering
DATABASE MANAGEMENT SYSTEMS (CD252IA) 

Synopsis





TITLE : CampusKart - A Database- driven Campus Marketplace
TEAM
1RV23CS117
Kushal Gowda C
1RV23CS098
Harshith Kumar SB






Introduction
In a college environment, students frequently need to buy and sell academic items such as textbooks, lab equipment, calculators, and electronics. Existing general-purpose marketplaces (such as OLX or Facebook Marketplace) are not designed for campus-specific needs and lack secure user verification, leading to issues of trust, irrelevant listings, and safety concerns.
CampusKart is a proposed database-driven campus marketplace designed exclusively for college students. The system creates a closed ecosystem where only verified users, authenticated through institutional email validation, can participate in buying and selling activities. The project primarily focuses on strong relational database design, normalization, and data integrity, making the database the core component of the system.

Existing System
Currently, students rely on fragmented and insecure methods that lack data integrity and specialized features:
General E-commerce Platforms: These public sites are vulnerable to scams, fake users, and commercial spam. They lack a focus on campus needs and provide no mechanisms for tracking the reuse of items or promoting sustainability.
Informal Social Media Groups: While common, these platforms are unstructured. They offer no searchability, no user verification, no secure transaction management, and no way to build verifiable trust between peers.
Lack of Advanced Insights: Existing systems treat items as simple listings. They lack database-level analytics to understand reuse patterns, detect fraud through peer reviews, optimize group purchases, or predict inventory needs tied to the academic calendar.
Proposed System
The proposed system, CampusKart, provides a centralized, secure, and student-only platform. It leverages the relational database as its core "hero" to deliver advanced, hyper-local features that large-scale platforms cannot.
Core Features:
Institutional Verification: Ensures a closed, trusted ecosystem by requiring all users to register and verify via their official college email.
Focused Marketplace: Strictly limits listings to academic and campus-related items, eliminating irrelevant commercial clutter.
Database-Enforced Integrity: Employs a highly normalized design with constraints and ACID properties to ensure all transaction data is consistent, reliable, and atomic.
Advanced SQL-Driven Innovations: Unlike generic CRUD applications, CampusKart uses advanced SQL features to create tangible value and insights:
Sustainability Reuse Scoring: The system actively tracks the lifecycle of an item. Using SQL window functions (e.g., ROW_NUMBER()) and triggers, it calculates a "reuse score" for products and users, gamifying participation in the circular economy. This provides quantifiable eco-impact metrics that platforms like OLX ignore.
Dynamic Group Buy Optimizer: A new module will allow students to pool resources for common items (e.g., lab coats, textbooks). Using Stored Procedures and PIVOT queries, the system can manage group thresholds, auto-prorate costs, and notify users, directly reducing costs for students.
Predictive Inventory Alerts: The system uses SQL analytical functions (e.g., LAG/LEAD) to analyze historical transaction data against the academic calendar. A Materialized View (e.g., LowStockAlert) will refresh periodically to forecast demand for critical items (like calculators before exams) and alert potential sellers, optimizing resource availability.

Relational Database Structure
The system's backbone is a relational database (e.g., PostgreSQL) designed in 3rd Normal Form (3NF) to ensure data integrity and eliminate redundancy. It utilizes Foreign Key constraints with ON DELETE and ON UPDATE cascade rules to maintain referential integrity.
Core Entities:
Users – Registered student accounts
Products – Items listed for sale
Orders – Records of completed purchases
Wishlist – Items saved by users
Product_Location – Predefined pickup locations
Product_Image – Multiple image URLs per product
Product_Specification – Key–value specifications for products

Analytical & Future Extension Entities (Conceptual):
ReuseHistory (derived from Orders)
GroupBuys (collaborative purchase model)

RDBMS AND NoSQL Integration
The database schema is normalized up to Third Normal Form (3NF):
Multivalued attributes (images, locations) are decomposed into separate relations
Composite attributes are decomposed into atomic attributes or key–value tables
Redundancy is minimized while preserving data integrity


Societal Concern
This project directly addresses key societal concerns by leveraging database technology as an innovative infrastructure, aligning with UN Sustainable Development Goal 9 (SDG9: Industry, Innovation, and Infrastructure).
Sustainability: Encouraging reuse of academic resources
Digital Safety: Verified campus-only ecosystem
Economic Accessibility: Reduced costs through reuse and future collaborative purchasing
Recent Technological Trends: The project's innovation lies not in "black-box" AI but in the powerful application of Advanced SQL Analytics (Window Functions, Recursive CTEs, Materialized Views) to derive complex insights, predictions, and trust metrics directly from the relational data.


