import { pool } from "../db/index.js";

// TODO: Add caching layer for expensive analytics queries (e.g., Redis or in-memory cache).

/**
 * GET /api/admin/analytics/overview
 * Response: { totalUsers, totalProducts, totalTransactions, avgTrustScore, pendingVerifications }
 * Sample Response:
 *   { "totalUsers": 120, "totalProducts": 95, "totalTransactions": 40, "avgTrustScore": 22.5, "pendingVerifications": 3 }
 */
export const getOverview = async (req, res, next) => {
  try {
    const [[overview]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users) AS totalUsers,
        (SELECT COUNT(*) FROM products) AS totalProducts,
        (SELECT COUNT(*) FROM \`transaction\`) AS totalTransactions,
        (SELECT AVG(trust_points) FROM users) AS avgTrustScore,
        (SELECT COUNT(*) FROM product_verification WHERE status = 'pending') AS pendingVerifications`
    );

    res.json(overview);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/trends?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Sample Response:
 *   { "start": "2026-02-01", "end": "2026-02-02", "items": [{ "day": "2026-02-01", "newUsers": 3, "newProducts": 5, "completedTransactions": 2 }] }
 */
export const getTrends = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    const [[userCreatedAtCheck]] = await pool.query(
      `SELECT COUNT(*) AS hasCreatedAt
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'created_at'`
    );

    let newUsers = [];
    if (userCreatedAtCheck?.hasCreatedAt) {
      [newUsers] = await pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS newUsers
         FROM users
         WHERE DATE(created_at) BETWEEN ? AND ?
         GROUP BY day`,
        [start, end]
      );
    }

    const [newProducts] = await pool.query(
      `SELECT DATE(pv.created_at) AS day, COUNT(*) AS newProducts
       FROM product_verification pv
       WHERE DATE(pv.created_at) BETWEEN ? AND ?
       GROUP BY day`,
      [start, end]
    );

    const [transactions] = await pool.query(
      `SELECT DATE(time_of_purchase) AS day, COUNT(*) AS completedTransactions
      FROM \`transaction\`
       WHERE status = 'completed' AND DATE(time_of_purchase) BETWEEN ? AND ?
       GROUP BY day`,
      [start, end]
    );

    const map = {};

    newUsers.forEach((row) => {
      map[row.day] = { day: row.day, newUsers: row.newUsers, newProducts: 0, completedTransactions: 0 };
    });

    newProducts.forEach((row) => {
      map[row.day] = map[row.day] || { day: row.day, newUsers: 0, newProducts: 0, completedTransactions: 0 };
      map[row.day].newProducts = row.newProducts;
    });

    transactions.forEach((row) => {
      map[row.day] = map[row.day] || { day: row.day, newUsers: 0, newProducts: 0, completedTransactions: 0 };
      map[row.day].completedTransactions = row.completedTransactions;
    });

    const result = Object.values(map).sort((a, b) => new Date(a.day) - new Date(b.day));

    res.json({
      start,
      end,
      items: result,
      notes: userCreatedAtCheck?.hasCreatedAt ? [] : ["users.created_at missing: newUsers trend unavailable"],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/categories
 * Sample Response:
 *   { "count": 3, "items": [{ "category": "Books", "productCount": 10, "avgPrice": 320.5, "totalRevenue": 1200 }] }
 */
export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.category,
              COUNT(*) AS productCount,
              AVG(p.price) AS avgPrice,
              SUM(CASE WHEN t.status = 'completed' THEN p.price ELSE 0 END) AS totalRevenue
       FROM products p
      LEFT JOIN \`transaction\` t ON p.pid = t.pid
       GROUP BY p.category
       ORDER BY productCount DESC`
    );

    res.json({ count: rows.length, items: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/locations
 * Sample Response:
 *   { "count": 2, "items": [{ "location": "Kriyakalpa", "frequency": 8 }] }
 */
export const getLocationStats = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT location, COUNT(*) AS frequency
       FROM prod_loc
       WHERE is_selected = true
       GROUP BY location
       ORDER BY frequency DESC`
    );

    res.json({ count: rows.length, items: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/trust-distribution
 * Sample Response:
 *   { "items": [{ "bucket": "0-20", "userCount": 18 }] }
 */
export const getTrustDistribution = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        CASE
          WHEN trust_points BETWEEN 0 AND 20 THEN '0-20'
          WHEN trust_points BETWEEN 21 AND 40 THEN '21-40'
          WHEN trust_points BETWEEN 41 AND 60 THEN '41-60'
          WHEN trust_points BETWEEN 61 AND 80 THEN '61-80'
          WHEN trust_points BETWEEN 81 AND 100 THEN '81-100'
          ELSE '101+'
        END AS bucket,
        COUNT(*) AS userCount
       FROM users
       GROUP BY bucket
       ORDER BY MIN(trust_points)`
    );

    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/abandonment
 * Sample Response:
 *   { "created": 100, "reserved": 60, "locationSelected": 40, "otpGenerated": 30, "completed": 25 }
 */
export const getAbandonmentFunnel = async (req, res, next) => {
  try {
    const [[totals]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM products) AS created,
        (SELECT COUNT(*) FROM products WHERE status = 'reserved') AS reserved,
        (SELECT COUNT(*) FROM products WHERE status = 'location_selected') AS locationSelected,
        (SELECT COUNT(*) FROM products WHERE status = 'otp_generated') AS otpGenerated,
        (SELECT COUNT(*) FROM products WHERE status = 'sold') AS completed`
    );

    res.json(totals);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/peak-times
 * Sample Response:
 *   { "items": [{ "dayOfWeek": 2, "hour": 14, "count": 4 }] }
 */
export const getPeakTimes = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT DAYOFWEEK(time_of_purchase) AS dayOfWeek,
              HOUR(time_of_purchase) AS hour,
              COUNT(*) AS count
      FROM \`transaction\`
       WHERE status = 'completed'
       GROUP BY dayOfWeek, hour
       ORDER BY dayOfWeek, hour`
    );

    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
};
