# Device History Log

This file tracks **local development progress** for CampusKart. Update this file after meaningful work so the team can see what changed, when, and why.

## How to Update
Add a new entry under **Log** with:
- Date (YYYY-MM-DD)
- What was done
- Files touched
- Next steps / follow-ups

---

## Log

### 2026-02-03 (Latest)
**Summary**
- Implemented comprehensive transaction notification and trust penalty system.
- Added dynamic badge resolution eliminating user_badges table sync issues.
- Built notification dot system with real-time polling for reservations.
- Implemented robust image fallback strategy with local placeholder.
- Enhanced UI/UX across seller dashboard, navbar, community, and home pages.
- Established grace-count cancellation tracking and post-OTP dispute flow.

**Major Features Implemented**

1. **Reservation Notification System**
   - Seller notifications when buyer cancels reservation (localStorage tracking)
   - Clear stale transaction messages (status-based useEffect clearing)
   - Seller waiting messages during location_proposed phase
   - Notification dots on navbar (Home/Dashboard links) with 30s polling
   - Cart notification dot on Home page
   - Dots positioned at top-right corner with nav-dot--corner class

2. **Trust Penalty & Dispute System**
   - Pre-OTP cancellation tracking with grace count (GRACE_CANCELLATIONS = 2)
   - Trust point penalty (-5 points) after exceeding grace count
   - Post-OTP dispute flow (blocks cancel button, requires reason)
   - Database schema: reservation_cancellations, disputes tables
   - Migration applied: database/reservation_dispute_migration.sql

3. **Dynamic Badge System**
   - Eliminated user_badges table for real-time computation
   - Dynamic badge resolver (resolveDynamicBadges) querying transactions/cancellations/disputes
   - BADGE_CATALOG with seller/buyer/transaction badges
   - Badge locking UI with grayscale filter and category labels
   - Removed duplicate achievements tab from SellerDashboard

4. **Image Handling System**
   - Created local product-placeholder.svg asset
   - onError fallback implemented across ProductCard, ProductDetails, SellerDashboard, Admin
   - Replaced external placeholder URLs with local asset
   - Admin modal spec styling normalized (consistent flex layout)

5. **UI/UX Improvements**
   - Navbar active page highlighting with NavLink component
   - Reduced card heights (hero-card--compact: 88px min-height)
   - Hidden trust/badges/leaderboard in sell view (conditional rendering)
   - Top 3 leaderboard on Home page
   - Seller dashboard reorganization (removed duplicate achievements)

**Files Created**
- frontend/src/assets/product-placeholder.svg (local placeholder image)
- database/reservation_dispute_migration.sql (schema for cancellation/dispute tracking)

**Files Updated**
- frontend/src/pages/SellerDashboard.jsx
  - Added previousListingStateRef tracking status transitions
  - Implemented reservationNotice state for cancellation notifications
  - Removed achievements tab (duplicate of Community)
  - Added image fallback with productPlaceholder

- frontend/src/pages/ProductDetails.jsx
  - Fixed stale message clearing with status-based useEffect
  - Added seller waiting messages for location_proposed phase
  - Implemented image fallback with onError handler
  - Status-based info banners for transaction flow

- frontend/src/components/BuyerOTPDisplay.jsx
  - Replaced post-OTP cancel button with dispute flow
  - Added createDispute API call with reason textarea

- backend/src/services/gamificationService.js
  - Added RESERVATION_CANCEL_PENALTY constant
  - Implemented resolveDynamicBadges replacing static user_badges
  - Created BADGE_CATALOG with 12 badge definitions
  - Added safeCount helper for missing tables

- backend/src/controllers/productsController.js
  - cancelReservation with grace-count penalty tracking
  - createDispute endpoint for post-OTP disputes
  - reservation_cancellations insert with is_pre_otp flag

- backend/src/controllers/gamificationController.js
  - Using resolveDynamicBadges instead of user_badges queries
  - Real-time badge computation from transaction data

- backend/src/routes/products.js
  - Added POST /:id/dispute route

- frontend/src/api.js
  - Added createDispute helper function

- frontend/src/pages/Community.jsx
  - Badge locking UI with grayscale filter
  - Category labels (Seller Achievements, Buyer Achievements, Transaction Milestones)
  - Lock icon and "Unlock by..." text for locked badges

- frontend/src/components/Navbar.jsx
  - NavLink component for active page highlighting
  - useEffect polling loadAlerts every 30s
  - sellerAlertCount/buyerAlertCount states
  - nav-dot--corner notification dots on Home/Dashboard links

- frontend/src/pages/Home.jsx
  - Hidden trust/badges/leaderboard cards when view === "sell"
  - Cart notification dot with nav-dot--corner class
  - Top 3 leaderboard with fetchLeaderboard
  - BadgesRow component integration

- frontend/src/styles.css
  - Badge lock styling (filter: grayscale(1), opacity: 0.55)
  - nav-dot--corner positioning (position: absolute, top: 4px, right: 6px)
  - navbar__link, tab, ghost with position: relative
  - hero-card--compact with reduced min-height
  - admin-specs__item flex layout normalization

- frontend/src/components/ProductCard.jsx
  - Local placeholder fallback with useState for imgSrc
  - onError handler setting productPlaceholder

- frontend/src/pages/admin/ProductVerification.jsx
  - Image fallback for product images
  - Normalized spec item styling with admin-specs classes

**Database Schema Changes**
```sql
-- reservation_cancellations table
CREATE TABLE reservation_cancellations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  cancelled_by INT NOT NULL,
  is_pre_otp BOOLEAN DEFAULT TRUE,
  stage VARCHAR(50),
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(pid),
  FOREIGN KEY (cancelled_by) REFERENCES users(uid)
);

-- disputes table
CREATE TABLE disputes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  raised_by INT NOT NULL,
  reason TEXT,
  status ENUM('pending', 'resolved', 'escalated') DEFAULT 'pending',
  evidence_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(pid),
  FOREIGN KEY (raised_by) REFERENCES users(uid)
);
```

**Technical Implementation Details**

1. **Grace-Count Penalty Logic**
```javascript
// Count recent pre-OTP cancellations (90 days)
const [cancelCounts] = await pool.query(
  `SELECT COUNT(*) as count FROM reservation_cancellations 
   WHERE cancelled_by = ? AND is_pre_otp = TRUE 
   AND cancelled_at > DATE_SUB(NOW(), INTERVAL 90 DAY)`,
  [userId]
);

// Apply penalty after grace count
if (cancelCounts[0].count >= GRACE_CANCELLATIONS) {
  await gamificationService.addTrustPoints(
    userId,
    gamificationService.TRUST_POINTS.RESERVATION_CANCEL_PENALTY
  );
}
```

2. **Dynamic Badge Resolution**
```javascript
async function resolveDynamicBadges(uid) {
  const [completedSales] = await pool.query(
    `SELECT COUNT(*) as count FROM transactions WHERE sellerid = ?`,
    [uid]
  );
  
  const badges = [];
  if (completedSales[0].count >= 1) badges.push('first_sale');
  if (completedSales[0].count >= 5) badges.push('trusted_seller');
  // ... more badge checks
  
  return badges;
}
```

3. **Notification Dot Polling**
```javascript
useEffect(() => {
  const loadAlerts = async () => {
    const products = await fetchProducts();
    const sellerInProgress = products.filter(p => 
      p.sellerid === user?.uid && 
      ['reserved', 'location_proposed', 'location_selected', 'otp_generated'].includes(p.status)
    );
    setSellerAlertCount(sellerInProgress.length);
  };
  
  loadAlerts();
  const interval = setInterval(loadAlerts, 30000);
  return () => clearInterval(interval);
}, [user]);
```

4. **Image Fallback Strategy**
```javascript
const [imgSrc, setImgSrc] = useState(resolveImageUrl(product.image_url));

<img
  src={imgSrc}
  alt={product.pname}
  onError={() => setImgSrc(productPlaceholder)}
/>
```

**Configuration Requirements**
- GRACE_CANCELLATIONS = 2 (backend/src/controllers/productsController.js)
- Polling interval = 30000ms (frontend Navbar.jsx, Home.jsx)
- Trust penalty = -5 points (RESERVATION_CANCEL_PENALTY)
- Badge computation window = 90 days for cancellations/disputes

**Testing Checklist**
- [x] Seller sees notification when buyer cancels reservation
- [x] Stale messages cleared on status changes
- [x] Grace count allows 2 free cancellations
- [x] 3rd cancellation triggers -5 trust penalty
- [x] Post-OTP cancellation blocked, dispute flow shown
- [x] Badges computed dynamically from real transaction data
- [x] Locked badges shown with grayscale filter
- [x] Navbar highlights active page (Home vs Dashboard)
- [x] Notification dots appear for in-progress reservations
- [x] Cart notification dot shows when items in cart
- [x] Image fallback works across all product views
- [x] Admin modal shows normalized spec styling

**Next Steps / Future Enhancements**
- Consider adding badge for "product images uploaded" (demonstration requirement)
- Add dispute resolution workflow for admin dashboard
- Implement email notifications for cancellation alerts
- Add analytics dashboard for trust penalty trends
- Consider implementing dispute escalation to admin

---

### 2026-02-03
**Summary**
- Resolved admin login failures caused by invalid/placeholder bcrypt hashes.
- Made admin test data idempotent and aligned with admin schema for repeatable imports.
- Added safe admin login failure logging (email, IP, reason only).
- Relaxed admin users query validation to ignore undefined optional filters.

**Files updated**
- database/admin_migration.sql (idempotent index drops)
- database/admin_test_data.sql (upserts, correct schema columns, valid bcrypt hashes)
- backend/src/controllers/adminAuthController.js (safe login failure logging)
- backend/src/controllers/adminUsersController.js (fixed SQL escape)
- backend/src/routes/adminUsers.js (optional query validation)

**Resolution notes**
- Invalid credentials were due to placeholder bcrypt hashes (length 44) being stored.
- Updated admin hashes to a valid bcrypt hash for Admin@123 (length 60, $2b$10$ prefix).
- Verified login after restart with admin@rvce.edu.in / Admin@123.

---

### 2026-02-02
**Summary**
- Built admin dashboard UI (login, layout, overview, product verification, users, analytics, reports).
- Added admin routing with protected routes.
- Extended API client with admin endpoints and CSV download helpers.
- Added admin-specific styles for sidebar, tables, charts, and modals.

**Files created**
- frontend/src/components/admin/AdminLayout.jsx
- frontend/src/pages/admin/AdminLogin.jsx
- frontend/src/pages/admin/Dashboard.jsx
- frontend/src/pages/admin/ProductVerification.jsx
- frontend/src/pages/admin/UserManagement.jsx
- frontend/src/pages/admin/Analytics.jsx
- frontend/src/pages/admin/Reports.jsx

**Files updated**
- frontend/src/App.jsx
- frontend/src/api.js
- frontend/src/styles.css

**Notes**
- Admin auth uses localStorage key: adminToken.
- Admin routes are isolated under /admin/* and hide main navbar.

---

### 2026-02-02
**Summary**
- Implemented full admin backend API (auth, products verification, users, analytics, reports).
- Added admin JWT middleware with role checks and rate limits.
- Added validation for admin routes and sample request/response comments.
- Mounted new admin routes in backend app.

**Files created**
- backend/src/controllers/adminAuthController.js
- backend/src/controllers/adminProductsController.js
- backend/src/controllers/adminUsersController.js
- backend/src/controllers/adminAnalyticsController.js
- backend/src/controllers/adminReportsController.js
- backend/src/routes/adminAuth.js
- backend/src/routes/adminProducts.js
- backend/src/routes/adminUsers.js
- backend/src/routes/adminAnalytics.js
- backend/src/routes/adminReports.js
- backend/src/middleware/adminAuth.js

**Files updated**
- backend/src/app.js
- backend/src/controllers/adminUsersController.js (SQL safety for suspension)
- backend/src/controllers/adminAnalyticsController.js (caching TODO)
- TECHNICAL_REFERENCE.md (admin endpoints + auth requirements)

**Notes**
- Requires ADMIN_JWT_SECRET in backend environment.
- Login uses bcrypt and JWT; sensitive routes are rate-limited.
- Admin actions logged in admin_actions_log.

---

### 2026-02-02
**Summary**
- Designed complete admin system database schema.
- Added 6 new tables: admin_users, product_verification, admin_actions_log, user_suspensions, daily_stats, category_stats.
- Created comprehensive migration file with sample data, indexes, and idempotent design.
- Documented complete ER diagram showing admin-to-student table relationships.
- Fixed SQL syntax errors (removed WHERE clauses from CREATE INDEX - MySQL limitation).

**Files created**
- database/admin_migration.sql (complete migration with 460+ lines)
- database/ADMIN_ER_DIAGRAM.md (detailed ER documentation with ASCII diagrams)

**Files updated**
- TECHNICAL_REFERENCE.md (added admin API endpoints and updated schema diagram)

**Notes**
- Migration is idempotent (safe to run multiple times)
- Includes 3 sample admin accounts for testing
- Foreign keys link to existing products/users tables
- Analytics tables (daily_stats, category_stats) for dashboard performance
- Run AFTER schema.sql, rbac_migration.sql, gamification_migration.sql
- MySQL doesn't support partial indexes (WHERE clause), removed from index definitions

**Next steps**
- Build admin authentication endpoint (POST /api/admin/login)
- Build admin dashboard API endpoints (GET /api/admin/dashboard/stats)
- Build product verification API (PATCH /api/admin/products/:id/verify)
- Create React admin panel frontend (/admin route)
- Implement auto-flagging rules in backend (trust score < 20, suspicious keywords)

---

### 2026-02-02
**Summary**
- Added wishlist toggle state on product details.
- Unified hover styles for button-like class elements.

**Files touched**
- frontend/src/pages/ProductDetails.jsx
- frontend/src/styles.css

---

### 2026-02-02
**Summary**
- Blocked sellers from adding their own listings to wishlist.
- Blocked sellers from reserving their own listings.

**Files touched**
- backend/src/controllers/wishlistController.js
- backend/src/controllers/productsController.js

**Notes**
- Wishlist now validates product ownership before insert.
- Reserve flow now checks sellerid before reserving.

---

### 2026-02-02
**Summary**
- Implemented search-first marketplace layout, results header, and load-more pagination.
- Added upload success banner and listing highlight.
- Added ownership/status badges on product cards and improved navbar clarity.
- Updated RVCE-inspired color palette and filter panel styling.

**Files touched**
- frontend/src/pages/Home.jsx
- frontend/src/components/ProductCard.jsx
- frontend/src/components/Navbar.jsx
- frontend/src/components/SearchFilters.jsx
- frontend/src/styles.css

---

### 2026-02-02
**Summary**
- Removed leaderboard/badges toggle UI from home to reduce clutter.
- Simplified seller profile header to avoid marketplace hero styling.

**Files touched**
- frontend/src/pages/Home.jsx
- frontend/src/pages/SellerProfile.jsx
- frontend/src/styles.css

---

### 2026-02-02
**Summary**
- Moved badges and leaderboard to Dashboard → Achievements tab.
- Added achievements/leaderboard styles.

**Files touched**
- frontend/src/pages/SellerDashboard.jsx
- frontend/src/styles.css

---

### 2026-02-02
**Summary**
- Restored badges and leaderboard cards beside trust score on Home.

**Files touched**
- frontend/src/pages/Home.jsx
- frontend/src/styles.css

---

### 2026-02-02
**Summary**
- Capped trust score display at 100+ while keeping full meter for higher values.

**Files touched**
- frontend/src/pages/Home.jsx

---

### 2026-02-02
**Summary**
- Added Community page for leaderboard and badges catalog.
- Added badges catalog API endpoint.
- Expanded search input to fill available width.

**Files touched**
- backend/src/controllers/gamificationController.js
- backend/src/routes/gamification.js
- backend/src/services/gamificationService.js
- frontend/src/api.js
- frontend/src/pages/Community.jsx
- frontend/src/components/Navbar.jsx
- frontend/src/App.jsx
- frontend/src/styles.css

---

### 2026-02-02
**Summary**
- Added fallback badges catalog and resilient community page loading.

**Files touched**
- backend/src/controllers/gamificationController.js
- frontend/src/pages/Community.jsx

---

### 2026-02-02
**Summary**
- Community page now shows Leaderboard and Badges in separate tabs with per-section errors.

**Files touched**
- frontend/src/pages/Community.jsx

---

### 2026-02-02
**Summary**
- Applied updated UX shell to ProductDetails, Wishlist, and SellerDashboard.
- Added detail layout styling for ProductDetails.

**Files touched**
- frontend/src/pages/ProductDetails.jsx
- frontend/src/pages/Wishlist.jsx
- frontend/src/pages/SellerDashboard.jsx
- frontend/src/styles.css

---

### 2026-02-02
**Summary**
- Reused login/signup palette across app pages (background + hero + tabs).

**Files touched**
- frontend/src/styles.css

### 2026-02-02
**Summary**
- Synced to latest teammate changes and kept upstream version.
- Confirmed database migrations order and ran OTP + gamification migrations (MySQL Workbench).
- Backend and frontend servers started and verified locally.
- Updated seller listing to support multiple specifications.

**Files touched**
- frontend/src/pages/Home.jsx
- DEVICE_HISTORY.md

**Notes**
- If you see `otp_tokens` missing, re-run database/otp_tokens_migration.sql.
- Full migration order is in README.md.

---

### 2026-01-30
**Summary**
- README expanded with setup, migrations, and troubleshooting.
- Gamification system added (trust score, badges, ratings, leaderboard).

**Notes**
- Requires running database/gamification_migration.sql.
- Backend routes include /api/gamification.




<!-- to use migration into original schema -->
Get-Content .\database\admin_migration.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p campuskart





