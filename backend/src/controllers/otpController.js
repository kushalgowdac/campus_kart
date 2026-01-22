import { pool } from "../db/index.js";
import bcrypt from "bcrypt";

/**
 * OTP Verification Controller with Security Hardening
 * 
 * Security Features:
 * - Dual-row locking (otp_tokens + products) in single transaction
 * - Failed attempt limit (5 max) checked BEFORE validation
 * - Expiration validation
 * - Seller authorization enforcement
 * - Async bcrypt for secure OTP comparison
 */

export const verifyOTP = async (req, res, next) => {
    const { productId, otp } = req.body;
    const sellerId = req.user?.uid; // Assuming auth middleware sets req.user

    if (!productId || !otp) {
        return res.status(400).json({ error: "productId and otp are required" });
    }

    if (!sellerId) {
        return res.status(401).json({ error: "Authentication required" });
    }

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 🔒 CRITICAL: Lock OTP row first
        const [otpRows] = await conn.query(
            'SELECT * FROM otp_tokens WHERE product_id = ? AND used = false FOR UPDATE',
            [productId]
        );

        if (otpRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "No active OTP found for this product" });
        }

        const otpToken = otpRows[0];

        // 🔴 FIX 1: Check failed attempts BEFORE validation
        if (otpToken.failed_attempts >= 5) {
            await conn.rollback();
            return res.status(403).json({ error: "OTP locked due to too many attempts" });
        }

        // 🔴 FIX 2: Validate expiration
        if (new Date(otpToken.expires_at) < new Date()) {
            await conn.rollback();
            return res.status(400).json({ error: "OTP expired" });
        }

        // 🔒 CRITICAL: Lock product row with seller join
        const [productRows] = await conn.query(
            'SELECT p.*, ps.sellerid FROM products p JOIN product_seller ps ON p.pid = ps.pid WHERE p.pid = ? FOR UPDATE',
            [productId]
        );

        if (productRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Product not found" });
        }

        const product = productRows[0];

        // 🔴 GLOBAL BLOCKING RULE: No actions if reschedule requested
        if (product.reschedule_requested_by) {
            await conn.rollback();
            return res.status(400).json({
                error: "Action blocked: Reschedule requested. Please accept or reject the request."
            });
        }

        // 🔴 FIX 3: Verify seller authorization
        if (product.sellerid !== sellerId) {
            await conn.rollback();
            return res.status(403).json({ error: "Unauthorized: Only product seller can verify OTP" });
        }

        // Validate product state
        if (product.status !== 'otp_generated') {
            await conn.rollback();
            return res.status(400).json({
                error: `Invalid product status: ${product.status}. Expected: otp_generated`
            });
        }

        // Use async bcrypt.compare() for OTP validation
        const isValid = await bcrypt.compare(otp, otpToken.otp_hash);

        if (isValid) {
            // ✅ Valid OTP - Update both atomically
            await conn.query(
                'UPDATE otp_tokens SET used = true WHERE otp_id = ?',
                [otpToken.otp_id]
            );

            await conn.query(
                "UPDATE products SET status = 'sold' WHERE pid = ?",
                [productId]
            );

            await conn.commit();

            return res.json({
                success: true,
                message: "Product verified and marked as sold"
            });
        } else {
            // ❌ Invalid OTP - Increment failed attempts
            const newFailedAttempts = otpToken.failed_attempts + 1;

            await conn.query(
                'UPDATE otp_tokens SET failed_attempts = ? WHERE otp_id = ?',
                [newFailedAttempts, otpToken.otp_id]
            );

            // 🔴 FIX 1b: Lock OTP after 5 failed attempts
            if (newFailedAttempts >= 5) {
                await conn.query(
                    'UPDATE otp_tokens SET used = true WHERE otp_id = ?',
                    [otpToken.otp_id]
                );
            }

            await conn.commit();

            const attemptsRemaining = 5 - newFailedAttempts;
            return res.status(400).json({
                error: `Invalid OTP. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining`
            });
        }

    } catch (err) {
        await conn.rollback();
        console.error('[OTP Verify Error]:', err);
        next(err);
    } finally {
        conn.release();
    }
};
