import { pool } from "../db/index.js";

/**
 * Admin Controller - User Management
 */

// List all users with role and stats
export const listAllUsers = async (req, res, next) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.uid, 
        u.name, 
        u.email, 
        u.role,
        u.trust_points,
        COUNT(DISTINCT ps.pid) as listings_count,
        COUNT(DISTINCT t.tid) as transactions_count
      FROM users u
      LEFT JOIN product_seller ps ON u.uid = ps.sellerid
      LEFT JOIN transaction t ON u.uid = t.buyerid
      GROUP BY u.uid
      ORDER BY u.uid DESC
    `);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// Update user role
export const updateUserRole = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const [result] = await pool.query(
      "UPDATE users SET role = ? WHERE uid = ?",
      [role, uid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User role updated", uid, role });
  } catch (err) {
    next(err);
  }
};

// Delete user (admin only)
export const deleteUserAdmin = async (req, res, next) => {
  try {
    const { uid } = req.params;

    // Check if user has active listings or transactions
    const [check] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM product_seller WHERE sellerid = ?) as listings,
        (SELECT COUNT(*) FROM transaction WHERE buyerid = ? OR pid IN (SELECT pid FROM product_seller WHERE sellerid = ?)) as transactions
    `, [uid, uid, uid]);

    if (check[0].listings > 0 || check[0].transactions > 0) {
      return res.status(400).json({ 
        error: "Cannot delete user with active listings or transactions"
      });
    }

    const [result] = await pool.query("DELETE FROM users WHERE uid = ?", [uid]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted", uid });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin Controller - Product Management
 */

// List all products with moderation info
export const listAllProducts = async (req, res, next) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT 
        p.pid, 
        p.pname, 
        p.category, 
        p.price, 
        p.status,
        p.reserved_by,
        p.reserved_at,
        ps.sellerid,
        u.name as seller_name,
        u.email as seller_email,
        pi.img_url
      FROM products p
      INNER JOIN product_seller ps ON p.pid = ps.pid
      INNER JOIN users u ON ps.sellerid = u.uid
      LEFT JOIN (SELECT pid, MIN(img_url) AS img_url FROM prod_img GROUP BY pid) pi ON p.pid = pi.pid
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += " AND p.status = ?";
      params.push(status);
    }

    sql += " ORDER BY p.pid DESC";

    const [products] = await pool.query(sql, params);
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// Force delete product (admin override)
export const forceDeleteProduct = async (req, res, next) => {
  try {
    const { pid } = req.params;

    const [result] = await pool.query("DELETE FROM products WHERE pid = ?", [pid]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product force deleted", pid });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin Controller - Dashboard Stats
 */

export const getDashboardStats = async (req, res, next) => {
  try {
    const [stats] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE status = 'available') as available_products,
        (SELECT COUNT(*) FROM products WHERE status = 'sold') as sold_products,
        (SELECT COUNT(*) FROM transaction) as total_transactions,
        (SELECT SUM(p.price) FROM transaction t INNER JOIN products p ON t.pid = p.pid WHERE t.status = 'completed') as total_gmv,
        (SELECT COUNT(*) FROM otp_tokens WHERE used = true) as completed_otps,
        (SELECT COUNT(*) FROM add_to_wishlist) as total_wishlist_items
    `);

    res.json(stats[0]);
  } catch (err) {
    next(err);
  }
};
