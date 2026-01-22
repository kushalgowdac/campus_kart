import { pool } from "./src/db/index.js";

async function runMigration() {
    console.log("Running migration...");
    const connection = await pool.getConnection();
    try {
        // Check if column exists first to avoid error
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM products LIKE 'reschedule_requested_by'"
        );

        if (columns.length > 0) {
            console.log("Column 'reschedule_requested_by' already exists.");
        } else {
            await connection.query(
                "ALTER TABLE products ADD COLUMN reschedule_requested_by INT DEFAULT NULL"
            );
            console.log("Column 'reschedule_requested_by' added successfully.");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        connection.release();
        process.exit();
    }
}

runMigration();
