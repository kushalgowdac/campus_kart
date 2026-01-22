// Clear Reschedule
import { pool } from "./src/db/index.js";

async function run() {
    const conn = await pool.getConnection();
    await conn.query("UPDATE products SET reschedule_requested_by = NULL WHERE pid = 1");
    // Ensure product is in a valid state (e.g., location_selected)
    await conn.query("UPDATE products SET status = 'location_selected' WHERE pid = 1");
    console.log("CLEARED");
    conn.release();
    process.exit();
}
run();
