// Force Reset State
import { pool } from "./src/db/index.js";

async function reset() {
    console.log("Resetting Product 1...");
    const conn = await pool.getConnection();
    try {
        await conn.query("UPDATE products SET status = 'location_selected', reschedule_requested_by = NULL WHERE pid = 1");
        await conn.query("UPDATE prod_loc SET is_selected = true WHERE pid = 1 LIMIT 1"); // Ensure one is selected
        console.log("DONE: Reset to location_selected");
    } catch (e) {
        console.error(e);
    } finally {
        conn.release();
        process.exit();
    }
}
reset();
