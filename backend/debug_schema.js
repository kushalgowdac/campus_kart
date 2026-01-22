import { pool } from "./src/db/index.js";

async function checkSchema() {
    const conn = await pool.getConnection();
    try {
        console.log("Checking 'products' table columns...");
        const [columns] = await conn.query("SHOW COLUMNS FROM products");
        console.log(columns.map(c => `${c.Field} (${c.Type})`).join("\n"));

        console.log("\nChecking 'otp_tokens' table...");
        const [tables] = await conn.query("SHOW TABLES LIKE 'otp_tokens'");
        if (tables.length > 0) {
            console.log("otp_tokens table EXISTS");
        } else {
            console.log("otp_tokens table MISSING");
        }
    } catch (err) {
        console.error(err);
    } finally {
        conn.release();
        process.exit();
    }
}

checkSchema();
