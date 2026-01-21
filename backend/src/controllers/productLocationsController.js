import { pool } from "../db/index.js";

export const listProductLocations = async (req, res, next) => {
  try {
    const { pid } = req.query;
    let sql = "SELECT pid, location FROM prod_loc WHERE 1=1";
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

export const createProductLocation = async (req, res, next) => {
  try {
    const { pid, location } = req.body;
    if (!pid || !location) {
      return res.status(400).json({ error: "pid, location required" });
    }

    await pool.query("INSERT INTO prod_loc (pid, location) VALUES (?, ?)", [
      pid,
      location,
    ]);

    res.status(201).json({ pid, location });
  } catch (err) {
    next(err);
  }
};

export const deleteProductLocation = async (req, res, next) => {
  try {
    const { pid, location } = req.params;
    const [result] = await pool.query(
      "DELETE FROM prod_loc WHERE pid = ? AND location = ?",
      [pid, location]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json({ message: "Location deleted" });
  } catch (err) {
    next(err);
  }
};
