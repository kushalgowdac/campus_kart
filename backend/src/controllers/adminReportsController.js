import { pool } from "../db/index.js";

const logAdminAction = async ({ adminId, actionType, targetType, targetId, details }) => {
  await pool.query(
    "INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)",
    [adminId, actionType, targetType, targetId, details ? JSON.stringify(details) : null]
  );
};

const toCsv = (rows) => {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((key) => escape(row[key])).join(","));
  });

  return lines.join("\n");
};

/**
 * GET /api/admin/reports/transactions?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Response: CSV file
 * Sample Response:
 *   Content-Type: text/csv
 *   tid,time_of_purchase,status,buyerid,pid,pname,price,sellerid
 */
export const exportTransactionsReport = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    const [rows] = await pool.query(
      `SELECT t.tid, t.time_of_purchase, t.status, t.buyerid,
              p.pid, p.pname, p.price,
              ps.sellerid
      FROM \`transaction\` t
       LEFT JOIN products p ON t.pid = p.pid
       LEFT JOIN product_seller ps ON t.pid = ps.pid
       WHERE DATE(t.time_of_purchase) BETWEEN ? AND ?
       ORDER BY t.time_of_purchase DESC`,
      [start, end]
    );

    const csv = toCsv(rows);
    await logAdminAction({
      adminId: req.admin.admin_id,
      actionType: "other",
      targetType: "transaction",
      targetId: 0,
      details: { report: "transactions", start, end },
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transactions_report.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/reports/users
 * Response: CSV file
 * Sample Response:
 *   Content-Type: text/csv
 *   uid,name,email,role,trust_points,is_suspended
 */
export const exportUsersReport = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.uid, u.name, u.email, u.role, u.trust_points,
              CASE WHEN us.is_active = true AND (us.suspended_until IS NULL OR us.suspended_until > NOW()) THEN 'yes' ELSE 'no' END AS is_suspended
       FROM users u
       LEFT JOIN (
         SELECT user_id, MAX(suspension_id) AS latest_suspension_id
         FROM user_suspensions
         GROUP BY user_id
       ) latest ON u.uid = latest.user_id
       LEFT JOIN user_suspensions us ON latest.latest_suspension_id = us.suspension_id
       ORDER BY u.uid DESC`
    );

    const csv = toCsv(rows);
    await logAdminAction({
      adminId: req.admin.admin_id,
      actionType: "other",
      targetType: "user",
      targetId: 0,
      details: { report: "users" },
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users_report.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/reports/flagged-activity
 * Response: JSON list of suspicious patterns
 * Sample Response:
 *   { "count": 1, "items": [{ "uid": 9, "flaggedCount": 3 }] }
 */
export const getFlaggedActivityReport = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.uid, u.name, u.email, COUNT(*) AS flaggedCount
       FROM product_verification pv
       INNER JOIN product_seller ps ON pv.product_id = ps.pid
       INNER JOIN users u ON ps.sellerid = u.uid
       WHERE pv.status = 'flagged'
       GROUP BY u.uid
       HAVING COUNT(*) >= 1
       ORDER BY flaggedCount DESC`
    );

    await logAdminAction({
      adminId: req.admin.admin_id,
      actionType: "other",
      targetType: "product",
      targetId: 0,
      details: { report: "flagged-activity" },
    });

    res.json({ count: rows.length, items: rows });
  } catch (err) {
    next(err);
  }
};
