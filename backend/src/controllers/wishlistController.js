import { pool } from "../db/index.js";

export const listWishlist = async (req, res, next) => {
  try {
    const { uid } = req.query;
    let sql =
      "SELECT w.uid, w.pid, p.pname, p.price, p.status FROM add_to_wishlist w LEFT JOIN products p ON w.pid = p.pid WHERE 1=1";
    const params = [];
    if (uid) {
      sql += " AND w.uid = ?";
      params.push(uid);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const addWishlistItem = async (req, res, next) => {
  try {
    const { uid, pid } = req.body;
    if (!uid || !pid) {
      return res.status(400).json({ error: "uid, pid required" });
    }

    await pool.query("INSERT INTO add_to_wishlist (uid, pid) VALUES (?, ?)", [
      uid,
      pid,
    ]);

    res.status(201).json({ uid, pid });
  } catch (err) {
    next(err);
  }
};

export const removeWishlistItem = async (req, res, next) => {
  try {
    const { uid, pid } = req.params;
    const [result] = await pool.query(
      "DELETE FROM add_to_wishlist WHERE uid = ? AND pid = ?",
      [uid, pid]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }
    res.json({ message: "Wishlist item removed" });
  } catch (err) {
    next(err);
  }
};
