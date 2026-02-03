import jwt from "jsonwebtoken";
import { pool } from "../db/index.js";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

const buildAuthError = (res, message = "Admin authentication required") => {
  return res.status(401).json({ error: message });
};

export const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return buildAuthError(res);
    }

    if (!ADMIN_JWT_SECRET) {
      return res.status(500).json({ error: "Admin JWT secret not configured" });
    }

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

    const [admins] = await pool.query(
      "SELECT admin_id, email, full_name, role, is_active FROM admin_users WHERE admin_id = ?",
      [decoded.admin_id]
    );

    if (admins.length === 0 || !admins[0].is_active) {
      return buildAuthError(res, "Admin account not active");
    }

    req.admin = admins[0];
    next();
  } catch (err) {
    return buildAuthError(res, "Invalid or expired admin token");
  }
};

export const requireAdminRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return buildAuthError(res);
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: "Insufficient admin permissions" });
    }

    next();
  };
};
