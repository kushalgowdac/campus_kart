import "dotenv/config";
import mysql from "mysql2/promise";
// pool connection to MySQL database - Faster,Scalable,Industry standard
// import dotenv from "dotenv"; 
// dotenv.config();
console.log(process.env.DB_HOST);
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  // host: "localhost",
  user: process.env.DB_USER,
  // user : "root",
  password: process.env.DB_PASSWORD,
  // password: "Kushalrvcecs@18",
  database: process.env.DB_NAME,
  // database : "marketplace_db",
  waitForConnections: true,
  connectionLimit:  10 // max 10 concurrent db connxn
});


// pool.execute()
