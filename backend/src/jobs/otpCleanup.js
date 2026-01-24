import { pool } from "../db/index.js";

/**
 * Cleanup job for expired OTPs and abandoned reservations
 * Runs periodically to maintain system hygiene
 */
export async function cleanupExpiredOTPs() {
    const conn = await pool.getConnection();

    // 🔴 FIX 4: Wrap in transaction for atomicity
    await conn.beginTransaction();
    try {
        // 1. Mark expired OTPs as used
        // This prevents them from being verified even if other checks fail
        const [otpResult] = await conn.query(
            'UPDATE otp_tokens SET used = true WHERE expires_at < NOW() AND used = false'
        );

        // 2. Reset products with expired reservations (>30 min)
        // Includes all workflow states from reserved through otp_generated
        const [productResult] = await conn.query(
            // Intentionally excludes 'sold' to protect completed orders
            "UPDATE products SET status = 'available', reserved_by = NULL, reserved_at = NULL WHERE status IN ('reserved', 'location_proposed', 'location_selected', 'otp_generated') AND status <> 'sold' AND reserved_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)"
        );

        // 3. Clean up orphaned location selections for available products
        const [locResult] = await conn.query(
            "DELETE FROM prod_loc WHERE pid IN (SELECT pid FROM products WHERE status = 'available')"
        );

        // 🔴 FIX 2: Auto-clear stale reschedule requests (>30 mins)
        const [staleRequestResult] = await conn.query(
            "UPDATE products SET reschedule_requested_by = NULL WHERE reschedule_requested_by IS NOT NULL AND reserved_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)"
        );

        await conn.commit();

        if (otpResult.affectedRows > 0 || productResult.affectedRows > 0 || locResult.affectedRows > 0 || staleRequestResult.affectedRows > 0) {
            console.log(`[Cleanup] Expired ${otpResult.affectedRows} OTPs, reset ${productResult.affectedRows} products, cleaned ${locResult.affectedRows} locs, cleared ${staleRequestResult.affectedRows} stale requests`);
        }
    } catch (err) {
        await conn.rollback();
        console.error('[Cleanup] Error:', err.message);
    } finally {
        conn.release();
    }
}

export function startOTPCleanup() {
    // Run immediately on start
    cleanupExpiredOTPs();

    // Then run every 5 minutes
    setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);
    console.log('[Cleanup] OTP cleanup job started');
}
