import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/index.js";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || "8h";

const logAdminAction = async ({ adminId, actionType, targetType, targetId, details }) => {
  await pool.query(
    "INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)",
    [adminId, actionType, targetType, targetId, details ? JSON.stringify(details) : null]
  );
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
};

/**
 * POST /api/admin/login
 * Body: { email, password }
 * Response: { token, admin }
 * Sample Request:
 *   POST /api/admin/login
 *   { "email": "admin@campuskart.edu", "password": "Admin@123" }
 * Sample Response:
 *   { "token": "<jwt>", "admin": { "admin_id": 1, "email": "admin@campuskart.edu", "full_name": "Admin", "role": "super_admin" } }
 */
export const adminLogin = async (req, res, next) => {
  try {
    if (!ADMIN_JWT_SECRET) {
      return res.status(500).json({ error: "Admin JWT secret not configured" });
    }

    const { email, password } = req.body;

    const [admins] = await pool.query(
      "SELECT admin_id, email, password_hash, full_name, role, is_active FROM admin_users WHERE email = ?",
      [email]
    );

    if (admins.length === 0) {
      console.warn("[Admin Login Failed]", {
        email,
        reason: "admin_not_found",
        ip: getClientIp(req),
        db: process.env.DB_NAME || "(unset)",
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = admins[0];

    if (!admin.is_active) {
      await logAdminAction({
        adminId: admin.admin_id,
        actionType: "other",
        targetType: "other",
        targetId: admin.admin_id,
        details: { event: "admin_login_failed", reason: "account_disabled", ip: getClientIp(req) },
      });
      return res.status(403).json({ error: "Admin account disabled" });
    }

    const matches = await bcrypt.compare(password, admin.password_hash);
    if (!matches) {
      await logAdminAction({
        adminId: admin.admin_id,
        actionType: "other",
        targetType: "other",
        targetId: admin.admin_id,
        details: { event: "admin_login_failed", reason: "invalid_password", ip: getClientIp(req) },
      });
      console.warn("[Admin Login Failed]", {
        email: admin.email,
        reason: "invalid_password",
        hashLength: admin.password_hash?.length || 0,
        hashPrefix: admin.password_hash ? admin.password_hash.slice(0, 7) : null,
        ip: getClientIp(req),
        db: process.env.DB_NAME || "(unset)",
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { admin_id: admin.admin_id, role: admin.role, email: admin.email },
      ADMIN_JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES_IN }
    );

    await pool.query(
      "UPDATE admin_users SET last_login = NOW() WHERE admin_id = ?",
      [admin.admin_id]
    );

    await logAdminAction({
      adminId: admin.admin_id,
      actionType: "other",
      targetType: "other",
      targetId: admin.admin_id,
      details: { event: "admin_login", ip: getClientIp(req) },
    });

    res.json({
      token,
      admin: {
        admin_id: admin.admin_id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/logout
 * Response: { message }
 * Sample Response:
 *   { "message": "Logged out" }
 */
export const adminLogout = async (req, res, next) => {
  try {
    if (req.admin?.admin_id) {
      await logAdminAction({
        adminId: req.admin.admin_id,
        actionType: "other",
        targetType: "other",
        targetId: req.admin.admin_id,
        details: { event: "admin_logout" },
      });
    }

    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/me
 * Response: { admin }
 * Sample Response:
 *   { "admin": { "admin_id": 1, "email": "admin@campuskart.edu", "full_name": "Admin", "role": "super_admin" } }
 */
export const getAdminProfile = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    res.json({
      admin: {
        admin_id: req.admin.admin_id,
        email: req.admin.email,
        full_name: req.admin.full_name,
        role: req.admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
