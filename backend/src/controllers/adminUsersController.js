import { pool } from "../db/index.js";

const logAdminAction = async ({ adminId, actionType, targetType, targetId, details }) => {
  await pool.query(
    "INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)",
    [adminId, actionType, targetType, targetId, details ? JSON.stringify(details) : null]
  );
};

/**
 * GET /api/admin/users
 * Query: suspended=true|false, trust_min, trust_max
 * Sample Response:
 *   { "count": 2, "items": [{ "uid": 5, "name": "Asha", "is_suspended": 0 }] }
 */
export const listUsersAdmin = async (req, res, next) => {
  try {
    const { suspended, trust_min, trust_max } = req.query;

    let sql = `
      SELECT u.uid, u.name, u.email, u.role, u.trust_points,
             CASE WHEN us.is_active = true AND (us.suspended_until IS NULL OR us.suspended_until > NOW()) THEN 1 ELSE 0 END AS is_suspended,
             us.suspended_until
      FROM users u
      LEFT JOIN (
        SELECT user_id, MAX(suspension_id) AS latest_suspension_id
        FROM user_suspensions
        GROUP BY user_id
      ) latest ON u.uid = latest.user_id
      LEFT JOIN user_suspensions us ON latest.latest_suspension_id = us.suspension_id
      WHERE 1=1
    `;

    const params = [];

    if (trust_min) {
      sql += " AND u.trust_points >= ?";
      params.push(Number(trust_min));
    }

    if (trust_max) {
      sql += " AND u.trust_points <= ?";
      params.push(Number(trust_max));
    }

    if (suspended === "true") {
      sql += " AND us.is_active = true AND (us.suspended_until IS NULL OR us.suspended_until > NOW())";
    }

    if (suspended === "false") {
      sql += " AND (us.is_active IS NULL OR us.is_active = false OR us.suspended_until <= NOW())";
    }

    sql += " ORDER BY u.uid DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ count: rows.length, items: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/:id
 * Returns user profile + transaction history
 * Sample Response:
 *   { "user": { "uid": 5, "name": "Asha" }, "purchases": [], "sales": [] }
 */
export const getUserProfileAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[user]] = await pool.query(
      `SELECT u.uid, u.name, u.email, u.role, u.trust_points,
              COUNT(DISTINCT ps.pid) AS listings_count,
              COUNT(DISTINCT t.tid) AS purchases_count
       FROM users u
       LEFT JOIN product_seller ps ON u.uid = ps.sellerid
      LEFT JOIN \`transaction\` t ON u.uid = t.buyerid
       WHERE u.uid = ?
       GROUP BY u.uid`,
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const [transactions] = await pool.query(
      `SELECT t.tid, t.pid, p.pname, p.price, t.status, t.time_of_purchase
      FROM \`transaction\` t
       LEFT JOIN products p ON t.pid = p.pid
       WHERE t.buyerid = ?
       ORDER BY t.time_of_purchase DESC
       LIMIT 50`,
      [id]
    );

    const [sales] = await pool.query(
      `SELECT t.tid, t.pid, p.pname, p.price, t.status, t.time_of_purchase
      FROM \`transaction\` t
       INNER JOIN product_seller ps ON t.pid = ps.pid
       INNER JOIN products p ON t.pid = p.pid
       WHERE ps.sellerid = ?
       ORDER BY t.time_of_purchase DESC
       LIMIT 50`,
      [id]
    );

    res.json({ user, purchases: transactions, sales });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users/:id/suspend
 * Body: { reason, duration_days }
 * Sample Request:
 *   { "reason": "Repeated spam", "duration_days": 7 }
 * Sample Response:
 *   { "message": "User suspended", "suspension_id": 10 }
 */
export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, duration_days } = req.body;

    const duration = duration_days ? Number(duration_days) : null;
    let result;

    if (duration) {
      [result] = await pool.query(
        `INSERT INTO user_suspensions (user_id, suspended_by, reason, suspended_until, is_active)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), true)`,
        [id, req.admin.admin_id, reason, duration]
      );
    } else {
      [result] = await pool.query(
        `INSERT INTO user_suspensions (user_id, suspended_by, reason, suspended_until, is_active)
         VALUES (?, ?, ?, NULL, true)`,
        [id, req.admin.admin_id, reason]
      );
    }

    await logAdminAction({
      adminId: req.admin.admin_id,
      actionType: "suspended_user",
      targetType: "user",
      targetId: Number(id),
      details: { reason, duration_days: duration_days || null },
    });

    res.json({ message: "User suspended", suspension_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users/:id/unsuspend
 * Sample Response:
 *   { "message": "User unsuspended" }
 */
export const unsuspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const [result] = await pool.query(
      `UPDATE user_suspensions
       SET is_active = false, lifted_by = ?, lifted_at = NOW(), lift_reason = ?
       WHERE user_id = ? AND is_active = true
       ORDER BY suspended_at DESC
       LIMIT 1`,
      [req.admin.admin_id, reason || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No active suspension found" });
    }

    await logAdminAction({
      adminId: req.admin.admin_id,
      actionType: "unsuspended_user",
      targetType: "user",
      targetId: Number(id),
      details: { reason: reason || null },
    });

    res.json({ message: "User unsuspended" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/:id/activity
 * Sample Response:
 *   { "listings": [], "purchases": [], "sales": [] }
 */
export const getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [listings] = await pool.query(
      `SELECT p.pid, p.pname, p.status, p.price, p.category
       FROM products p
       INNER JOIN product_seller ps ON p.pid = ps.pid
       WHERE ps.sellerid = ?
       ORDER BY p.pid DESC
       LIMIT 10`,
      [id]
    );

    const [purchases] = await pool.query(
      `SELECT t.tid, t.pid, p.pname, t.status, t.time_of_purchase
       FROM \`transaction\` t
       LEFT JOIN products p ON t.pid = p.pid
       WHERE t.buyerid = ?
       ORDER BY t.time_of_purchase DESC
       LIMIT 10`,
      [id]
    );

    const [sales] = await pool.query(
      `SELECT t.tid, t.pid, p.pname, t.status, t.time_of_purchase
       FROM \`transaction\` t
       INNER JOIN product_seller ps ON t.pid = ps.pid
       INNER JOIN products p ON t.pid = p.pid
       WHERE ps.sellerid = ?
       ORDER BY t.time_of_purchase DESC
       LIMIT 10`,
      [id]
    );

    res.json({ listings, purchases, sales });
  } catch (err) {
    next(err);
  }
};
