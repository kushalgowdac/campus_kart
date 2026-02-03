import { pool } from "../db/index.js";

/**
 * Simple Authentication Middleware
 * 
 * Since the project relies on localStorage and doesn't implement JWT/Session,
 * this middleware checks for specific headers to simulate authentication.
 * 
 * In a real production environment, this should be replaced with JWT validation.
 */
export const authenticate = async (req, res, next) => {
    // Check for X-User-ID header (custom header we'll add in frontend)
    const userId = req.headers["x-user-id"];

    if (!userId) {
        // If no header, we can't authenticate. 
        // For protected routes, this results in 401.
        // We attach null to req.user so controllers know auth failed.
        req.user = null;
        return next();
    }

    try {
        // Fetch user with role for RBAC
        const [users] = await pool.query("SELECT uid, name, email, role FROM users WHERE uid = ?", [userId]);
        
        if (users.length === 0) {
            req.user = null;
            return next();
        }

        // Attach user with role to request
        req.user = {
            uid: users[0].uid,
            name: users[0].name,
            email: users[0].email,
            role: users[0].role || 'user'
        };

        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        req.user = null;
        next();
    }
};

/**
 * Middleware to strictly require authentication
 */
export const requireAuth = (req, res, next) => {
    if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
};

/**
 * Middleware to require specific role
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).json({ error: "Authentication required" });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        
        next();
    };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin');
