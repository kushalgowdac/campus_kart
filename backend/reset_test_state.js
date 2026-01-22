// Utility to reset product 1 for testing reschedule
import { pool } from "./src/db/index.js";

async function resetForReschedule() {
    console.log("=== Resetting Product 1 for Reschedule Test ===\n");
    const connection = await pool.getConnection();

    try {
        const pid = 1;
        const buyerId = 2; // Assuming user 2 is buyer, change if needed

        console.log("1. Updating product status...");
        await connection.query(
            "UPDATE products SET status = 'location_selected', reserved_by = ? WHERE pid = ?",
            [buyerId, pid]
        );

        console.log("2. Setting dummy location selection...");
        // Clear old
        await connection.query("DELETE FROM prod_loc WHERE pid = ?", [pid]);
        // Insert new selected
        await connection.query(
            "INSERT INTO prod_loc (pid, location, is_selected) VALUES (?, 'Mingos', true)",
            [pid]
        );

        console.log("\n✅ Product 1 reset to 'location_selected' status.");
        console.log("   Seller (User 1) and Buyer (User 2) should now see the Reschedule button.");

    } catch (err) {
        console.error("❌ Failed:", err);
    } finally {
        connection.release();
        process.exit();
    }
}

resetForReschedule();
