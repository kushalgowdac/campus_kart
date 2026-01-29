import { pool } from "../db/index.js";
import { TRUST_POINTS, computeAndAwardBadges } from "../services/gamificationService.js";

const RVCE_DOMAIN = "@rvce.edu.in";

const isRvceEmail = (email) => {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(RVCE_DOMAIN);
};

export const listUsers = async (req, res, next) => {
  try {
    // Only expose RVCE accounts to align with login restrictions
    const [rows] = await pool.query(
      "SELECT uid, name, email FROM users WHERE LOWER(email) LIKE ?",
      [`%${RVCE_DOMAIN}`]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT uid, name, email FROM users WHERE uid = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password required" });
    }

    if (!isRvceEmail(email)) {
      console.error("[createUser] Rejected non-RVCE email", { email });
      return res.status(400).json({ error: "Only RVCE email IDs are allowed." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, trust_points) VALUES (?, ?, ?, ?)",
      [name, normalizedEmail, password, TRUST_POINTS.SIGNUP]
    );

    // Best-effort badge evaluation; never block signup on gamification.
    try {
      await computeAndAwardBadges({ uid: result.insertId });
    } catch (err) {
      console.warn("[createUser] Gamification award failed", err?.message || err);
    }

    res.status(201).json({
      uid: result.insertId,
      name,
      email: normalizedEmail,
      trustPoints: TRUST_POINTS.SIGNUP,
    });
  } catch (err) {
    // Improve debuggability: surface the underlying MySQL error in logs
    console.error("[createUser] Failed to insert user", {
      code: err?.code,
      errno: err?.errno,
      sqlState: err?.sqlState,
      sqlMessage: err?.sqlMessage,
    });

    // Handle common MySQL constraint errors gracefully
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already registered" });
    }

    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    if (email != null && !isRvceEmail(email)) {
      console.error("[updateUser] Rejected non-RVCE email", { id, email });
      return res.status(400).json({ error: "Only RVCE email IDs are allowed." });
    }

    const normalizedEmail = email == null ? email : email.trim().toLowerCase();

    const [result] = await pool.query(
      "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), password = COALESCE(?, password) WHERE uid = ?",
      [name, normalizedEmail, password, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User updated" });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM users WHERE uid = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};
