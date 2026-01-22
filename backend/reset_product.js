import { pool } from "./src/db/index.js";

async function resetProduct() {
    console.log('Resetting Product 1...');
    const conn = await pool.getConnection();
    try {
        await conn.query("UPDATE products SET status = 'available', reserved_by = NULL WHERE pid = 1");
        await conn.query("DELETE FROM prod_loc WHERE pid = 1");
        await conn.query("DELETE FROM otp_tokens WHERE product_id = 1");
        console.log('✅ Product 1 reset to available');
    } catch (err) {
        console.error(err);
    } finally {
        conn.release();
        await pool.end();
    }
}
resetProduct();
