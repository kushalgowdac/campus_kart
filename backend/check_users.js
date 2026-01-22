const API_URL = "http://localhost:3000";
import { pool } from "./src/db/index.js";

async function checkUsers() {
    console.log('Fetching all users...');
    const conn = await pool.getConnection();
    try {
        const [users] = await conn.query("SELECT uid, name, email FROM users");
        console.log('\n👥 User List:');
        users.forEach(u => {
            console.log(`   - ID: ${u.uid} | Name: ${u.name} | Email: ${u.email}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        conn.release();
        await pool.end();
    }
}
checkUsers();
