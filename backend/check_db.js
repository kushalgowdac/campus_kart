
import { pool } from "./src/db/index.js";

async function check() {
  try {
    const [users] = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log("Users count:", users[0].count);
    
    const [products] = await pool.query("SELECT COUNT(*) as count FROM products");
    console.log("Products count:", products[0].count);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit();
  }
}

check();
