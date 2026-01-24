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
