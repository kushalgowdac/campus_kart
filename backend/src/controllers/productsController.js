import { pool } from "../db/index.js";

export const listProducts = async (req, res, next) => {
  try {
    const { category, sellerid, status, q } = req.query;

    let sql =
      "SELECT p.pid, p.pname, p.category, p.price, p.status, p.bought_year, p.preferred_for, p.no_of_copies, ps.sellerid, u.name AS seller_name, pi.img_url FROM products p LEFT JOIN product_seller ps ON p.pid = ps.pid LEFT JOIN users u ON ps.sellerid = u.uid LEFT JOIN (SELECT pid, MIN(img_url) AS img_url FROM prod_img GROUP BY pid) pi ON p.pid = pi.pid WHERE 1=1";
    const params = [];

    if (category) {
      sql += " AND p.category = ?";
      params.push(category);
    }
    if (sellerid) {
      sql += " AND ps.sellerid = ?";
      params.push(sellerid);
    }
    if (status) {
      sql += " AND p.status = ?";
      params.push(status);
    }
    if (q) {
      sql += " AND p.pname LIKE ?";
      params.push(`%${q}%`);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT p.pid, p.pname, p.category, p.price, p.status, p.bought_year, p.preferred_for, p.no_of_copies, ps.sellerid, u.name AS seller_name, pi.img_url FROM products p LEFT JOIN product_seller ps ON p.pid = ps.pid LEFT JOIN users u ON ps.sellerid = u.uid LEFT JOIN (SELECT pid, MIN(img_url) AS img_url FROM prod_img GROUP BY pid) pi ON p.pid = pi.pid WHERE p.pid = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      pname,
      category,
      price,
      status,
      bought_year,
      preferred_for,
      no_of_copies,
      sellerid,
      image_url,
    } = req.body;
    if (!pname || price == null) {
      return res.status(400).json({ error: "pname, price required" });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        pname,
        category || null,
        price,
        status || "available",
        bought_year || null,
        preferred_for || null,
        no_of_copies ?? 1,
      ]
    );

    if (sellerid) {
      await connection.query(
        "INSERT INTO product_seller (pid, sellerid) VALUES (?, ?)",
        [result.insertId, sellerid]
      );
    }

    if (image_url) {
      await connection.query(
        "INSERT INTO prod_img (pid, img_url) VALUES (?, ?)",
        [result.insertId, image_url]
      );
    }

    await connection.commit();

    res.status(201).json({
      pid: result.insertId,
      pname,
      category: category || null,
      price,
      status: status || "available",
      bought_year: bought_year || null,
      preferred_for: preferred_for || null,
      no_of_copies: no_of_copies ?? 1,
      sellerid: sellerid || null,
      image_url: image_url || null,
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const updateProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      pname,
      category,
      price,
      status,
      bought_year,
      preferred_for,
      no_of_copies,
      sellerid,
    } = req.body;

    await connection.beginTransaction();

    const [result] = await connection.query(
      "UPDATE products SET pname = COALESCE(?, pname), category = COALESCE(?, category), price = COALESCE(?, price), status = COALESCE(?, status), bought_year = COALESCE(?, bought_year), preferred_for = COALESCE(?, preferred_for), no_of_copies = COALESCE(?, no_of_copies) WHERE pid = ?",
      [
        pname,
        category,
        price,
        status,
        bought_year,
        preferred_for,
        no_of_copies,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    if (sellerid) {
      await connection.query(
        "INSERT INTO product_seller (pid, sellerid) VALUES (?, ?) ON DUPLICATE KEY UPDATE sellerid = VALUES(sellerid)",
        [id, sellerid]
      );
    }

    await connection.commit();

    res.json({ message: "Product updated" });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM products WHERE pid = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};
