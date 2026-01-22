// Debug script to check product data and user comparison
const API_URL = "http://localhost:3000";

async function debugProductData() {
    console.log("=== Debugging Product and User Data ===\n");

    // Get product 9 (from your running curl)
    console.log("1. Fetching product 9...");
    const response = await fetch(`${API_URL}/api/products/9`);
    const product = await response.json();

    console.log("Product Data:");
    console.log(`  - pid: ${product.pid} (type: ${typeof product.pid})`);
    console.log(`  - sellerid: ${product.sellerid} (type: ${typeof product.sellerid})`);
    console.log(`  - reserved_by: ${product.reserved_by} (type: ${typeof product.reserved_by})`);
    console.log(`  - status: ${product.status}`);
    console.log(`  - seller_name: ${product.seller_name}`);

    console.log("\n2. Simulating user comparison for user ID 1:");
    const userId = 1;
    console.log(`  - userId: ${userId} (type: ${typeof userId})`);
    console.log(`  - product.sellerid === userId: ${product.sellerid === userId}`);
    console.log(`  - String comparison: ${String(product.sellerid) === String(userId)}`);

    console.log("\n3. Check if reschedule button should show:");
    const isLocationOrOTP = ['location_selected', 'otp_generated'].includes(product.status);
    const isSellerOrBuyer = (product.sellerid === userId || product.reserved_by === userId);

    console.log(`  - Status is location_selected or otp_generated: ${isLocationOrOTP}`);
    console.log(`  - User is seller or buyer: ${isSellerOrBuyer}`);
    console.log(`  - Button should show: ${isLocationOrOTP && isSellerOrBuyer}`);

    console.log("\n=== Debug Complete ===");
}

debugProductData();
