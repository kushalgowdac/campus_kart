import { pool } from "../db/index.js";

export const listProductSpecs = async (req, res, next) => {
  try {
    const { pid } = req.query;
    let sql = "SELECT pid, spec_name, spec_value FROM prod_spec WHERE 1=1";
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

export const createProductSpec = async (req, res, next) => {
  try {
    const { pid, spec_name, spec_value } = req.body;
    if (!pid || !spec_name || !spec_value) {
      return res
        .status(400)
        .json({ error: "pid, spec_name, spec_value required" });
    }

    await pool.query(
      "INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES (?, ?, ?)",
      [pid, spec_name, spec_value]
    );

    res.status(201).json({ pid, spec_name, spec_value });
  } catch (err) {
    next(err);
  }
};

export const deleteProductSpec = async (req, res, next) => {
  try {
    const { pid, spec_name } = req.params;
    const [result] = await pool.query(
      "DELETE FROM prod_spec WHERE pid = ? AND spec_name = ?",
      [pid, spec_name]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Spec not found" });
    }
    res.json({ message: "Spec deleted" });
  } catch (err) {
    next(err);
  }
};
