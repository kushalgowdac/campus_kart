
import { pool } from "./src/db/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    const connection = await pool.getConnection();
    try {
        const migrationPath = path.resolve(__dirname, "../database/otp_tokens_migration.sql");
        console.log("Reading migration from:", migrationPath);

        const migrationSql = fs.readFileSync(migrationPath, "utf8");
        const statements = migrationSql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        for (const statement of statements) {
            console.log("Executing SQL...");
            // We ignore errors on "exists" but let's just run it
            try {
                await connection.query(statement);
            } catch (err) {
                // If column already exists (Duplicate column name), we might want to ignore
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log("Column already exists, skipping.");
                } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log("Table already exists, skipping.");
                } else {
                    throw err;
                }
            }
        }
        console.log("Migration completed successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
