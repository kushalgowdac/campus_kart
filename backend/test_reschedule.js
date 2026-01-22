// Test script to verify reschedule functionality
const API_URL = "http://localhost:3000";

async function testRescheduleFlow() {
    console.log("=== Testing Reschedule Feature ===\n");

    // Test 1: Get product 1 status
    console.log("1. GET /api/products/1");
    const productResponse = await fetch(`${API_URL}/api/products/1`);
    const product = await productResponse.json();
    console.log(`   Status: ${product.status}`);
    console.log(`   Seller ID: ${product.sellerid}`);
    console.log(`   Reserved by: ${product.reserved_by}`);

    // Check if reschedule is even possible
    if (product.status === 'sold' || product.status === 'available') {
        console.log("   ❌ SKIP: Status is not location_selected or otp_generated/reserved");
        return;
    }

    // Test 2: Try reschedule as seller (user 1)
    console.log("\n2. POST /api/products/1/reschedule (User 1)");
    try {
        const response = await fetch(`${API_URL}/api/products/1/reschedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': '1'
            }
        });

        const status = response.status;
        console.log(`   Response Status: ${status}`);

        const data = await response.json();
        console.log("   Response Body:", JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.log("   ❌ FAILED TO RESCHEDULE");
        }
    } catch (err) {
        console.error(`   ❌ Request failed: ${err.message}`);
    }

    // Test 3: Verify product status changed to 'reserved'
    console.log("\n3. Verifying product status...");
    const updatedResponse = await fetch(`${API_URL}/api/products/1`);
    const updatedProduct = await updatedResponse.json();
    console.log(`   New Status: ${updatedProduct.status}`);

    if (updatedProduct.status === 'reserved') {
        console.log("   ✅ SUCCESS: Product reset to 'reserved'");
    } else {
        console.log(`   ❌ ERROR: Status stayed '${updatedProduct.status}'`);
    }

    console.log("\n=== Test Complete ===");
}

testRescheduleFlow();
