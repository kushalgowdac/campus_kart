// Debug Reject Logic
import { pool } from "./src/db/index.js";

async function run() {
    const PID = 1;
    const SELLER_ID = 1;
    const BUYER_ID = 2; // Assuming Buyer is 2

    console.log("=== SETUP ===");
    // 1. Force Product to 'location_selected', Reserved By Buyer, Seller is Seller
    await pool.query("UPDATE products SET status = 'location_selected', reserved_by = ?, reschedule_requested_by = ? WHERE pid = ?", [BUYER_ID, SELLER_ID, PID]);
    await pool.query("UPDATE product_seller SET sellerid = ? WHERE pid = ?", [SELLER_ID, PID]);

    console.log(`Set PID ${PID}: ReservedBy=${BUYER_ID}, RescheduleReqBy=${SELLER_ID}, Seller=${SELLER_ID}`);

    // 2. Simulate logic
    const [rows] = await pool.query(
        "SELECT p.status, p.reserved_by, p.reschedule_requested_by, ps.sellerid FROM products p LEFT JOIN product_seller ps ON p.pid = ps.pid WHERE p.pid = ?",
        [PID]
    );
    const product = rows[0];

    const userId = BUYER_ID; // Acting as Buyer
    const reservedBy = product.reserved_by;
    const sellerId = product.sellerid;
    const requestedBy = product.reschedule_requested_by;

    const isBuyer = String(userId) === String(reservedBy);
    const requestFromSeller = String(requestedBy) === String(sellerId);

    console.log("\n=== DEBUG VALUES ===");
    console.log(`User (Req): ${userId} (Type: ${typeof userId})`);
    console.log(`ReservedBy: ${reservedBy} (Type: ${typeof reservedBy})`);
    console.log(`RequestedBy: ${requestedBy} (Type: ${typeof requestedBy})`);
    console.log(`SellerId:   ${sellerId} (Type: ${typeof sellerId})`);

    console.log(`\nIsBuyer (${userId}==${reservedBy}): ${isBuyer}`);
    console.log(`ReqFromSeller (${requestedBy}==${sellerId}): ${requestFromSeller}`);

    if (isBuyer && requestFromSeller) {
        console.log("✅ RESULT: WOULD CANCEL");
    } else {
        console.log("❌ RESULT: WOULD NOT CANCEL (Clears Flag Only)");
    }

    process.exit();
}
run();
