import { pool } from "../db/index.js";

export const listImages = async (req, res, next) => {
  try {
    const { pid } = req.query;
    let sql = "SELECT pid, img_url FROM prod_img WHERE 1=1";
    const params = [];
    if (pid) {
      sql += " AND pid = ?";
      params.push(pid);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const createImage = async (req, res, next) => {
  try {
    const { pid, img_url } = req.body;
    if (!pid || !img_url) {
      return res.status(400).json({ error: "pid, img_url required" });
    }

    await pool.query("INSERT INTO prod_img (pid, img_url) VALUES (?, ?)", [
      pid,
      img_url,
    ]);

    res.status(201).json({ pid, img_url });
  } catch (err) {
    next(err);
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const { pid, img_url } = req.params;
    const [result] = await pool.query(
      "DELETE FROM prod_img WHERE pid = ? AND img_url = ?",
      [pid, img_url]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.json({ message: "Image deleted" });
  } catch (err) {
    next(err);
  }
};
