/**
 * Simple Authentication Middleware
 * 
 * Since the project relies on localStorage and doesn't implement JWT/Session,
 * this middleware checks for specific headers to simulate authentication.
 * 
 * In a real production environment, this should be replaced with JWT validation.
 */
export const authenticate = (req, res, next) => {
    // Check for X-User-ID header (custom header we'll add in frontend)
    const userId = req.headers["x-user-id"];

    if (!userId) {
        // If no header, we can't authenticate. 
        // For protected routes, this results in 401.
        // We attach null to req.user so controllers know auth failed.
        req.user = null;
        return next();
    }

    // Basic "trust" of the client-provided ID for this scope
    req.user = {
        uid: parseInt(userId, 10)
    };

    next();
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
