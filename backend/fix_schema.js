import { pool } from "./src/db/index.js";

async function fixSchema() {
    const conn = await pool.getConnection();
    try {
        console.log("Fixing schema...");

        // Force add columns if missing (ignoring error if exists is hard in standard SQL without proc, 
        // so we just try and catch)

        try {
            await conn.query(`
                ALTER TABLE products 
                ADD COLUMN reserved_by INT DEFAULT NULL,
                ADD COLUMN reserved_at DATETIME DEFAULT NULL
            `);
            console.log("Columns added.");
        } catch (e) {
            console.log("Columns probably exist:", e.code);
        }

        try {
            await conn.query(`
                ALTER TABLE products 
                ADD CONSTRAINT fk_products_reserved_by 
                FOREIGN KEY (reserved_by) REFERENCES users(uid)
                ON DELETE SET NULL
             `);
            console.log("FK added.");
        } catch (e) {
            console.log("FK probably exists:", e.code);
        }

    } catch (err) {
        console.error(err);
    } finally {
        conn.release();
        process.exit();
    }
}

fixSchema();
