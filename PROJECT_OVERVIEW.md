# Project Overview (in‑depth)

This file explains **what each part of the project does**, how the data flows, and how to talk about the system in interviews.

---

## 1) High‑Level Architecture
- **Frontend (React + Vite)**: UI, routing, API calls, auth state, and UI logic.
- **Backend (Node + Express)**: REST APIs, auth middleware, business rules, OTP + location workflow, gamification, and background jobs.
- **Database (MySQL)**: Persistent storage, relational integrity, and migrations.

---

## 2) Core User Journeys (System Flow)

### A. Listing Creation (Seller)
1. Seller logs in.
2. Seller creates a product listing with name, category, price, optional specs, and images.
3. Backend inserts into `products` and links seller via `product_seller`.
4. Product is now discoverable in marketplace.

### B. Wishlist (Buyer)
1. Buyer browses marketplace.
2. Buyer taps wishlist icon.
3. API stores entry in `add_to_wishlist`.

### C. Reservation → Location → OTP → Completion
1. Buyer reserves a product (`reserved_by` on `products`).
2. Seller proposes meeting locations (`proposed_locations`).
3. Buyer selects location (marks `prod_loc.is_selected`).
4. Buyer generates OTP (`otp_tokens`).
5. Seller verifies OTP, transaction is completed and product becomes `sold`.

### D. Reschedule
1. Either party requests reschedule.
2. Request is tracked in `reschedule_requests`.
3. Workflow is reset (locations + OTP invalidated) and a new location can be proposed.

### E. Gamification
1. After successful transaction, trust points and badges are updated.
2. Leaderboard ranks users by trust points.

---

## 3) Backend (Node + Express) – In Depth

### Entry + Middleware
- **backend/src/app.js**
	- Loads env, configures CORS + JSON parsing.
	- Uses global auth middleware.
	- Serves images from `/images`.
	- Mounts all API routes.

- **backend/src/middleware/auth.js**
	- Checks auth token or user identifier (depending on project flow).
	- Attaches user to request for protected endpoints.

### Database Connection
- **backend/src/db/index.js**
	- Creates and exports MySQL connection pool.

### Routes + Controllers (Feature Map)

#### Users
- **routes/users.js** → **controllers/usersController.js**
	- Register, login, list users, fetch profile details.

#### Products (core flow)
- **routes/products.js** → **controllers/productsController.js**
	- Create, list, search, update, delete products.
	- Reserve product, confirm meet, cancel, reschedule.
	- Manages status transitions (available → reserved → location_selected → otp_generated → sold).

#### Product Specs
- **routes/productSpecs.js** → **controllers/productSpecsController.js**
	- Create, list, and delete product specifications (`prod_spec`).

#### Product Images
- **routes/productImages.js** → **controllers/imagesController.js**
	- Store and list product images (`prod_img`).

#### Product Locations
- **routes/productLocations.js** → **controllers/productLocationsController.js**
	- Manage meeting locations (`prod_loc`).

#### Location Workflow
- **routes/locationRoutes.js** → **controllers/locationController.js**
	- Seller proposes locations and buyer selects location.

#### OTP Workflow
- **routes/otpRoutes.js** → **controllers/otpController.js**
	- OTP generation/verification for secure handoff (`otp_tokens`).

#### Transactions
- **routes/transactions.js** → **controllers/transactionsController.js**
	- Create and fetch transactions (`transaction`).

#### Wishlist
- **routes/wishlist.js** → **controllers/wishlistController.js**
	- Add/remove/list wishlist items (`add_to_wishlist`).

#### Chats (optional)
- **routes/chats.js** → **controllers/chatsController.js**
	- Chat endpoints (MongoDB optional).

#### Categories
- **routes/categories.js** → **controllers/categoriesController.js**
	- Category listing (for UI filters).

#### Orders
- **routes/orders.js** → **controllers/ordersController.js**
	- Order-related endpoints (if enabled in current flow).

#### Gamification
- **routes/gamification.js** → **controllers/gamificationController.js**
	- Trust points, badges, leaderboard, and user ratings.
	- Uses **services/gamificationService.js** for logic.

### Background Jobs
- **backend/src/jobs/otpCleanup.js**
	- Scheduled cleanup of expired OTP tokens.

---

## 4) Frontend (React + Vite) – In Depth

### Application Shell + Routing
- **frontend/src/App.jsx**
	- App layout + routing.
	- Protected routes for authenticated pages.
	- Includes navbar and chatbot globally.

### API Client
- **frontend/src/api.js**
	- Centralized fetch wrappers.
	- Exposes functions for products, wishlist, transactions, OTP, locations, and gamification.

### Auth + Global State
- **frontend/src/context/AuthContext.jsx**
	- Manages `currentUser`, auth state, and gamification info.

### Pages
- **frontend/src/pages/Home.jsx**
	- Main marketplace view.
	- Create listing form (seller).
	- Marketplace browsing, filters, wishlist toggle, leaderboard.
- **frontend/src/pages/ProductDetails.jsx**
	- Product detail view and full OTP/location workflow UI.
- **frontend/src/pages/SellerDashboard.jsx**
	- Seller management (listings, sales, reschedule actions).
- **frontend/src/pages/SellerProfile.jsx**
	- Seller profile and trust score display.
- **frontend/src/pages/Wishlist.jsx**
	- Wishlist items and quick navigation to products.
- **frontend/src/pages/Login.jsx**
	- Authentication entry.

### Components
- **Navbar.jsx**: top navigation and links.
- **ProductCard.jsx**: reusable product display card.
- **SearchFilters.jsx**: category + price filters.
- **BadgesRow.jsx**: gamification badges display.
- **BuyerLocationSelector.jsx**: buyer location selection UI.
- **SellerLocationProposal.jsx**: seller location proposal UI.
- **BuyerOTPDisplay.jsx**: buyer OTP view.
- **SellerOTPInput.jsx**: seller OTP verify UI.
- **Toast.jsx**: notifications.
- **Chatbot.jsx**: in‑app help chatbot.

---

## 5) Database (MySQL) – In Depth

### Core Tables
- **users**: user accounts and profiles.
- **products**: product listings + status + reservation fields.
- **product_seller**: product → seller relationship.
- **transaction**: completed purchases.
- **add_to_wishlist**: wishlist mapping.

### Product Metadata
- **prod_spec**: specifications (name/value pairs).
- **prod_img**: images (URL or filename).
- **prod_loc**: meeting locations and selection state.

### Workflow Tables
- **otp_tokens**: OTP data for secure exchange.
- **proposed_locations**: seller‑proposed locations.
- **reschedule_requests**: reschedule lifecycle tracking.

### Gamification
- **badges**: definitions of badges.
- **user_badges**: earned badges per user.
- **user_ratings**: ratings and reviews.

---

## 6) Migration Order (Important for Setup)
1. `schema.sql`
2. `seed.sql`
3. `otp_tokens_migration.sql`
4. `location_migration.sql`
5. `reschedule_migration.sql`
6. `gamification_migration.sql`

---

## 7) Talking Points (Interview)
- Designed a relational schema covering listing, wishlist, reservation, OTP, and gamification.
- Built Express controllers and routes that enforce business rules (status transitions, OTP lifecycle, reschedule). 
- Implemented client UI flows for both buyer and seller with clear state handling.
- Added trust score + badge system to incentivize reliable exchanges.
- Scheduled background cleanup to keep OTP tokens valid and secure.

---

## 8) Short Interview Pitch (Expanded)
"CampusKart is a full‑stack campus marketplace. I built a React frontend and a Node/Express backend with MySQL. Sellers can list items with specifications and images, buyers can wishlist and reserve products, and both users coordinate meetups via a location selection workflow. The exchange is verified using OTPs, and I added gamification with trust points and badges. The backend enforces state transitions, the frontend mirrors those flows, and a background job cleans up expired OTPs."

---

## 9) Detailed Technical Reference
See the professional‑style reference in [TECHNICAL_REFERENCE.md](TECHNICAL_REFERENCE.md).
