# CampusKart Admin System - Entity Relationship Diagram

## Overview
This document describes the ER diagram for the admin system tables and their relationships to existing student marketplace tables.

---

## Entity Relationships

### **1. ADMIN_USERS** (New Admin Table)
```
admin_users
├── admin_id (PK)
├── email (UNIQUE)
├── password_hash
├── full_name
├── role (super_admin | moderator)
├── is_active
├── created_at
├── last_login
└── updated_at
```

**Relationships:**
- **1:N** with `product_verification` (verified_by → admin_id)
- **1:N** with `admin_actions_log` (admin_id → admin_id)
- **1:N** with `user_suspensions` (suspended_by → admin_id)
- **1:N** with `user_suspensions` (lifted_by → admin_id)

**Notes:**
- Completely separate from `users` table (students)
- No foreign key to users; admins are not students
- Role hierarchy enforced at application layer

---

### **2. PRODUCT_VERIFICATION** (Links Products to Admin Review)
```
product_verification
├── verification_id (PK)
├── product_id (FK → products.pid) ─────┐
├── status (pending/approved/rejected/flagged)
├── verified_by (FK → admin_users.admin_id) ─┐
├── verified_at                               │
├── rejection_reason                          │
├── admin_notes                               │
├── flag_details (JSON)                       │
├── seller_trust_score                        │
├── created_at                                │
└── updated_at                                │
                                              │
    ┌─────────────────────────────────────────┘
    │
    ▼
┌─────────────┐         ┌──────────────┐
│  products   │ 1:1     │ admin_users  │
│ (existing)  ├────────▶│    (new)     │
└─────────────┘         └──────────────┘
```

**Relationships:**
- **N:1** with `products` (product_id → pid) - Each product has ONE verification record
- **N:1** with `admin_users` (verified_by → admin_id) - Admin who verified
- **Indirect** to `users` via products → product_seller → sellerid

**Workflow:**
1. Student creates product → Auto-creates verification record with status='pending'
2. Admin reviews → Updates status to 'approved'/'rejected'/'flagged'
3. Only 'approved' products visible to students in marketplace

---

### **3. ADMIN_ACTIONS_LOG** (Audit Trail)
```
admin_actions_log
├── action_id (PK)
├── admin_id (FK → admin_users.admin_id)
├── action_type (approved_product | suspended_user | etc.)
├── target_type (product | user | transaction)
├── target_id (references pid, uid, tid, etc.)
├── details (JSON)
├── ip_address
└── timestamp
```

**Relationships:**
- **N:1** with `admin_users` (admin_id → admin_id)
- **Polymorphic** references to `products`, `users`, `transactions` via (target_type, target_id)

**Example References:**
```
action_type         target_type    target_id        References
─────────────────────────────────────────────────────────────
approved_product    product        123              products.pid
suspended_user      user           456              users.uid
deleted_product     product        789              products.pid
```

---

### **4. USER_SUSPENSIONS** (Student Moderation)
```
user_suspensions
├── suspension_id (PK)
├── user_id (FK → users.uid) ──────┐
├── suspended_by (FK → admin_users.admin_id) ─┐
├── reason                                     │
├── internal_notes                             │
├── suspended_at                               │
├── suspended_until (NULL = permanent)         │
├── is_active                                  │
├── lifted_by (FK → admin_users.admin_id) ────┤
├── lifted_at                                  │
└── lift_reason                                │
                                               │
    ┌──────────────────────────────────────────┘
    │
    ▼
┌─────────────┐         ┌──────────────┐
│    users    │ 1:N     │ admin_users  │
│ (students)  ├────────▶│ (moderators) │
└─────────────┘         └──────────────┘
```

**Relationships:**
- **N:1** with `users` (user_id → uid) - Student being suspended
- **N:1** with `admin_users` (suspended_by → admin_id) - Admin who suspended
- **N:1** with `admin_users` (lifted_by → admin_id) - Admin who lifted suspension

**Notes:**
- `is_active=true` AND `suspended_until > NOW()` = Currently suspended
- Backend must check this table before allowing transactions/listings

---

### **5. DAILY_STATS** (Analytics Snapshot)
```
daily_stats
├── stat_date (PK)
├── total_users
├── new_users_today
├── active_users_today
├── total_products
├── new_products_today
├── available_products
├── sold_products_today
├── total_transactions
├── completed_transactions_today
├── total_revenue_today
├── pending_verifications
├── flagged_products
├── active_suspensions
└── updated_at
```

**Relationships:**
- **No direct foreign keys** - Aggregated data from multiple tables
- Populated via scheduled job (MySQL Event or cron)

**Source Tables:**
```
users               → total_users, new_users_today
products            → total_products, new_products_today
transactions        → completed_transactions_today, total_revenue_today
product_verification → pending_verifications, flagged_products
user_suspensions    → active_suspensions
```

---

### **6. CATEGORY_STATS** (Category Analytics)
```
category_stats
├── category (PK)
├── product_count
├── available_count
├── sold_count
├── avg_price
├── min_price
├── max_price
├── median_price
├── total_wishlist_adds
├── avg_sale_time_hours
└── last_updated
```

**Relationships:**
- **Soft reference** to `products.category` (no FK, since category is VARCHAR)
- Aggregated from `products`, `add_to_wishlist`, `transactions`

---

## Complete ER Diagram (Text Representation)

```
┌─────────────────────┐
│    ADMIN_USERS      │  (New)
│  ┌──────────────┐   │
│  │ admin_id PK  │   │
│  │ email UNIQUE │   │
│  │ role         │   │
│  └──────────────┘   │
└──────┬──────────────┘
       │ 1
       │
       │ N (verified_by, suspended_by, lifted_by)
       │
       ├──────────────────────────────────┬─────────────────────────┐
       │                                  │                         │
       ▼                                  ▼                         ▼
┌──────────────────┐            ┌──────────────────┐      ┌──────────────────┐
│ PRODUCT_VERIFY   │            │ USER_SUSPENSIONS │      │ ADMIN_ACTIONS    │
│ ┌──────────────┐ │            │ ┌──────────────┐ │      │ ┌──────────────┐ │
│ │ product_id FK│─┼──┐         │ │ user_id FK   │─┼──┐   │ │ admin_id FK  │ │
│ │ verified_by  │ │  │         │ │ suspended_by │ │  │   │ │ target_id    │ │
│ │ status       │ │  │         │ │ is_active    │ │  │   │ │ action_type  │ │
│ └──────────────┘ │  │         │ └──────────────┘ │  │   │ └──────────────┘ │
└──────────────────┘  │         └──────────────────┘  │   └──────────────────┘
                      │                               │            │
                      │ N:1                           │ N:1        │ Polymorphic
                      │                               │            │
                      ▼                               ▼            ▼
              ┌──────────────┐              ┌──────────────┐  ┌────────────┐
              │   PRODUCTS   │  1:1         │    USERS     │  │ PRODUCTS/  │
              │ ┌──────────┐ │◀────────────▶│ ┌──────────┐ │  │ USERS/     │
              │ │ pid PK   │ │              │ │ uid PK   │ │  │ TRANS...   │
              │ │ status   │ │              │ │ role     │ │  └────────────┘
              │ │ category │ │              │ │ trust_   │ │
              │ └──────────┘ │              │ │ points   │ │
              └──────┬───────┘              └──────┬──────┘
                     │ 1:1                         │ 1:N
                     │                             │
                     ▼                             ▼
              ┌──────────────┐              ┌──────────────┐
              │ PRODUCT_     │              │ ADD_TO_      │
              │ SELLER       │              │ WISHLIST     │
              │ ┌──────────┐ │              │ ┌──────────┐ │
              │ │ pid FK   │ │              │ │ uid FK   │ │
              │ │ sellerid │─┼──────────────┼▶│ pid FK   │ │
              │ └──────────┘ │              │ └──────────┘ │
              └──────────────┘              └──────────────┘

┌─────────────────────┐        ┌─────────────────────┐
│   DAILY_STATS       │        │  CATEGORY_STATS     │
│ ┌─────────────────┐ │        │ ┌─────────────────┐ │
│ │ stat_date PK    │ │        │ │ category PK     │ │
│ │ total_users     │ │        │ │ product_count   │ │
│ │ total_products  │ │        │ │ avg_price       │ │
│ │ pending_verify  │ │        │ │ sold_count      │ │
│ └─────────────────┘ │        │ └─────────────────┘ │
└─────────────────────┘        └─────────────────────┘
        │                                   │
        │ Aggregates from                   │ Aggregates from
        ▼                                   ▼
  [ users, products,              [ products, wishlist,
    transactions,                   transactions ]
    product_verification,
    user_suspensions ]
```

---

## Key Integration Points

### **Backend Integration**

1. **Product Listing Endpoint** (`POST /api/products`)
   ```
   New Product → Auto-create product_verification (status='pending')
   ```

2. **Marketplace Query** (`GET /api/products`)
   ```
   Filter WHERE product_verification.status = 'approved'
   ```

3. **Reserve Product** (`POST /api/products/:id/reserve`)
   ```
   Check user_suspensions WHERE user_id = current_user AND is_active = true
   If suspended → Reject transaction
   ```

4. **Admin Verification** (`PATCH /api/admin/products/:id/verify`)
   ```
   Update product_verification.status = 'approved'
   Insert admin_actions_log entry
   ```

### **Frontend Integration**

1. **Admin Dashboard** (React Route: `/admin/dashboard`)
   - Display `daily_stats` for today
   - Show verification queue (`product_verification WHERE status='pending'`)
   - Show flagged products (`product_verification WHERE status='flagged'`)

2. **Verification Queue** (`/admin/products/pending`)
   - Fetch products with `JOIN product_verification`
   - Show product details + seller trust score
   - Approve/Reject buttons → Update `product_verification`

3. **Suspension Management** (`/admin/users`)
   - Search users with filters
   - Suspend/Unsuspend actions → Insert/Update `user_suspensions`
   - Log all actions in `admin_actions_log`

---

## Security Considerations

1. **Admin Authentication**
   - Separate JWT token for `admin_users`
   - Token payload: `{ admin_id, email, role }`
   - Middleware: Verify `role` before allowing admin routes

2. **Role-Based Access Control**
   ```
   super_admin:
     - Can suspend/unsuspend users
     - Can grant/revoke moderator privileges
     - Can delete products
   
   moderator:
     - Can approve/reject products
     - Can flag suspicious content
     - Can view audit logs (read-only)
   ```

3. **Audit Trail**
   - Every admin action logged in `admin_actions_log`
   - Include IP address for forensics
   - Immutable logs (no DELETE permission for admins)

---

## Migration Execution Order

```bash
# 1. Base schema
mysql -u root -p campuskart < database/schema.sql

# 2. RBAC for users table
mysql -u root -p campuskart < database/rbac_migration.sql

# 3. Gamification (trust score, badges)
mysql -u root -p campuskart < database/gamification_migration.sql

# 4. OTP workflow
mysql -u root -p campuskart < database/otp_tokens_migration.sql

# 5. Location & reschedule
mysql -u root -p campuskart < database/location_migration.sql
mysql -u root -p campuskart < database/reschedule_migration.sql

# 6. Admin system (NEW)
mysql -u root -p campuskart < database/admin_migration.sql

# 7. Seed data
mysql -u root -p campuskart < database/seed.sql
mysql -u root -p campuskart < database/bulk_seed.sql
```

---

## Sample Queries

### **Check if user is suspended**
```sql
SELECT 
  u.uid,
  u.name,
  us.reason,
  us.suspended_until
FROM users u
LEFT JOIN user_suspensions us ON u.uid = us.user_id
WHERE u.uid = 123
  AND us.is_active = true
  AND (us.suspended_until IS NULL OR us.suspended_until > NOW());
```

### **Get pending verification queue**
```sql
SELECT 
  p.pid,
  p.pname,
  p.price,
  ps.sellerid,
  u.name AS seller_name,
  u.trust_points,
  pv.status,
  pv.created_at
FROM products p
JOIN product_verification pv ON p.pid = pv.product_id
JOIN product_seller ps ON p.pid = ps.pid
JOIN users u ON ps.sellerid = u.uid
WHERE pv.status = 'pending'
ORDER BY pv.created_at ASC
LIMIT 20;
```

### **Get admin action history**
```sql
SELECT 
  aal.action_id,
  au.full_name AS admin_name,
  aal.action_type,
  aal.target_type,
  aal.target_id,
  aal.details,
  aal.timestamp
FROM admin_actions_log aal
JOIN admin_users au ON aal.admin_id = au.admin_id
WHERE aal.admin_id = 1
ORDER BY aal.timestamp DESC
LIMIT 50;
```

### **Today's dashboard stats**
```sql
SELECT 
  stat_date,
  new_users_today,
  new_products_today,
  completed_transactions_today,
  total_revenue_today,
  pending_verifications,
  flagged_products,
  active_suspensions
FROM daily_stats
WHERE stat_date = CURDATE();
```

---

## Notes

- **No cascade deletes** on admin_users → Preserve audit trail even if admin account removed
- **Soft deletes** recommended for products (add `deleted_at` column instead of DELETE)
- **JSON fields** (`flag_details`, `details`) allow flexible metadata without schema changes
- **Indexes** optimized for admin dashboard queries (status filters, date ranges)
- **Analytics tables** reduce load on main tables during dashboard rendering

---

## Future Enhancements

1. **Reporting System**
   - Add `product_reports` table for user-submitted flags
   - Link to `product_verification` for admin review

2. **Automated Trust Score Adjustment**
   - Add `trust_score_adjustments` table
   - Track manual admin overrides separately from gamification

3. **Bulk Actions**
   - Add `admin_bulk_actions` table
   - Track mass approvals/rejections with single action_id

4. **Appeal Workflow**
   - Add `suspension_appeals` table
   - Allow users to contest suspensions

---

**End of ER Diagram Documentation**
