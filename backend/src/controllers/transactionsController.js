import { pool } from "../db/index.js";

export const listTransactions = async (req, res, next) => {
  try {
    const { buyerid, pid, status, sellerid } = req.query;
    let sql =
      "SELECT t.tid, t.buyerid, bu.name AS buyer_name, t.pid, t.quantity, t.status, t.time_of_purchase, p.pname, p.price, ps.sellerid FROM `transaction` t LEFT JOIN products p ON t.pid = p.pid LEFT JOIN product_seller ps ON p.pid = ps.pid LEFT JOIN users bu ON t.buyerid = bu.uid WHERE 1=1";
    const params = [];

    if (buyerid) {
      sql += " AND t.buyerid = ?";
      params.push(buyerid);
    }
    if (pid) {
      sql += " AND t.pid = ?";
      params.push(pid);
    }
    if (status) {
      sql += " AND t.status = ?";
      params.push(status);
    }
    if (sellerid) {
      sql += " AND ps.sellerid = ?";
      params.push(sellerid);
    }

    // Order by newest first
    sql += " ORDER BY t.time_of_purchase DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const createTransaction = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { buyerid, pid, status } = req.body;
    if (!buyerid || !pid) {
      return res.status(400).json({ error: "buyerid, pid required" });
    }

    // CampusKart treats every product row as a single physical unit to avoid race conditions
    // and overselling. Even if a client sends a custom quantity we ignore it and always transact 1.
    const qty = 1;

    await connection.beginTransaction();

    const [productRows] = await connection.query(
      "SELECT no_of_copies, status FROM products WHERE pid = ?",
      [pid]
    );

    if (productRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    if (productRows[0].status !== "available") {
      await connection.rollback();
      return res.status(400).json({ error: "Product not available" });
    }

    if (productRows[0].no_of_copies < qty) {
      await connection.rollback();
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const [result] = await connection.query(
      "INSERT INTO `transaction` (buyerid, pid, quantity, status) VALUES (?, ?, ?, ?)",
      [buyerid, pid, qty, status || "pending"]
    );

    const remaining = productRows[0].no_of_copies - qty;
    const newStatus = remaining <= 0 ? "sold" : "available";

    await connection.query(
      "UPDATE products SET no_of_copies = ?, status = ? WHERE pid = ?",
      [remaining, newStatus, pid]
    );

    await connection.commit();

    res.status(201).json({
      tid: result.insertId,
      buyerid,
      pid,
      quantity: qty,
      status: status || "pending",
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const listMyPurchases = async (req, res, next) => {
  try {
    const buyerId = req.user?.uid;
    if (!buyerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const [rows] = await pool.query(
      `SELECT t.tid,
              p.pname AS product_name,
              seller.name AS seller_name,
              t.quantity,
              COALESCE(p.price, 0) * t.quantity AS amount,
              t.time_of_purchase
       FROM \`transaction\` t
       JOIN products p ON t.pid = p.pid
       JOIN product_seller ps ON p.pid = ps.pid
       JOIN users seller ON ps.sellerid = seller.uid
       WHERE t.buyerid = ?
       ORDER BY t.time_of_purchase DESC`,
      [buyerId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Analytics Endpoints (Admin)
 */

// Time-series analytics: transactions by hour/day/month
export const getTimeSeries = async (req, res, next) => {
  try {
    const { period = 'day', limit = 30 } = req.query;

    let sql;
    if (period === 'hour') {
      sql = `
        SELECT 
          DATE_FORMAT(time_of_purchase, '%Y-%m-%d %H:00:00') as period,
          COUNT(*) as transaction_count,
          SUM(p.price) as revenue
        FROM transaction t
        INNER JOIN products p ON t.pid = p.pid
        WHERE t.time_of_purchase >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY period
        ORDER BY period DESC
      `;
    } else if (period === 'day') {
      sql = `
        SELECT 
          DATE(time_of_purchase) as period,
          COUNT(*) as transaction_count,
          SUM(p.price) as revenue
        FROM transaction t
        INNER JOIN products p ON t.pid = p.pid
        WHERE t.time_of_purchase >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY period
        ORDER BY period DESC
      `;
    } else if (period === 'month') {
      sql = `
        SELECT 
          DATE_FORMAT(time_of_purchase, '%Y-%m') as period,
          COUNT(*) as transaction_count,
          SUM(p.price) as revenue
        FROM transaction t
        INNER JOIN products p ON t.pid = p.pid
        GROUP BY period
        ORDER BY period DESC
        LIMIT ?
      `;
    }

    const params = period === 'hour' ? [] : [parseInt(limit)];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Category analytics: which categories sell most
export const getCategoryAnalytics = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.pid) as products_count,
        COUNT(t.tid) as transactions_count,
        SUM(p.price) as total_revenue,
        AVG(p.price) as avg_price
      FROM products p
      LEFT JOIN transaction t ON p.pid = t.pid
      WHERE p.category IS NOT NULL AND p.category != ''
      GROUP BY p.category
      ORDER BY transactions_count DESC, total_revenue DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// User year analytics: which year students buy/sell more
export const getYearAnalytics = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.preferred_for as year,
        COUNT(DISTINCT p.pid) as products_count,
        COUNT(t.tid) as transactions_count,
        SUM(p.price) as total_revenue
      FROM products p
      LEFT JOIN transaction t ON p.pid = t.pid
      WHERE p.preferred_for IS NOT NULL AND p.preferred_for != ''
      GROUP BY p.preferred_for
      ORDER BY transactions_count DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Conversion funnel: available → reserved → location_selected → otp_generated → sold
export const getConversionFunnel = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM products
      GROUP BY status
      ORDER BY FIELD(status, 'available', 'reserved', 'location_proposed', 'location_selected', 'otp_generated', 'sold')
    `);

    const [otpStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_otps,
        SUM(CASE WHEN used = true THEN 1 ELSE 0 END) as used_otps
      FROM otp_tokens
    `);

    res.json({
      funnel: rows,
      otp_conversion: otpStats[0]
    });
  } catch (err) {
    next(err);
  }
};

// Export transactions to CSV
export const exportTransactionsCSV = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.tid,
        t.time_of_purchase,
        bu.name as buyer_name,
        bu.email as buyer_email,
        seller.name as seller_name,
        seller.email as seller_email,
        p.pname,
        p.category,
        p.price,
        t.quantity,
        t.status
      FROM transaction t
      INNER JOIN products p ON t.pid = p.pid
      INNER JOIN users bu ON t.buyerid = bu.uid
      INNER JOIN product_seller ps ON p.pid = ps.pid
      INNER JOIN users seller ON ps.sellerid = seller.uid
      ORDER BY t.time_of_purchase DESC
    `);

    // Convert to CSV
    const headers = Object.keys(rows[0] || {});
    const csvRows = [headers.join(',')];
    
    for (const row of rows) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

