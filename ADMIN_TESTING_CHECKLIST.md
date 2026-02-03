# CampusKart Admin System - Testing Checklist

## 🎯 Purpose
This document provides a comprehensive manual testing checklist for the CampusKart admin dashboard. Follow this checklist before deploying the admin system to production.

---

## 1. 🔐 Admin Authentication

### ✅ Admin Login
- [ ] **Valid Credentials**: Log in with correct admin email and password
  - Expected: Redirect to `/admin/dashboard`, JWT token stored in localStorage
  - Verify: Token is present in localStorage as `adminToken`
  
- [ ] **Invalid Email**: Try logging in with non-existent email
  - Expected: Error message "Invalid email or password"
  - Verify: No token stored, user remains on login page
  
- [ ] **Invalid Password**: Use correct email but wrong password
  - Expected: Error message "Invalid email or password"
  - Verify: No brute-force attempts logged (check rate limiting)
  
- [ ] **Empty Fields**: Submit form with empty email or password
  - Expected: Client-side validation prevents submission
  - Verify: Helpful error messages displayed
  
- [ ] **Inactive Admin Account**: Log in with admin account where `is_active = 0`
  - Expected: Error message "Account is inactive"
  - Verify: Action logged in `admin_actions_log`

### ✅ Token Expiration
- [ ] **Expired Token**: Manually expire token (edit JWT or wait 24h)
  - Expected: Redirect to `/admin/login` on next API call
  - Verify: Error message "Session expired, please log in again"
  
- [ ] **Tampered Token**: Modify token in localStorage
  - Expected: 401 Unauthorized on API calls
  - Verify: User redirected to login page

### ✅ Admin Logout
- [ ] **Normal Logout**: Click logout button in sidebar
  - Expected: Token removed from localStorage, redirect to `/admin/login`
  - Verify: Action logged as "logout" in `admin_actions_log`
  
- [ ] **Access After Logout**: Try accessing `/admin/dashboard` after logout
  - Expected: Redirect to `/admin/login`

---

## 2. 📦 Product Verification

### ✅ Pending Products Tab
- [ ] **View Pending Products**: Navigate to Product Verification page
  - Expected: Display all products with status "pending"
  - Verify: Products auto-flagged based on keywords/price are moved to flagged tab
  
- [ ] **Category Filter**: Select a specific category (e.g., "Electronics")
  - Expected: Only products in that category displayed
  - Verify: Filter persists on page refresh (check URL params)
  
- [ ] **Empty State**: Filter to category with no pending products
  - Expected: "No pending products" message displayed

### ✅ Approve Product
- [ ] **Single Approval**: Click "Approve" on a product
  - Expected: Product status changed to "approved" in database
  - Verify: Product appears in "History" tab
  - Verify: Seller receives notification (check console logs for TODO message)
  - Verify: Admin action logged with `action_type = 'approve_product'`
  
- [ ] **Batch Approval**: Select multiple products and click "Approve Selected"
  - Expected: All selected products approved
  - Verify: Progress indicator shows (if implemented)
  - Verify: Success message shows count (e.g., "3 products approved")

### ✅ Reject Product
- [ ] **Reject with Reason**: Click "Reject" on a product, enter reason, submit
  - Expected: Product status changed to "rejected"
  - Verify: Rejection reason stored in `admin_notes`
  - Verify: Seller receives notification with reason
  - Verify: Product appears in "History" tab with rejection details
  
- [ ] **Reject without Reason**: Try rejecting without entering a reason
  - Expected: Validation error "Rejection reason is required"
  
- [ ] **Long Rejection Reason**: Enter 500+ character reason
  - Expected: Reason stored correctly (check TEXT column type)

### ✅ Flagged Products Tab
- [ ] **View Flagged Products**: Switch to "Flagged" tab
  - Expected: Display products flagged by auto-flagging or manual flagging
  - Verify: Flag details shown (keywords/price threshold exceeded)
  
- [ ] **Manual Flag**: Click "Flag" button on a pending product
  - Expected: Product moved to flagged tab
  - Verify: Admin can add custom flag reason
  
- [ ] **Approve Flagged Product**: Approve a flagged product after review
  - Expected: Product status changed to "approved"
  - Verify: Flag details preserved in history

### ✅ Product Details Modal
- [ ] **View Product Details**: Click "View Details" on any product
  - Expected: Modal opens with product image, name, price, description
  - Verify: Product specifications displayed (fetched from `product_specs` table)
  - Verify: Seller information shown
  
- [ ] **Missing Image**: View product with no image
  - Expected: Placeholder image displayed
  
- [ ] **Close Modal**: Click outside modal or press ESC key
  - Expected: Modal closes without action

### ✅ Verification History
- [ ] **View History**: Switch to "History" tab
  - Expected: Display all verified products (approved/rejected)
  - Verify: Admin name shown for who verified each product
  - Verify: Verification timestamp displayed
  
- [ ] **Filter by Status**: Filter history by "Approved" or "Rejected"
  - Expected: Only matching products shown
  
- [ ] **Search History**: Search by product name
  - Expected: Live filtering of results

---

## 3. 👥 User Management

### ✅ List All Users
- [ ] **View Users**: Navigate to User Management page
  - Expected: Display all users with email, name, trust score, status
  - Verify: Pagination if > 50 users (check performance)
  
- [ ] **Sort by Trust Score**: Click "Trust Score" column header
  - Expected: Users sorted in ascending/descending order

### ✅ Filter Users
- [ ] **Filter by Status**: Select "Suspended" from status dropdown
  - Expected: Only suspended users displayed
  - Verify: Suspension end date shown
  
- [ ] **Filter by Trust Score Range**: Enter min/max trust score (e.g., 50-80)
  - Expected: Only users within range displayed
  
- [ ] **Search Users**: Enter partial email or name
  - Expected: Real-time filtering of user list
  
- [ ] **Clear Filters**: Click "Clear Filters" button
  - Expected: All users displayed again

### ✅ View User Details
- [ ] **User Detail Modal**: Click "View Details" on a user
  - Expected: Modal shows user profile with email, phone, college, hostel
  - Verify: Purchase history displayed (items bought)
  - Verify: Sales history displayed (items sold)
  - Verify: Current listings displayed (active products)
  
- [ ] **Empty Purchase History**: View user with no purchases
  - Expected: "No purchases yet" message
  
- [ ] **User Activity**: Check "Activity" tab in modal
  - Expected: Recent user actions (listings created, purchases made)

### ✅ Suspend User
- [ ] **Suspend User (super_admin)**: Log in as super_admin, suspend a user
  - Expected: Suspension modal opens
  - Verify: Duration dropdown (1 day, 3 days, 1 week, 1 month, permanent)
  - Verify: Reason field required
  
- [ ] **Confirm Suspension**: Enter reason, select duration, confirm
  - Expected: User status changed to "suspended"
  - Verify: `suspended_until` date calculated correctly
  - Verify: Entry created in `user_suspensions` table
  - Verify: Admin action logged
  
- [ ] **Suspended User Cannot Login**: Have suspended user try to log in (student app)
  - Expected: Error message "Your account is suspended until [date]. Reason: [reason]"
  
- [ ] **Moderator Cannot Suspend**: Log in as moderator, try to suspend
  - Expected: 403 Forbidden error (if role check implemented)

### ✅ Unsuspend User
- [ ] **Unsuspend User**: Click "Unsuspend" on suspended user
  - Expected: Confirmation modal appears
  
- [ ] **Confirm Unsuspend**: Confirm unsuspension
  - Expected: User status changed to "active"
  - Verify: `suspended_until` cleared
  - Verify: Admin action logged
  
- [ ] **User Can Login After Unsuspend**: Have user try logging in
  - Expected: Login successful

---

## 4. 📊 Analytics Dashboard

### ✅ Overview Metrics
- [ ] **View Dashboard Overview**: Navigate to Analytics page
  - Expected: Display 4 key metrics (Total Users, Products, Transactions, Avg Trust Score)
  - Verify: Week-over-week changes shown (if implemented with real data)
  
- [ ] **Metric Accuracy**: Compare metrics with database queries
  - Run: `SELECT COUNT(*) FROM users WHERE role = 'student'`
  - Verify: Matches "Total Users" metric

### ✅ Trends Chart
- [ ] **View Trends**: Check trends chart for users/products/transactions
  - Expected: Bar chart or line chart with daily data
  - Verify: Dates labeled correctly on X-axis
  
- [ ] **Date Range Filter**: Change date range to "Last 7 Days" / "Last 30 Days"
  - Expected: Chart updates with new data
  - Verify: Data accuracy for selected range
  
- [ ] **No Data for Range**: Select date range with no activity
  - Expected: Empty state message "No data available for this period"

### ✅ Category Breakdown
- [ ] **View Category Stats**: Check category breakdown table
  - Expected: Categories sorted by product count
  - Verify: Percentages add up to 100%
  
- [ ] **Click Category**: Click on a category row
  - Expected: (Future enhancement) Navigate to product list for that category

### ✅ Location Stats
- [ ] **View Location Stats**: Check location stats table
  - Expected: Locations sorted by product count
  - Verify: Only RVCE hostels and allowed locations shown
  
- [ ] **Top Location**: Verify top location matches database query:
  - Run: `SELECT location, COUNT(*) FROM product_locations GROUP BY location ORDER BY COUNT(*) DESC LIMIT 1`

### ✅ Trust Distribution
- [ ] **View Trust Distribution**: Check trust score distribution chart
  - Expected: Buckets (0-20, 21-40, 41-60, 61-80, 81-100) with user counts
  - Verify: Total users across buckets matches total user count

### ✅ Transaction Funnel
- [ ] **View Abandonment Funnel**: Check funnel visualization
  - Expected: Stages (Listed → Interest → Initiated → Completed)
  - Verify: Each stage count ≥ next stage count (funnel logic)

### ✅ Peak Times
- [ ] **View Peak Times**: Check peak activity times heatmap
  - Expected: Hours 0-23 with activity counts
  - Verify: Peak hours highlighted

---

## 5. 📄 Reports

### ✅ Export Transactions Report
- [ ] **Download CSV**: Select date range, click "Export Transactions"
  - Expected: CSV file downloads
  - Verify: Filename format: `transactions_YYYY-MM-DD_to_YYYY-MM-DD.csv`
  - Verify: CSV columns: transaction_id, buyer_email, seller_email, product_name, amount, status, created_at
  
- [ ] **Empty Date Range**: Select range with no transactions
  - Expected: CSV with headers but no rows
  
- [ ] **Large Dataset**: Export 1000+ transactions
  - Expected: Download completes within 10 seconds
  - Verify: No server timeout

### ✅ Export Users Report
- [ ] **Download CSV**: Click "Export Users Report"
  - Expected: CSV file downloads with all users
  - Verify: CSV columns: user_id, email, full_name, phone, college, trust_score, status, created_at
  
- [ ] **Open CSV**: Open CSV in Excel/Google Sheets
  - Expected: No formatting issues, all data readable

### ✅ Flagged Activity Report
- [ ] **View Flagged Activity**: Check flagged activity table
  - Expected: Users with repeated flagged products displayed
  - Verify: Sorted by flag count (descending)
  
- [ ] **Click User**: Click on a flagged user
  - Expected: Navigate to user detail in User Management
  
- [ ] **No Flagged Activity**: Test with clean database
  - Expected: "No suspicious activity detected" message

---

## 6. 🚨 Edge Cases & Error Handling

### ✅ Product Deleted While Admin Viewing
- [ ] **Setup**: Admin opens product detail modal
- [ ] **Action**: Another admin deletes the product from database directly
- [ ] **Test**: First admin tries to approve/reject
  - Expected: Error message "Product no longer exists"
  - Verify: Modal closes, product list refreshes

### ✅ Simultaneous Admin Actions
- [ ] **Setup**: Two admins open same pending product
- [ ] **Action**: Admin A approves, then Admin B tries to approve
  - Expected: Admin B gets error "Product already verified"
  - Verify: Only one action logged
  - Verify: Product list refreshes for both admins

### ✅ Token Expiration During Action
- [ ] **Setup**: Admin starts approving a product
- [ ] **Action**: Token expires mid-request
  - Expected: 401 Unauthorized error
  - Verify: Redirect to login page
  - Verify: Error message "Session expired, please log in again"

### ✅ Network Request Failures
- [ ] **Simulate Network Error**: Block backend server or disconnect network
- [ ] **Action**: Try loading any page
  - Expected: Error message "Failed to connect to server"
  - Verify: Retry button or helpful troubleshooting message
  
- [ ] **Timeout**: Simulate slow API (add delay in backend)
  - Expected: Loading spinner shows
  - Verify: Request times out after reasonable duration (30s)

### ✅ Invalid Data Handling
- [ ] **Malformed API Response**: Return invalid JSON from backend
  - Expected: Error caught, generic error message shown
  
- [ ] **SQL Injection Attempt**: Enter `'; DROP TABLE users; --` in search field
  - Expected: Treated as literal string, no SQL execution
  - Verify: Parameterized queries prevent injection
  
- [ ] **XSS Attempt**: Enter `<script>alert('XSS')</script>` in rejection reason
  - Expected: Script not executed, stored as plain text
  - Verify: Rendered safely when displayed

### ✅ Pagination & Performance
- [ ] **Large Dataset**: Test with 1000+ pending products
  - Expected: Page loads within 3 seconds
  - Verify: Pagination controls appear
  
- [ ] **Infinite Scroll**: Scroll to bottom of product list
  - Expected: Next page loads automatically (if implemented)
  
- [ ] **Sort Heavy Dataset**: Sort 1000+ users by trust score
  - Expected: Completes within 2 seconds
  - Verify: Database index used (explain query)

---

## 7. 🔒 Security Checklist

### ✅ Authentication & Authorization
- [ ] **Admin Routes Protected**: Try accessing `/admin/dashboard` without token
  - Expected: Redirect to `/admin/login`
  
- [ ] **Regular User Cannot Access**: Use student JWT token on admin endpoint
  - Expected: 403 Forbidden error
  - Verify: `verifyAdmin` middleware checks admin_users table
  
- [ ] **Role-Based Access Control (RBAC)**: Moderator tries to access super_admin-only endpoint
  - Expected: 403 Forbidden "Insufficient permissions"

### ✅ Input Validation
- [ ] **SQL Injection Prevention**: All queries use parameterized statements
  - Audit: Check all `.query()` calls in admin controllers
  - Expected: No string concatenation of user input in SQL
  
- [ ] **XSS Prevention**: User-generated content sanitized before display
  - Test: Enter `<img src=x onerror=alert(1)>` in admin notes
  - Expected: Rendered as plain text, no script execution

### ✅ Rate Limiting
- [ ] **Login Rate Limiting**: Attempt 10 failed logins within 1 minute
  - Expected: "Too many attempts, try again later" after 5 attempts
  - Verify: IP-based or user-based rate limiting
  
- [ ] **Suspend User Rate Limiting**: Attempt to suspend 20 users within 1 minute
  - Expected: Rate limit enforced (if configured)

### ✅ Data Protection
- [ ] **Password Hashing**: Check admin_users table in database
  - Expected: Passwords stored as bcrypt hashes, never plain text
  
- [ ] **JWT Secret**: Verify ADMIN_JWT_SECRET is strong and unique
  - Expected: At least 32 characters, not committed to Git
  
- [ ] **HTTPS Only**: Check cookie settings (if using cookies)
  - Expected: `Secure` and `HttpOnly` flags set

### ✅ Audit Logging
- [ ] **All Admin Actions Logged**: Approve product, suspend user, export report
  - Expected: Each action creates entry in `admin_actions_log`
  - Verify: Log includes admin_id, action_type, timestamp, details
  
- [ ] **Immutable Logs**: Try to delete or modify admin_actions_log entry
  - Expected: Logs should never be deleted (only INSERT, no UPDATE/DELETE)

---

## 8. 📱 Responsive Design & Accessibility

### ✅ Mobile Responsiveness
- [ ] **Test on Mobile (< 720px)**: Resize browser to mobile width
  - Expected: Sidebar collapses to hamburger menu
  - Verify: All tables scroll horizontally or stack vertically
  
- [ ] **Tablet View (720px - 1024px)**: Resize to tablet width
  - Expected: 2-column layout for cards, readable text

### ✅ Keyboard Navigation
- [ ] **Tab Navigation**: Use Tab key to navigate admin login form
  - Expected: Focus indicators visible on inputs and buttons
  
- [ ] **Modal Keyboard Shortcuts**: Open product detail modal, press ESC
  - Expected: Modal closes
  
- [ ] **Keyboard Shortcuts**: Press 'A' on pending product (if implemented)
  - Expected: Approve confirmation modal opens

### ✅ Accessibility
- [ ] **Screen Reader**: Use screen reader (NVDA/JAWS) on admin dashboard
  - Expected: All buttons, links, and form fields announced
  - Verify: ARIA labels on icon-only buttons
  
- [ ] **Color Contrast**: Check text readability on navy background
  - Expected: Meets WCAG AA standard (4.5:1 for normal text)
  
- [ ] **Focus States**: Tab through all interactive elements
  - Expected: Clear focus outline on all buttons/links

---

## 9. 🎨 User Experience

### ✅ Loading States
- [ ] **API Call Loading**: Trigger slow API request
  - Expected: Loading spinner or skeleton screen displayed
  - Verify: Button disabled during submission
  
- [ ] **Batch Action Progress**: Approve 10 products in batch
  - Expected: Progress indicator (e.g., "Approving 3/10...")

### ✅ Success/Error Notifications
- [ ] **Success Toast**: Approve a product successfully
  - Expected: Green toast notification "Product approved successfully"
  - Verify: Auto-dismisses after 3-5 seconds
  
- [ ] **Error Toast**: Network error during API call
  - Expected: Red toast notification with error message
  - Verify: Retry button if applicable

### ✅ Confirmation Modals
- [ ] **Destructive Action Confirmation**: Click "Reject" on product
  - Expected: Confirmation modal "Are you sure you want to reject this product?"
  - Verify: Requires explicit confirmation, not auto-approve

### ✅ Empty States
- [ ] **No Pending Products**: Approve all pending products
  - Expected: Friendly empty state message with illustration or icon
  - Verify: Helpful text like "Great! No products awaiting verification"
  
- [ ] **No Search Results**: Search for non-existent product
  - Expected: "No products found matching 'xyz'" message

---

## 10. ✅ Browser Compatibility

- [ ] **Chrome**: Test all features on latest Chrome
- [ ] **Firefox**: Test all features on latest Firefox
- [ ] **Edge**: Test all features on latest Edge
- [ ] **Safari**: Test on Safari (macOS/iOS if available)
- [ ] **Mobile Browsers**: Test on Chrome Mobile and Safari Mobile

---

## 📋 Testing Summary Template

After completing all tests, fill out this summary:

**Test Date**: ___________  
**Tester**: ___________  
**Environment**: Production / Staging / Local  
**Total Tests**: ___________  
**Passed**: ___________  
**Failed**: ___________  
**Blocked**: ___________  

**Critical Issues Found**:
1. 
2. 
3. 

**Recommendations Before Launch**:
1. 
2. 
3. 

**Sign-off**: ___________ (QA Lead)
