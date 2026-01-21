
import { pool } from "./src/db/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
    const connection = await pool.getConnection();
    try {
        const seedSql = fs.readFileSync(path.resolve(__dirname, "../database/seed.sql"), "utf8");
        const statements = seedSql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith("USE")); // Skip USE and empty statements

        for (const statement of statements) {
            console.log("Executing:", statement.substring(0, 50) + "...");
            await connection.query(statement);
        }
        console.log("Seeding completed successfully.");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        connection.release();
        process.exit();
    }
}

seed();
