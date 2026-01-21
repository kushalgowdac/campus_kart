import { pool } from "../db/index.js";

export const listOrders = async (req, res, next) => {
  try {
    const { buyer_id } = req.query;
    let sql =
      "SELECT o.order_id, o.buyer_id, o.product_id, o.total_amount, o.quantity, o.date, p.name AS product_name FROM orders o LEFT JOIN products p ON o.product_id = p.product_id WHERE 1=1";
    const params = [];

    if (buyer_id) {
      sql += " AND o.buyer_id = ?";
      params.push(buyer_id);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT o.order_id, o.buyer_id, o.product_id, o.total_amount, o.quantity, o.date, p.name AS product_name FROM orders o LEFT JOIN products p ON o.product_id = p.product_id WHERE o.order_id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createOrder = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { buyer_id, product_id, quantity, total_amount } = req.body;
    if (!buyer_id || !product_id) {
      return res.status(400).json({ error: "buyer_id, product_id required" });
    }

    await connection.beginTransaction();

    const [productRows] = await connection.query(
      "SELECT price, status FROM products WHERE product_id = ?",
      [product_id]
    );

    if (productRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    if (productRows[0].status !== "available") {
      await connection.rollback();
      return res.status(400).json({ error: "Product not available" });
    }

    const qty = quantity && Number(quantity) > 0 ? Number(quantity) : 1;
    const computedTotal = total_amount || productRows[0].price * qty;

    const [result] = await connection.query(
      "INSERT INTO orders (buyer_id, product_id, total_amount, quantity) VALUES (?, ?, ?, ?)",
      [buyer_id, product_id, computedTotal, qty]
    );

    await connection.query(
      "UPDATE products SET status = 'sold' WHERE product_id = ?",
      [product_id]
    );

    await connection.commit();

    res.status(201).json({
      order_id: result.insertId,
      buyer_id,
      product_id,
      total_amount: computedTotal,
      quantity: qty,
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM orders WHERE order_id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ message: "Order deleted" });
  } catch (err) {
    next(err);
  }
};
