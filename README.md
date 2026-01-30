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

> **Important**: If you have Node.js v16 or lower, please upgrade to v18+ before proceeding.

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

> **Note**: This may take a few minutes to download all packages.

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 4: Create Backend Environment File

Navigate to the `backend` directory and create `.env` from the example:

```bash
cd ../backend
```

**Option 1 - Copy the example file (Recommended):**

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

**Option 2 - Create manually:**

Create a file named `.env` in the `backend` directory with the following content:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=campuskart

# Server Configuration
PORT=3000

# Optional: MongoDB (for future chat features)
# MONGO_URI=mongodb://localhost:27017/campuskart
```

> **Important**: 
> - Replace `your_mysql_password_here` with your actual MySQL root password
> - Do not use quotes around the password
> - If your MySQL runs on a different port, update `DB_PORT`

### Step 5: Create Frontend Environment File (Optional)

Navigate to the `frontend` directory:

```bash
cd ../frontend
```

**Copy the example file:**

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

This creates a `.env` file with:

```env
VITE_API_URL=http://localhost:3000
```

> **Note**: This step is optional. The frontend will default to `http://localhost:3000` if not set.

### Step 6: Database Setup

**6.1: Start MySQL Server**

Make sure your MySQL server is running:

```bash
# Windows
net start MySQL80

# Linux
sudo service mysql start

# Mac
brew services start mysql
```

**6.2: Test MySQL Connection**

Verify you can connect to MySQL:

```bash
mysql -u root -p
```

Enter your password. If successful, you'll see the MySQL prompt. Type `EXIT;` to close.

**6.3: Create Database**

```bash
mysql -u root -p -e "CREATE DATABASE campuskart;"
```

Or log in first and then create:

```bash
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE campuskart;
EXIT;
```

**6.4: Run Migrations**

From the **project root directory** (the `campus_kart` folder), run these commands in sequence:

```bash
# Navigate to project root if not already there
cd ..

# Run migrations in order (you'll be prompted for MySQL password each time)
mysql -u root -p campuskart < database/schema.sql
mysql -u root -p campuskart < database/seed.sql
mysql -u root -p campuskart < database/otp_tokens_migration.sql
mysql -u root -p campuskart < database/location_migration.sql
mysql -u root -p campuskart < database/reschedule_migration.sql
mysql -u root -p campuskart < database/gamification_migration.sql
```

> **Windows Users**: If you get "command not found", use the full path:
> ```powershell
> & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql" -u root -p campuskart < database/schema.sql
> ```

> **Tip**: Enter your MySQL password when prompted for each command (6 times total).

**6.5: Verify Database Setup**

Log into MySQL and verify tables were created:

```bash
mysql -u root -p campuskart
```

Run this SQL command:

```sql
SHOW TABLES;
```

You should see **exactly 13 tables**:

```
+----------------------+
| Tables_in_campuskart |
+----------------------+
| add_to_wishlist      |
| badges               |
| otp_tokens           |
| prod_img             |
| prod_loc             |
| prod_spec            |
| product_seller       |
| products             |
| proposed_locations   |
| reschedule_requests  |
| transaction          |
| user_badges          |
| user_ratings         |
| users                |
+----------------------+
```

Verify the structure of key tables:

```sql
DESCRIBE users;
DESCRIBE products;
DESCRIBE badges;
```

Check that seed data loaded successfully:

```sql
SELECT COUNT(*) FROM users;      -- Should show at least 1 user
SELECT COUNT(*) FROM products;   -- Should show sample products
SELECT COUNT(*) FROM badges;     -- Should show 3 badges
```

Type `EXIT;` when done.

---

## 🏃 Running the Application

### Step 7: Start the Backend Server

Open a terminal window and run:

```bash
cd backend
npm start
```

**You should see:**

```
Server running on port 3000
MySQL database connected successfully
Cleanup job scheduled: Runs every 5 minutes
```

> **Backend URL**: http://localhost:3000

**Leave this terminal running.** Do not close it.

### Step 8: Start the Frontend Server

Open a **NEW terminal window** and run:

```bash
cd frontend
npm run dev
```

**You should see:**

```
VITE v6.0.8  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

> **Frontend URL**: http://localhost:5173

**Leave this terminal running** as well.

### Step 9: Open the Application

Open your web browser and navigate to:

```
http://localhost:5173
```

You should see the CampusKart login page! 🎉

---

## 🌐 Port Configuration

| Service | Default Port | URL | Purpose |
|---------|--------------|-----|---------|
| **Backend API** | 3000 | http://localhost:3000 | Express server |
| **Frontend App** | 5173 | http://localhost:5173 | React application |
| **MySQL** | 3306 | N/A | Database connection |

### Verifying Services are Running

**Backend Check:**

Visit http://localhost:3000 in your browser. You should see a response or API status message.

Or use curl/PowerShell:

```bash
# Linux/Mac
curl http://localhost:3000

# Windows PowerShell
Invoke-WebRequest http://localhost:3000
```

**Frontend Check:**

Visit http://localhost:5173 in your browser to see the React application.

**Database Check:**

```bash
mysql -u root -p -e "USE campuskart; SELECT COUNT(*) FROM users;"
```

---

## 📝 Environment Variables Reference

### Backend `.env` File

Location: `backend/.env`

```env
# Database Configuration
DB_HOST=127.0.0.1           # MySQL host address
DB_PORT=3306                # MySQL port (default: 3306)
DB_USER=root                # MySQL username
DB_PASSWORD=your_password   # MySQL password (NO QUOTES)
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

> **Note**: Environment variables prefixed with `VITE_` are accessible in the frontend code.

---

## 🗄️ Database Structure

### Core Tables

- `users` - User accounts and profiles
- `products` - Product listings
- `product_seller` - Links products to sellers
- `transaction` - Purchase records and order tracking
- `add_to_wishlist` - User wishlists

### Product Metadata

- `prod_spec` - Product specifications (key-value pairs)
- `prod_img` - Product image URLs
- `prod_loc` - Available pickup locations

### Exchange Workflow

- `otp_tokens` - OTP generation and verification
- `proposed_locations` - Seller-proposed meeting spots
- `reschedule_requests` - Reschedule coordination

### Gamification

- `badges` - Available badge types (First Trade, Trusted User, Power Seller)
- `user_badges` - User-earned badges
- `user_ratings` - Transaction ratings and reviews

### Migration Order

**Always run migrations in this exact order:**

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

# Re-run all migrations from project root
mysql -u root -p campuskart < database/schema.sql
mysql -u root -p campuskart < database/seed.sql
mysql -u root -p campuskart < database/otp_tokens_migration.sql
mysql -u root -p campuskart < database/location_migration.sql
mysql -u root -p campuskart < database/reschedule_migration.sql
mysql -u root -p campuskart < database/gamification_migration.sql
```

---

## 🐛 Common Errors & Fixes

### 1. Wrong Node Version

**Error Message:**
```
error:0308010C:digital envelope routines::unsupported
```

**Fix:**
Upgrade to Node.js v18 or higher:
```bash
node --version  # Check current version
```
Download Node.js v18+ from https://nodejs.org/

### 2. MySQL Connection Error

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Fixes:**
- **Step 1**: Ensure MySQL server is running:
  ```bash
  # Windows
  net start MySQL80
  
  # Linux
  sudo service mysql start
  
  # Mac
  brew services start mysql
  ```

- **Step 2**: Test connection:
  ```bash
  mysql -u root -p
  ```

- **Step 3**: Verify `.env` credentials match your MySQL setup
- **Step 4**: Check `DB_HOST` is set to `127.0.0.1` (not `localhost` if having issues)
- **Step 5**: Verify `DB_PORT=3306` in `.env`

### 3. Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Option 1: Change the port**

Edit `backend/.env`:
```env
PORT=3001
```

Also update `frontend/.env` (if it exists):
```env
VITE_API_URL=http://localhost:3001
```

Then restart both servers.

**Option 2: Kill the process using the port**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### 4. Missing .env File

**Error Message:**
```
Cannot read property 'DB_HOST' of undefined
```

**Fix:**
Create `backend/.env` file as described in Step 4. Copy from `.env.example`:

```bash
cd backend
# Windows
Copy-Item .env.example .env
# Linux/Mac
cp .env.example .env
```

Then edit the file and set your MySQL password.

### 5. Node Modules Not Installed

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

### 6. Database Does Not Exist

**Error Message:**
```
Error: ER_BAD_DB_ERROR: Unknown database 'campuskart'
```

**Fix:**
```bash
mysql -u root -p -e "CREATE DATABASE campuskart;"
```

Then re-run all migrations from Step 6.4.

### 7. Migration Errors

**Error Message:**
```
ERROR 1050 (42S01): Table 'users' already exists
```

**Fix:**

This happens if you run migrations multiple times. Two options:

- **Option 1**: Ignore and continue (migrations are designed to handle this)
- **Option 2**: Reset the database completely:
  ```bash
  mysql -u root -p -e "DROP DATABASE campuskart; CREATE DATABASE campuskart;"
  ```
  Then re-run all migrations.

### 8. Frontend Shows Blank Page

**Troubleshooting Steps:**

1. Open browser console (Press **F12**)
2. Look for red error messages
3. Verify backend is running:
   - Open http://localhost:3000 in another tab
   - Should see API response, not "connection refused"
4. Check `VITE_API_URL` in `frontend/.env` (if it exists):
   - Should be `http://localhost:3000` (no trailing slash)
5. Clear browser cache:
   - Press **Ctrl + Shift + Delete**
   - Clear cached images and files
6. Ensure you're accessing `http://localhost:5173`, NOT `http://localhost:3000`

### 9. CORS Errors

**Error Message (in browser console):**
```
Access to fetch at 'http://localhost:3000' has been blocked by CORS policy
```

**Fix:**

The backend already includes CORS middleware. Ensure:

1. Backend is running on port 3000
2. You're accessing frontend via `http://localhost:5173`
3. `VITE_API_URL` uses `http` (not `https`)
4. Both servers are running

**If still failing**, restart both servers:
```bash
# Terminal 1
cd backend
npm start

# Terminal 2
cd frontend
npm run dev
```

### 10. MySQL Command Not Found

**Error Message:**
```
'mysql' is not recognized as an internal or external command
```

**Fix (Windows):**

Use the full path to MySQL:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql" -u root -p
```

Or add MySQL to your PATH environment variable.

**Fix (Linux/Mac):**

Install MySQL client tools:
```bash
# Ubuntu/Debian
sudo apt-get install mysql-client

# Mac
brew install mysql-client
```

---

## 🧪 Testing the Application

### Quick Test Checklist

After setup, verify everything works:

- [ ] Backend running on http://localhost:3000
- [ ] Frontend running on http://localhost:5173
- [ ] Can see login page
- [ ] MySQL has 14 tables
- [ ] No errors in browser console (F12)
- [ ] No errors in backend terminal

### Basic User Flow

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

1. Open **two browser windows** (or one regular + one incognito)
2. **Window 1 (Seller)**: Create an account and log in
3. **Window 1**: Create a product listing
4. **Window 2 (Buyer)**: Create a different account and log in
5. **Window 2**: Find and reserve the product
6. **Window 1**: Navigate to dashboard, propose meeting locations
7. **Window 2**: Select a location, generate OTP
8. **Window 1**: Enter OTP to verify and mark as sold
9. **Both windows**: Verify status updates in dashboards
10. **Both windows**: Check that trust scores and badges were awarded

---

## 📂 Project Structure

```
campus_kart/
│
├── backend/                    # Express API server
│   ├── src/
│   │   ├── app.js             # Entry point
│   │   ├── db/
│   │   │   └── index.js       # MySQL connection pool
│   │   ├── controllers/       # Business logic
│   │   │   ├── authController.js
│   │   │   ├── productsController.js
│   │   │   ├── transactionsController.js
│   │   │   ├── otpController.js
│   │   │   └── gamificationController.js
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth middleware
│   │   ├── services/          # Gamification service
│   │   └── jobs/              # Background cleanup jobs
│   ├── .env                   # Environment variables (create this)
│   ├── .env.example           # Environment template
│   └── package.json
│
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── App.jsx            # Main component
│   │   ├── api.js             # API client functions
│   │   ├── context/           # React context providers
│   │   ├── pages/             # Page components
│   │   └── components/        # Reusable UI components
│   ├── .env                   # Frontend config (optional)
│   ├── .env.example           # Environment template
│   ├── vite.config.js         # Vite configuration
│   └── package.json
│
├── database/                   # SQL migration scripts
│   ├── schema.sql             # Base schema (run 1st)
│   ├── seed.sql               # Sample data (run 2nd)
│   ├── otp_tokens_migration.sql      # (run 3rd)
│   ├── location_migration.sql        # (run 4th)
│   ├── reschedule_migration.sql      # (run 5th)
│   └── gamification_migration.sql    # (run 6th)
│
└── README.md                   # This file
```

---

## 📞 Support & Contribution

### GitHub Repository
https://github.com/kushalgowdac/campus_kart

### Getting Help

**Before asking for help**, check:

1. ✅ This README for common issues
2. ✅ Code comments in source files
3. ✅ Browser console (F12) for client-side errors
4. ✅ Backend terminal for server-side errors
5. ✅ MySQL is running: `mysql -u root -p`
6. ✅ Node version is v18+: `node --version`
7. ✅ Both `.env` files are created and configured

### Reporting Issues

When reporting issues, include:

- Operating system (Windows/Mac/Linux)
- Node.js version (`node --version`)
- MySQL version (`mysql --version`)
- Error message (full text)
- What step you're on
- Terminal output (if applicable)

---

## 📄 License

ISC License

---

**Built with ❤️ for the RVCE campus community**

**Last Updated**: January 30, 2026

---

## Quick Start Reminder

```bash
# 1. Clone
git clone https://github.com/kushalgowdac/campus_kart.git
cd campus_kart

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Setup .env files
cd ../backend
cp .env.example .env  # Edit and set MySQL password
cd ../frontend
cp .env.example .env  # Optional

# 4. Create database
mysql -u root -p -e "CREATE DATABASE campuskart;"

# 5. Run migrations (from project root)
cd ..
mysql -u root -p campuskart < database/schema.sql
mysql -u root -p campuskart < database/seed.sql
mysql -u root -p campuskart < database/otp_tokens_migration.sql
mysql -u root -p campuskart < database/location_migration.sql
mysql -u root -p campuskart < database/reschedule_migration.sql
mysql -u root -p campuskart < database/gamification_migration.sql

# 6. Start servers (2 separate terminals)
# Terminal 1:
cd backend && npm start

# Terminal 2:
cd frontend && npm run dev

# 7. Open http://localhost:5173
```
