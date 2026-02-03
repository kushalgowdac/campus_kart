# CampusKart Admin Dashboard - User Guide

## 📖 Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Product Verification](#product-verification)
4. [User Management](#user-management)
5. [Analytics Dashboard](#analytics-dashboard)
6. [Reports & Exports](#reports--exports)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)
9. [Security Guidelines](#security-guidelines)

---

## 1. Introduction

### What is the Admin Dashboard?
The CampusKart Admin Dashboard is a powerful tool for moderating the CampusKart marketplace. As an administrator, you can:
- ✅ Verify and approve product listings
- 🚩 Flag suspicious or inappropriate products
- 👥 Manage user accounts and suspensions
- 📊 View platform analytics and insights
- 📄 Generate reports and export data

### Admin Roles
There are two admin roles with different permission levels:

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access to all features, including user suspension/unsuspension |
| **Moderator** | Can verify products and view analytics, but limited user management |

---

## 2. Getting Started

### How to Log In

1. **Navigate to Admin Login Page**
   - Open your browser and go to: `https://campuskart.rvce.edu.in/admin/login`
   - Bookmark this page for easy access

2. **Enter Credentials**
   - Email: Your admin email (e.g., `admin@rvce.edu.in`)
   - Password: Your secure admin password
   
   > **Note**: Admin accounts are separate from student accounts. You cannot use your regular CampusKart student login.

3. **Click "Login"**
   - If credentials are correct, you'll be redirected to the dashboard
   - Your session will remain active for 24 hours

4. **Two-Factor Authentication (If Enabled)**
   - After entering your password, you'll be prompted for a 6-digit code
   - Open your authenticator app (Google Authenticator, Authy, etc.)
   - Enter the 6-digit code shown
   - Click "Verify"

### First-Time Login Checklist
- [ ] Change your default password to a strong, unique password
- [ ] Enable two-factor authentication (if available)
- [ ] Familiarize yourself with the dashboard layout
- [ ] Read through the Product Verification guidelines
- [ ] Check for any pending products awaiting verification

---

## 3. Product Verification

### Overview
Product verification ensures that all listings on CampusKart are legitimate and appropriate for the student marketplace. Your role is to review products before they go live.

### Accessing Product Verification
1. Click **"Products"** in the left sidebar
2. You'll see three tabs:
   - **Pending**: Products awaiting your review
   - **Flagged**: Products auto-flagged by the system or manually flagged
   - **History**: All previously verified products

---

### Reviewing Pending Products

#### Step 1: View Pending Products
- The **Pending** tab shows all products waiting for approval
- Each product displays:
  - Product image (thumbnail)
  - Product name
  - Category
  - Price
  - Seller information
  - Date submitted

#### Step 2: Open Product Details
1. Click **"View Details"** on any product
2. A modal opens showing:
   - Full product image
   - Complete description
   - Specifications (condition, year purchased, etc.)
   - Seller profile (name, trust score, email)
   - Location (pickup location on campus)

#### Step 3: Evaluate the Product
Ask yourself these questions:
- ✅ Is the product name accurate and appropriate?
- ✅ Is the price reasonable for this item?
- ✅ Are the images clear and show the actual product?
- ✅ Is the description free from prohibited content?
- ✅ Does the seller seem legitimate?

#### Step 4: Take Action

**Option A: Approve the Product**
1. Click the **"Approve"** button
2. A confirmation appears (if enabled)
3. Click **"Confirm"**
4. Product is now live on the marketplace
5. Seller receives an approval notification

**Option B: Reject the Product**
1. Click the **"Reject"** button
2. A modal opens asking for a rejection reason
3. Enter a clear, specific reason (required):
   - Example: "Images are unclear and do not show the product properly"
   - Example: "Price is unreasonably high for a used item"
   - Example: "Description contains inappropriate language"
4. Click **"Reject Product"**
5. Product is rejected and removed from pending
6. Seller receives a rejection notification with your reason

**Option C: Flag the Product**
1. Click the **"Flag"** button (visible in dropdown menu)
2. Select a flag reason:
   - Suspicious pricing
   - Unclear images
   - Misleading description
   - Potential scam
   - Other (specify)
3. Click **"Flag Product"**
4. Product moves to **Flagged** tab for further review

---

### Reviewing Flagged Products

#### What are Flagged Products?
Flagged products are listings that have been automatically or manually marked for review. The system auto-flags products based on:
- **Keywords**: Product name contains "scam", "fake", "fraud", "counterfeit"
- **High Price**: Price exceeds ₹50,000

#### How to Review Flagged Products
1. Go to the **Flagged** tab
2. Each flagged product shows the **flag reason**:
   - "Auto-flagged: keyword:fake" → Product name contains "fake"
   - "Auto-flagged: price>50000" → Price is too high
   - "Manual flag: Seller requested by user" → Another admin flagged it
3. Click **"View Details"** to investigate
4. You can:
   - **Approve**: If the product is legitimate (e.g., high price is justified)
   - **Reject**: If the product violates policies
   - **Keep Flagged**: Leave it flagged for senior review

#### Example: Reviewing a High-Price Item
**Product**: MacBook Pro 16" M2 Max - ₹1,85,000  
**Flag Reason**: Auto-flagged: price>50000  
**Investigation**:
- Check if the product is actually a MacBook (not a fake)
- Verify the specifications match the claimed model
- Check the seller's trust score and history
- Confirm the price is reasonable for this model (yes, ₹1.85L is market price)

**Action**: Approve the product (legitimate high-value item)

---

### Batch Approval
For efficiency, you can approve multiple products at once:

1. Click the **checkbox** next to each product you want to approve
2. Click **"Approve Selected"** at the top
3. A confirmation shows: "You are about to approve 5 products. Continue?"
4. Click **"Confirm"**
5. All selected products are approved simultaneously

> **Best Practice**: Only batch approve products that are clearly legitimate. Review carefully before batch actions.

---

### Verification History
The **History** tab shows all products you and other admins have verified.

**Useful for**:
- Reviewing past decisions
- Checking patterns (e.g., has this seller been rejected before?)
- Auditing admin actions

**Filter Options**:
- Status: Approved / Rejected / Flagged
- Date range
- Admin (who verified it)
- Category

---

## 4. User Management

### Overview
As a Super Admin, you can manage user accounts, suspend users, and view user activity.

> **Note**: Moderators have limited user management access and cannot suspend users.

### Accessing User Management
Click **"Users"** in the left sidebar.

---

### Viewing All Users

#### User List
The user management page displays:
- Email
- Full name
- Trust score (0-100)
- Account status (Active / Suspended)
- Join date

#### Sorting & Filtering
- **Sort by Trust Score**: Click the "Trust Score" column header
- **Filter by Status**: Select "Active", "Suspended", or "All"
- **Filter by Trust Score Range**: Enter min/max values (e.g., 0-50 for low trust)
- **Search**: Type email or name to find specific users

---

### Viewing User Details

1. Click **"View Details"** on any user
2. A modal opens showing:
   - **Profile Info**: Email, phone, college, hostel
   - **Trust Score**: Current score and history
   - **Purchase History**: Items the user has bought
   - **Sales History**: Items the user has sold
   - **Current Listings**: Active products for sale
   - **Activity Log**: Recent actions (logins, listings, purchases)

**Use Cases**:
- Investigating a reported user
- Checking if a user is a legitimate buyer/seller
- Understanding a user's marketplace behavior

---

### Suspending a User

> **⚠️ SUPER ADMIN ONLY**: Only super admins can suspend users.

#### When to Suspend a User
Suspend users who:
- Post fraudulent or misleading listings repeatedly
- Engage in scam behavior (e.g., payment reversals)
- Harass other users
- Violate CampusKart terms of service

#### How to Suspend a User
1. Click **"Suspend User"** in the user detail modal
2. A suspension modal opens
3. **Select Duration**:
   - 1 Day (minor offense)
   - 3 Days (moderate offense)
   - 1 Week (serious offense)
   - 1 Month (repeated violations)
   - **Permanent** (severe violations, fraud)
4. **Enter Reason** (required):
   - Be specific and factual
   - Example: "Posted 3 products with misleading descriptions in the past week"
   - Example: "Confirmed fraudulent payment reversal on Transaction #12345"
5. Click **"Confirm Suspension"**
6. User is immediately suspended

#### What Happens When a User is Suspended?
- User cannot log in to CampusKart
- All their active listings are hidden
- They cannot make purchases or send messages
- If they try to log in, they see: *"Your account is suspended until [date]. Reason: [your reason]"*

---

### Unsuspending a User

#### When to Unsuspend
- The suspension period has ended, but you want to remove it early
- User appeals successfully
- Suspension was made in error

#### How to Unsuspend
1. Open the suspended user's detail modal
2. Click **"Unsuspend User"**
3. A confirmation appears
4. Click **"Confirm"**
5. User regains full access immediately

---

### User Trust Score

#### What is Trust Score?
Trust score (0-100) represents a user's reliability on the platform. It's calculated based on:
- Successful transactions
- Positive ratings
- Account age
- Compliance with policies

#### Trust Score Ranges
- **81-100**: Excellent (highly trusted seller/buyer)
- **61-80**: Good (reliable user)
- **41-60**: Average (normal user)
- **21-40**: Low (may need monitoring)
- **0-20**: Very Low (high risk, consider investigation)

#### Using Trust Score for Moderation
- Users with low trust scores (<30) are more likely to need verification
- Check user activity if trust score drops suddenly
- High trust score users (>80) rarely violate policies

---

## 5. Analytics Dashboard

### Overview
The Analytics page provides insights into platform activity and trends.

### Accessing Analytics
Click **"Analytics"** in the left sidebar.

---

### Dashboard Overview Metrics

The top of the page shows 4 key metrics:

1. **Total Users**: Number of registered students
2. **Total Products**: Active product listings
3. **Total Transactions**: Completed purchases
4. **Avg Trust Score**: Platform-wide average

Each metric shows a **week-over-week change** (e.g., "+12%") to track growth.

---

### Trends Chart

#### What It Shows
A visual chart displaying daily trends for:
- New users
- New products
- Completed transactions

#### How to Use It
1. **Select Date Range**: Choose "Last 7 Days", "Last 30 Days", or custom
2. **Analyze Trends**: Look for patterns
   - Peak days (e.g., more products listed on weekends)
   - Unusual spikes (investigate if needed)
3. **Hover Over Bars**: See exact numbers for each day

**Example Insight**:
"Transaction volume drops on Sundays → Students are less active on weekends"

---

### Category Breakdown

#### What It Shows
A table showing:
- Category name (e.g., Electronics, Books)
- Number of products
- Percentage of total products
- Average price

#### How to Use It
- Identify popular categories (e.g., Electronics has 35% of all products)
- Spot pricing trends (e.g., Furniture averages ₹5,000)
- Prioritize verification efforts (focus on high-volume categories)

---

### Location Stats

#### What It Shows
Distribution of products by pickup location:
- Kriyakalpa
- Mingos
- CS Ground
- Other campus locations

#### Why It Matters
- Helps identify where most transactions happen
- Useful for logistics planning
- Spot unusual patterns (e.g., all fraudulent products from one location)

---

### Trust Distribution

#### What It Shows
A bar chart showing how many users fall into each trust score bucket:
- 0-20 (Very Low)
- 21-40 (Low)
- 41-60 (Average)
- 61-80 (Good)
- 81-100 (Excellent)

#### How to Use It
- Healthy distribution: Most users in 41-80 range
- Red flag: Large spike in 0-20 range → Investigate new users
- Green flag: Many users in 81-100 → Platform is trusted

---

### Transaction Funnel

#### What It Shows
A funnel showing user journey from product listing to sale:
1. **Listed**: Products created
2. **Interest**: Products viewed/saved
3. **Initiated**: Transactions started
4. **Completed**: Transactions completed

#### How to Use It
- **High drop-off at "Interest"**: Products not attractive or too expensive
- **High drop-off at "Initiated"**: Payment or trust issues
- **Good conversion**: Most initiated transactions complete

**Example**:
- Listed: 1000 products
- Interest: 750 (75% generate interest)
- Initiated: 300 (40% of interested users start transaction)
- Completed: 250 (83% of initiated transactions complete)

**Insight**: Focus on improving interest → initiated conversion.

---

### Peak Times

#### What It Shows
Heatmap of platform activity by hour of day (0-23).

#### How to Use It
- Schedule verification efforts during peak hours
- Plan maintenance during low-traffic hours (e.g., 2 AM - 5 AM)
- Understand when students are most active

**Example**: Peak activity at 2 PM - 6 PM → Students browse after classes.

---

## 6. Reports & Exports

### Overview
Generate CSV reports for data analysis and record-keeping.

### Accessing Reports
Click **"Reports"** in the left sidebar.

---

### Export Transactions Report

#### What It Includes
CSV file with:
- Transaction ID
- Buyer email
- Seller email
- Product name
- Amount (₹)
- Status (completed, pending, cancelled)
- Transaction date

#### How to Export
1. Select **Start Date** and **End Date**
2. Click **"Export Transactions"**
3. CSV file downloads automatically
4. Filename: `transactions_2024-01-01_to_2024-01-31.csv`

#### Use Cases
- Monthly financial reports
- Tax documentation
- Auditing completed sales

---

### Export Users Report

#### What It Includes
CSV file with:
- User ID
- Email
- Full name
- Phone number
- College/Hostel
- Trust score
- Account status
- Join date

#### How to Export
1. Click **"Export Users Report"**
2. CSV downloads with all users
3. Filename: `users_2024-02-01.csv`

#### Use Cases
- User database backup
- Analytics in Excel/Google Sheets
- Compliance reporting

---

### Flagged Activity Report

#### What It Shows
A list of users with repeated flagged products, sorted by flag count.

**Columns**:
- User email
- Number of flagged products
- Total products listed
- Trust score

#### How to Use It
- Identify problematic sellers (e.g., 5 flagged products)
- Investigate users with high flag rates
- Consider suspension for repeat offenders

**Example**:
- `seller@rvce.edu.in`: 6 flagged products out of 10 total → Investigate immediately

---

## 7. Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Session Expired" Error
**Cause**: Your login token has expired (24-hour limit).  
**Solution**:
1. Click "OK" on the error message
2. You'll be redirected to the login page
3. Log in again with your credentials

**Prevention**: If you're working on a long session, refresh the page periodically to keep the session active.

---

#### Issue 2: Cannot Approve Product (Button Disabled)
**Possible Causes**:
- Product was already verified by another admin
- Network error
- Permission issue

**Solution**:
1. Refresh the page
2. Check if the product still appears in "Pending" tab
3. If it's gone, another admin already verified it
4. If issue persists, check browser console for errors (F12)

---

#### Issue 3: CSV Export Not Downloading
**Possible Causes**:
- Pop-up blocker enabled
- Large dataset (>10,000 records)

**Solution**:
1. Allow pop-ups for the CampusKart domain
2. Try a smaller date range if exporting transactions
3. Clear browser cache and try again

---

#### Issue 4: Analytics Data Not Loading
**Possible Causes**:
- Database query timeout
- No data for selected date range

**Solution**:
1. Check if you've selected a valid date range
2. Try a shorter date range (e.g., 7 days instead of 365)
3. Refresh the page
4. Contact technical support if issue persists

---

#### Issue 5: "Insufficient Permissions" Error
**Cause**: You're a Moderator trying to access a Super Admin-only feature (e.g., user suspension).

**Solution**:
- Only Super Admins can suspend users
- If you need Super Admin access, contact your platform administrator

---

### How to Report a Bug
If you encounter a technical issue:

1. **Take a Screenshot**: Capture the error message or issue
2. **Note the Steps**: What were you doing when the error occurred?
3. **Check Browser Console**: Press F12, go to "Console" tab, copy any red error messages
4. **Contact Support**: Email `tech-support@campuskart.edu` with:
   - Description of the issue
   - Screenshot
   - Browser console errors
   - Your admin email (for troubleshooting)

---

## 8. Best Practices

### Product Verification Best Practices

1. **Be Consistent**: Apply the same standards to all products
2. **Be Fair**: Don't reject a product just because it seems unusual—verify it's legitimate
3. **Be Clear**: When rejecting, provide a specific reason so the seller can fix the issue
4. **Be Thorough**: Check images, description, price, and seller profile before deciding
5. **Be Timely**: Try to verify products within 24 hours of submission

---

### User Management Best Practices

1. **Document Everything**: Always provide a clear reason for suspensions
2. **Escalate When Unsure**: If you're not sure whether to suspend, consult a senior admin
3. **Communicate**: Sellers should know why they were suspended
4. **Be Proportional**: Match suspension duration to offense severity
   - 1st offense (misleading description): 1 day
   - 2nd offense: 1 week
   - 3rd offense or fraud: Permanent
5. **Review Appeals**: If a user appeals, review the case fairly

---

### Analytics Best Practices

1. **Review Weekly**: Check analytics every Monday to understand trends
2. **Spot Anomalies**: If transactions spike or drop suddenly, investigate
3. **Track Metrics**: Keep a spreadsheet of weekly metrics to see long-term trends
4. **Share Insights**: Communicate findings with other admins in team meetings

---

### Security Best Practices

1. **Use a Strong Password**: At least 12 characters, mix of letters, numbers, symbols
2. **Enable 2FA**: Two-factor authentication adds an extra layer of security
3. **Never Share Your Login**: Admin accounts are personal and should not be shared
4. **Log Out**: Always log out when done, especially on shared computers
5. **Be Wary of Phishing**: Don't click suspicious links claiming to be from CampusKart
6. **Report Suspicious Activity**: If you notice unusual admin actions in the log, report it

---

## 9. Security Guidelines

### Protecting Admin Access

#### Password Requirements
- Minimum 12 characters
- Include uppercase, lowercase, numbers, and symbols
- Do not reuse passwords from other accounts
- Change your password every 90 days

#### Two-Factor Authentication (2FA)
If enabled:
- Download Google Authenticator or Authy
- Scan the QR code during setup
- Save backup codes in a secure location (not on your computer)

#### Session Security
- Admin sessions expire after 24 hours
- You'll be logged out after 30 minutes of inactivity
- Never leave your admin dashboard open on a public computer

---

### Handling Sensitive Data

#### User Privacy
- **Never share user data** (emails, phone numbers) outside the admin team
- Export reports only for legitimate administrative purposes
- Store CSV exports in a secure location
- Delete old exports when no longer needed

#### Audit Trail
- All your actions are logged in `admin_actions_log`
- Logs are immutable (cannot be deleted)
- Senior admins can review your action history
- Be professional and ethical in all admin actions

---

### Responding to Security Incidents

If you suspect a security breach (e.g., unauthorized admin login):

1. **Change Your Password Immediately**
2. **Log Out All Sessions**
3. **Report to IT Security**: Email `security@campuskart.edu`
4. **Review Recent Actions**: Check admin action logs for suspicious activity
5. **Enable 2FA** (if not already enabled)

---

## 📞 Support & Contact

### Need Help?
- **Technical Support**: tech-support@campuskart.edu
- **Admin Questions**: admin-team@campuskart.edu
- **Security Issues**: security@campuskart.edu
- **Emergency Contact**: +91-XXXX-XXXXXX (for critical issues after hours)

### Feedback & Suggestions
We value your input! If you have ideas for improving the admin dashboard:
- Email: product-feedback@campuskart.edu
- Include screenshots or mockups if applicable

---

## 📚 Additional Resources

- [CampusKart Policies](https://campuskart.edu/policies)
- [Product Listing Guidelines](https://campuskart.edu/guidelines)
- [Admin Code of Conduct](https://campuskart.edu/admin-code)
- [Video Tutorial: Product Verification](https://campuskart.edu/tutorials/verification)
- [Video Tutorial: User Management](https://campuskart.edu/tutorials/users)

---

**Version**: 1.0  
**Last Updated**: February 2024  
**Maintained by**: CampusKart Admin Team

---

*Thank you for keeping the CampusKart marketplace safe and trustworthy! Your diligent moderation ensures a positive experience for all RVCE students.* 🎓
