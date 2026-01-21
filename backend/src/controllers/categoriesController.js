import { pool } from "../db/index.js";

export const listCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT category_id, category_name FROM categories"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ error: "category_name required" });
    }

    const [result] = await pool.query(
      "INSERT INTO categories (category_name) VALUES (?)",
      [category_name]
    );

    res.status(201).json({
      category_id: result.insertId,
      category_name,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;
    const [result] = await pool.query(
      "UPDATE categories SET category_name = COALESCE(?, category_name) WHERE category_id = ?",
      [category_name, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category updated" });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM categories WHERE category_id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};
