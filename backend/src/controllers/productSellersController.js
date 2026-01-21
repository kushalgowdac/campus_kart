import { pool } from "../db/index.js";

export const listProductSellers = async (req, res, next) => {
  try {
    const { pid, sellerid } = req.query;
    let sql =
      "SELECT ps.pid, ps.sellerid, u.name AS seller_name FROM product_seller ps LEFT JOIN users u ON ps.sellerid = u.uid WHERE 1=1";
    const params = [];

    if (pid) {
      sql += " AND ps.pid = ?";
      params.push(pid);
    }
    if (sellerid) {
      sql += " AND ps.sellerid = ?";
      params.push(sellerid);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const upsertProductSeller = async (req, res, next) => {
  try {
    const { pid, sellerid } = req.body;
    if (!pid || !sellerid) {
      return res.status(400).json({ error: "pid, sellerid required" });
    }

    await pool.query(
      "INSERT INTO product_seller (pid, sellerid) VALUES (?, ?) ON DUPLICATE KEY UPDATE sellerid = VALUES(sellerid)",
      [pid, sellerid]
    );

    res.status(201).json({ pid, sellerid });
  } catch (err) {
    next(err);
  }
};

export const deleteProductSeller = async (req, res, next) => {
  try {
    const { pid } = req.params;
    const [result] = await pool.query(
      "DELETE FROM product_seller WHERE pid = ?",
      [pid]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Mapping not found" });
    }
    res.json({ message: "Mapping deleted" });
  } catch (err) {
    next(err);
  }
};
