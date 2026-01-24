# CampusKart 🛒

A campus-based peer-to-peer marketplace for buying and selling used items among students.

## 1. Project Overview
- **CampusKart** is a full-stack marketplace where students list single-unit products, coordinate meetups, and complete sales using OTP verification.
- **Tech stack**: React (Vite) frontend, Node.js + Express backend, MySQL primary database (MongoDB optional for chat).
- **Signature capabilities**:
  - Product listing, filtering, and wishlist-driven marketplace
  - OTP-based in-person exchange verification with automatic expiry cleanup
  - Location proposal/selection workflow prior to OTP generation
  - Unified dashboard tabs: `My Listings`, `Sold Items`, `My Purchases`
  - Secure reservation lifecycle with background jobs that reset stale flows

## 2. Prerequisites
- Node.js **v18+** (includes npm)
- MySQL Server 8.x (or compatible)
- Git
- npm CLI (bundled with Node, but list explicitly for clarity)

## 3. Project Setup Instructions

### Step 1 – Clone Repository
```bash
git clone https://github.com/kushalgowdac/campus_kart.git
cd campus_kart
```

### Step 2 – Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (in a second terminal)
cd ../frontend
npm install
```

### Step 3 – Database Setup
1. Create a database (e.g., `campuskart`).
2. From the project root, import the SQL files under `database/` in roughly this order:
	- `schema.sql` – base tables
	- `seed.sql` – optional starter data
	- `otp_tokens_migration.sql` – OTP table
	- `location_migration.sql` – location workflow
	- `reschedule_migration.sql` – reschedule support (if present)
	- Any other migration file provided in the folder
3. Example MySQL command:
	```bash
	mysql -u root -p campuskart < database/schema.sql
	```

### Step 4 – Environment Variables
Create `backend/.env` with your database credentials and desired ports:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campuskart
MONGO_URI=
```
> Leave `MONGO_URI` blank if you are not using MongoDB chat features.

If you want to pin the frontend to the backend URL, create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```

### Step 5 – Start Servers
```bash
# Backend
cd backend
npm start   # http://localhost:3000

# Frontend (new terminal)
cd frontend
npm run dev # http://localhost:5173
```

## 4. How To Use The App (Basic Flow)
1. Login as a buyer, browse listings, and reserve a product.
2. Seller proposes meeting locations; buyer selects one.
3. Buyer generates the OTP after location confirmation.
4. Seller verifies the OTP to finalize the sale; status flips to `sold`.
5. Dashboards update automatically: sellers see sales, buyers see purchases.

## 5. Running In Two Browsers (Buyer + Seller)
- Open two separate browsers (or one browser + incognito window).
- Log in as different users (e.g., buyer in one, seller in the other).
- Walk through the flow above to simulate real exchanges end-to-end.

## 6. Common Issues & Fixes
- **Refresh sends you to login** → Ensure localStorage still contains `campuskart_user`; log in again if cleared.
- **MySQL errors** → Double-check that every migration in `database/` was run and that `.env` credentials are valid.
- **Port already in use** → Change `PORT` in `backend/.env` (and `VITE_API_URL` if set) or free the port.

## 7. Folder Structure Overview
- `backend/` → Express app, routes, controllers, jobs, middleware, and database connectors.
- `frontend/` → React + Vite SPA (components, pages, API client, styles).
- `database/` → SQL schema, seed data, and migrations for OTP, locations, rescheduling, etc.
- See the detailed tree later in this README for deeper context.

## 📖 Quick Links

- **GitHub Repository:** https://github.com/kushalgowdac/campus_kart.git
- **Project Progress:** See [PROGRESS.md](PROGRESS.md) for current status and what's completed
- **Task List:** See [FRONTEND_TASKS.md](FRONTEND_TASKS.md) for frontend development tasks
- **Requirements:** See [REQUIREMENTS.md](REQUIREMENTS.md) for detailed specifications

---

## 🎯 Project Status

| Component | Status | Coverage |
|-----------|--------|----------|
| **Database Schema** | ✅ Complete | 100% - Ready for use |
| **Backend API** | 🔄 In Progress | 80% - Routes/Controllers need completion |
| **Frontend** | 🔄 In Progress | 40% - Basic setup done, pages needed |
| **Testing** | ⏳ Not Started | 0% - To be done |

See [PROGRESS.md](PROGRESS.md) for detailed breakdown.

---

## 🏗️ Architecture

### Database (MySQL)
- Users, Products, Transactions, Wishlist
- Product metadata (specs, images, locations)
- ER diagram compliant schema
- Enforced constraints and relationships

### Backend (Node.js + Express)
- RESTful API endpoints
- Database connection pooling
- MongoDB for chat (optional)
- Organized routes and controllers

### Frontend (React + Vite)
- Modern SPA architecture
- Component-based UI
- API integration layer
- Real-time updates ready

---

## 🚀 Getting Started

### Prerequisites
```bash
- Node.js 16+ 
- MySQL 8.x (local or remote)
- Git
```

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campuskart
MONGODB_URI=mongodb://localhost:27017/campuskart
EOF

# Initialize database
mysql -u root -p < ../database/schema.sql

# Start server
npm start
```

**Verify:** `curl http://localhost:3000/` (should return "CampusKart API is running")

### Frontend Setup

```bash
cd frontend
npm install

# Create .env (if needed)
# VITE_API_URL=http://localhost:3000/api

# Start dev server
npm run dev
```

**Access:** http://localhost:5173 (or port shown in terminal)

---

## 📚 Database Schema

### Core Tables
- **users** - User profiles (uid, name, email, password)
- **products** - Product listings (pid, pname, category, price, status, etc.)
- **product_seller** - Maps products to sellers
- **transaction** - Purchase records
- **add_to_wishlist** - Wishlist entries

### Metadata Tables
- **prod_spec** - Product specifications (key-value pairs)
- **prod_img** - Product image URLs
- **prod_loc** - Pickup locations

See [database/schema.sql](database/schema.sql) for complete schema.

---

## 🔗 API Routes

### Base URL: `/api`

| Resource | Endpoints | Status |
|----------|-----------|--------|
| Users | `GET/POST/PUT/DELETE /users` | 🔄 Partial |
| Products | `GET/POST/PUT/DELETE /products` | 🔄 Partial |
| Product Specs | `GET/POST /product-specs` | 🔄 Partial |
| Product Images | `GET/POST /product-images` | 🔄 Partial |
| Product Locations | `GET/POST /product-locations` | 🔄 Partial |
| Wishlist | `GET/POST/DELETE /wishlist` | 🔄 Partial |
| Transactions | `GET/POST /transactions` | 🔄 Partial |
| Chats | `GET/POST /chats` | 🔄 Partial |

See backend controller files for current implementation.

---

## 📁 Project Structure

```
CampusKart/
├── backend/                           # Express API server
│   ├── src/
│   │   ├── app.js                    # Entry point
│   │   ├── db/
│   │   │   ├── index.js              # MySQL pool
│   │   │   └── mongo.js              # MongoDB connection
│   │   ├── controllers/              # Business logic
│   │   ├── routes/                   # API endpoints
│   │   └── models/                   # Data models
│   └── package.json
│
├── frontend/                          # React Vite app
│   ├── src/
│   │   ├── App.jsx                   # Main component
│   │   ├── api.js                    # API client
│   │   └── styles.css                # Global styles
│   ├── index.html
│   └── package.json
│
├── database/                          # SQL scripts
│   ├── schema.sql                    # Database schema
│   ├── seed.sql                      # Sample data
│   └── ...
│
├── PROGRESS.md                        # ⭐ Current status & next steps
├── REQUIREMENTS.md                    # Functional requirements
├── FRONTEND_TASKS.md                  # Frontend development tasks
└── README.md                          # This file
```

---

## ✨ Key Features (Roadmap)

### ✅ Completed
- Database schema (MySQL)
- Express API scaffolding
- React project setup
- Environment configuration

### 🔄 In Progress
- API controller implementations
- Frontend pages and components
- Authentication & authorization
- Form validation

### ⏳ Not Started
- Comprehensive testing
- Production deployment config
- CI/CD pipeline
- API documentation (Swagger)

---

## 🛠️ Development Workflow

### Adding a New Endpoint

1. **Create Route Handler** → `backend/src/routes/resource.js`
2. **Create Controller Logic** → `backend/src/controllers/resourceController.js`
3. **Add Database Queries** → Use MySQL pool from `db/index.js`
4. **Register Route** → Import in `app.js`

### Adding a Frontend Page

1. **Create Component** → `frontend/src/pages/ResourcePage.jsx`
2. **Add API Call** → Use functions from `api.js`
3. **Add Route** → Update app routing (when React Router is added)
4. **Style Components** → Use global `styles.css` or component CSS

---

## 🔒 Important Notes

### Database
- ✅ Follow the ER diagram strictly
- ✅ All tables and relationships are predefined
- ✅ Do NOT modify schema without team discussion
- ✅ Use transactions for multi-step operations

### API
- Use async/await for database operations
- Always validate and sanitize inputs
- Follow REST conventions
- Return meaningful error messages

### Frontend
- Use React best practices
- Keep components small and reusable
- Handle loading and error states
- Mobile-responsive design

---

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=campuskart
MONGODB_URI=mongodb://localhost:27017/campuskart
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🤝 Team Handoff

This project is ready for the next developer. All groundwork is in place:

1. **Database** is fully designed and ready
2. **Backend routes** are scaffolded and awaiting controller implementation
3. **Frontend** is initialized with build tooling ready

**Next developer focus:**
- Complete backend controller functions
- Build React components and pages
- Integrate frontend with API
- Add authentication
- Comprehensive testing

See [PROGRESS.md](PROGRESS.md) for detailed next steps.

---

## 🚀 Commands

### Backend
```bash
cd backend
npm install    # Install dependencies
npm start      # Start server (port 3000)
npm test       # Run tests (when added)
```

### Frontend
```bash
cd frontend
npm install    # Install dependencies
npm run dev    # Start dev server (port 5173)
npm run build  # Build for production
npm run preview # Preview production build
```

### Database
```bash
# Initialize
mysql -u root -p < database/schema.sql

# Seed data
mysql -u root -p campuskart < database/seed.sql
```

---

## 📞 Support & Questions

Refer to:
- [PROGRESS.md](PROGRESS.md) - For current status and detailed next steps
- [REQUIREMENTS.md](REQUIREMENTS.md) - For functional requirements
- [FRONTEND_TASKS.md](FRONTEND_TASKS.md) - For frontend development guide

---

## 📄 License

ISC License - See LICENSE file (if included)

---

**Built with ❤️ for the campus community**

Last Updated: January 21, 2026
