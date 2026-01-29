# CampusKart Marketplace 🛒

A secure campus-based peer-to-peer marketplace platform for RVCE students to buy and sell used items with built-in gamification, trust scoring, and OTP-verified exchanges.

---

## 📋 Project Overview

**CampusKart** is a full-stack marketplace application designed specifically for campus communities. Students can list single-unit products, coordinate in-person meetups, and complete secure exchanges using OTP verification.

### Main Features

- **User Authentication**: Secure login system with RVCE email validation
- **Product Listings**: Browse, search, and filter available products
- **Wishlist System**: Save favorite items for later
- **Location Selection**: Sellers propose meeting locations; buyers select preferred spots
- **OTP-Verified Exchange**: Generate and verify OTPs for secure in-person handoffs
- **Gamification System**: 
  - Trust score tracking based on successful transactions
  - Badge achievements (First Trade, Trusted User, Power Seller)
  - User ratings and reviews
  - Leaderboard rankings
- **Unified Dashboard**: View "My Listings", "Sold Items", and "My Purchases" in one place
- **Transaction Management**: Complete reservation lifecycle with automatic cleanup of stale flows

---

## 🛠️ Tech Stack

### Frontend
- **React** 18.3.1 - UI library
- **Vite** 6.0.8 - Build tool and dev server
- **React Router DOM** 7.12.0 - Client-side routing

### Backend
- **Node.js** v18+ - Runtime environment
- **Express** 5.2.1 - Web application framework
- **bcrypt** 6.0.0 - Password hashing
- **cors** 2.8.5 - Cross-origin resource sharing
- **dotenv** 17.2.3 - Environment variable management
- **mysql2** 3.16.0 - MySQL database driver

### Database
- **MySQL** 8.x - Primary relational database
- **Mongoose** 8.10.0 - MongoDB ODM (optional, for future chat features)

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **MySQL** 8.x ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** ([Download](https://git-scm.com/downloads))

To verify installations:

```bash
node --version    # Should be v18.x or higher
npm --version     # Comes with Node.js
mysql --version   # Should be 8.x
git --version
```

---

## 🚀 Setup Instructions

Follow these steps to get CampusKart running on your local machine.

### Step 1: Clone the Repository

```bash
git clone https://github.com/kushalgowdac/campus_kart.git
cd campus_kart
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 4: Create Backend Environment File

Navigate to the `backend` directory and create a `.env` file:

```bash
cd ../backend
```

Create a file named `.env` with the following content:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campuskart
PORT=3000
```

> **Important**: Replace `your_mysql_password` with your actual MySQL root password.

### Step 5: Create Frontend Environment File (Optional)

If you want to explicitly configure the API URL, create `frontend/.env`:

```bash
cd ../frontend
```

Create a file named `.env` with:

```env
VITE_API_URL=http://localhost:3000
```

> **Note**: This is optional. The frontend will default to `http://localhost:3000` if not set.

### Step 6: Database Setup

**6.1: Start MySQL Server**

Make sure your MySQL server is running. On Windows, check the Services app, or start it with:

```bash
net start MySQL80
```

**6.2: Create Database**

Open a MySQL terminal:

```bash
mysql -u root -p
```

Enter your password, then run:

```sql
CREATE DATABASE campuskart;
EXIT;
```

**6.3: Run Migrations**

From the project root directory, run these commands in order:

```bash
# Navigate to project root
cd c:\Users\harshith\Desktop\5th_sem\aiml\campus_kart

# Run migrations in sequence
mysql -u root -p campuskart < database/schema.sql
mysql -u root -p campuskart < database/seed.sql
mysql -u root -p campuskart < database/otp_tokens_migration.sql
mysql -u root -p campuskart < database/location_migration.sql
mysql -u root -p campuskart < database/reschedule_migration.sql
mysql -u root -p campuskart < database/gamification_migration.sql
```

> **Tip**: You'll be prompted for your MySQL password for each command.

**6.4: Verify Database Setup**

Log into MySQL and verify tables were created:

```bash
mysql -u root -p campuskart
```

```sql
SHOW TABLES;
```

You should see the following tables:
- `users`
- `products`
- `product_seller`
- `prod_spec`
- `prod_img`
- `prod_loc`
- `transaction`
- `add_to_wishlist`
- `otp_tokens`
- `proposed_locations`
- `reschedule_requests`
- `badges`
- `user_badges`
- `user_ratings`

Type `EXIT;` to close MySQL.

### Step 7: Start the Backend Server

Open a terminal window:

```bash
cd backend
npm start
```

You should see:

```
Server running on port 3000
MySQL database connected successfully
```

> **Backend URL**: http://localhost:3000

### Step 8: Start the Frontend Server

Open a **new terminal window**:

```bash
cd frontend
npm run dev
```

You should see:

```
VITE v6.0.8  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

> **Frontend URL**: http://localhost:5173

### Step 9: Open the Application

Open your browser and navigate to:

```
http://localhost:5173
```

You should see the CampusKart login page!

---

## 🌐 Running the App

### Port Configuration

| Service | Default Port | URL |
|---------|--------------|-----|
| **Backend API** | 3000 | http://localhost:3000 |
| **Frontend App** | 5173 | http://localhost:5173 |

### Confirming Backend is Running

Visit http://localhost:3000 in your browser. You should see a response or API status message.

Or use curl:

```bash
curl http://localhost:3000
```

### Confirming Frontend is Running

Visit http://localhost:5173 in your browser to see the React application.

---

## 📝 Environment Variables

### Backend `.env` File

Location: `backend/.env`

```env
# Database Configuration
DB_HOST=127.0.0.1           # MySQL host address
DB_PORT=3306                # MySQL port
DB_USER=root                # MySQL username
DB_PASSWORD=your_password   # MySQL password
DB_NAME=campuskart          # Database name

# Server Configuration
PORT=3000                   # Backend server port

# Optional: MongoDB (for future chat features)
# MONGO_URI=mongodb://localhost:27017/campuskart
```

### Frontend `.env` File (Optional)

Location: `frontend/.env`

```env
# API Configuration
VITE_API_URL=http://localhost:3000
```

---

## 🗄️ Database Setup

### Database Structure

CampusKart uses MySQL with the following key tables:

**Core Tables:**
- `users` - User accounts and profiles
- `products` - Product listings
- `product_seller` - Links products to sellers
- `transaction` - Purchase records and order tracking
- `add_to_wishlist` - User wishlists

**Product Metadata:**
- `prod_spec` - Product specifications (key-value pairs)
- `prod_img` - Product image URLs
- `prod_loc` - Available pickup locations

**Exchange Workflow:**
- `otp_tokens` - OTP generation and verification
- `proposed_locations` - Seller-proposed meeting spots
- `reschedule_requests` - Reschedule coordination

**Gamification:**
- `badges` - Available badge types
- `user_badges` - User-earned badges
- `user_ratings` - Transaction ratings and reviews

### Migration Order

Always run migrations in this exact order:

1. `schema.sql` - Creates base tables and relationships
2. `seed.sql` - Adds sample data for testing
3. `otp_tokens_migration.sql` - Adds OTP verification system
4. `location_migration.sql` - Adds location proposal workflow
5. `reschedule_migration.sql` - Adds reschedule functionality
6. `gamification_migration.sql` - Adds trust scores, badges, and ratings

### Resetting the Database

If you need to start fresh:

```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS campuskart; CREATE DATABASE campuskart;"

# Re-run all migrations
mysql -u root -p campuskart < database/schema.sql
mysql -u root -p campuskart < database/seed.sql
mysql -u root -p campuskart < database/otp_tokens_migration.sql
mysql -u root -p campuskart < database/location_migration.sql
mysql -u root -p campuskart < database/reschedule_migration.sql
mysql -u root -p campuskart < database/gamification_migration.sql
```

### Verifying Tables

```sql
-- Show all tables
USE campuskart;
SHOW TABLES;

-- Check table structure
DESCRIBE users;
DESCRIBE products;
DESCRIBE badges;

-- Verify seed data
SELECT * FROM users;
SELECT * FROM products;
SELECT * FROM badges;
```

---

## 🐛 Common Errors & Fixes

### 1. MySQL Connection Error

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Fixes:**
- Ensure MySQL server is running: `net start MySQL80` (Windows) or `sudo service mysql start` (Linux/Mac)
- Verify credentials in `backend/.env` match your MySQL setup
- Check that `DB_HOST` is set to `127.0.0.1` or `localhost`
- Test connection: `mysql -u root -p`

### 2. Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fixes:**
- **Option 1**: Change the port in `backend/.env`:
  ```env
  PORT=3001
  ```
  Also update `frontend/.env` if it exists:
  ```env
  VITE_API_URL=http://localhost:3001
  ```

- **Option 2**: Kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # Linux/Mac
  lsof -ti:3000 | xargs kill -9
  ```

### 3. Missing .env File

**Error Message:**
```
Cannot read property 'DB_HOST' of undefined
```

**Fix:**
Create `backend/.env` file as described in Step 4 of Setup Instructions.

### 4. Node Modules Not Installed

**Error Message:**
```
Error: Cannot find module 'express'
```

**Fix:**
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 5. Database Does Not Exist

**Error Message:**
```
Error: ER_BAD_DB_ERROR: Unknown database 'campuskart'
```

**Fix:**
```bash
mysql -u root -p -e "CREATE DATABASE campuskart;"
```

Then re-run all migrations from Step 6.3.

### 6. Migration Errors

**Error Message:**
```
ERROR 1050 (42S01): Table 'users' already exists
```

**Fix:**
This usually happens if you run migrations multiple times. Either:
- Continue (migrations are designed to be mostly idempotent), or
- Reset the database completely (see "Resetting the Database" section)

### 7. Frontend Shows Blank Page

**Possible Causes & Fixes:**
- Check browser console (F12) for errors
- Verify backend is running on port 3000
- Check `VITE_API_URL` in `frontend/.env` (if it exists)
- Clear browser cache and reload
- Ensure you're accessing `http://localhost:5173`, not `http://localhost:3000`

### 8. CORS Errors

**Error Message (in browser console):**
```
Access to fetch at 'http://localhost:3000' has been blocked by CORS policy
```

**Fix:**
The backend already includes CORS middleware. Ensure:
- Backend is running
- You're accessing frontend via `http://localhost:5173`
- `VITE_API_URL` points to `http://localhost:3000` (not https)

---

## 🧪 Testing the Application

### Basic Flow Test

1. **Register/Login**: Create an account or log in with seeded credentials
2. **Browse Products**: View available listings on the marketplace
3. **Add to Wishlist**: Save items you're interested in
4. **Reserve Product**: As a buyer, reserve an available item
5. **Propose Location**: As a seller, propose meeting locations
6. **Select Location**: As a buyer, choose a meeting spot
7. **Generate OTP**: Buyer generates OTP for exchange verification
8. **Verify OTP**: Seller verifies OTP to complete the transaction
9. **Check Dashboard**: View completed transactions in "My Purchases" or "Sold Items"
10. **Gamification**: Check trust score, earned badges, and leaderboard position

### Testing OTP Workflow End-to-End

For the best test, simulate both buyer and seller:

1. Open two browser windows (or one regular + one incognito)
2. Log in as different users in each window
3. In Seller window: Create a product listing
4. In Buyer window: Reserve the product
5. In Seller window: Navigate to dashboard, propose meeting locations
6. In Buyer window: Select a location, generate OTP
7. In Seller window: Enter OTP to verify and mark as sold
8. Verify status updates in both dashboards

---

## 📂 Project Structure

```
campus_kart/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── app.js             # Entry point
│   │   ├── db/
│   │   │   └── index.js       # MySQL connection pool
│   │   ├── controllers/       # Business logic
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── transactionController.js
│   │   │   ├── otpController.js
│   │   │   └── gamification.js
│   │   ├── routes/            # API endpoints
│   │   └── jobs/              # Background cleanup jobs
│   ├── .env                   # Environment variables (create this)
│   └── package.json
│
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── App.jsx            # Main component
│   │   ├── api.js             # API client functions
│   │   ├── pages/             # Page components
│   │   └── components/        # Reusable UI components
│   ├── .env                   # Frontend config (optional)
│   └── package.json
│
├── database/                   # SQL migration scripts
│   ├── schema.sql             # Base schema
│   ├── seed.sql               # Sample data
│   ├── otp_tokens_migration.sql
│   ├── location_migration.sql
│   ├── reschedule_migration.sql
│   └── gamification_migration.sql
│
└── README.md                   # This file
```

---

## 🔄 Optional: Seeding Sample Data

The `seed.sql` file already contains sample users and products. To add more:

1. Create test users:
```sql
INSERT INTO users (name, email, password) VALUES 
('Test User', 'test@rvce.edu.in', '$2b$10$hashedpassword');
```

2. Create test products:
```sql
INSERT INTO products (pname, category, price, status, preferred_for) VALUES 
('Test Product', 'Electronics', 999.99, 'available', 'all');
```

3. Link product to seller:
```sql
INSERT INTO product_seller (pid, sellerid) VALUES (LAST_INSERT_ID(), 1);
```

---

## 📞 Support & Contribution

### GitHub Repository
https://github.com/kushalgowdac/campus_kart

### Getting Help
- Check this README for common issues
- Review code comments in source files
- Check browser console (F12) for client-side errors
- Check backend terminal for server-side errors

---

## 📄 License

ISC License

---

**Built with ❤️ for the RVCE campus community**

Last Updated: January 29, 2026
