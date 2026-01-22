// Test Mutual Reschedule Flow
const API_URL = "http://localhost:3000";

async function runTest() {
    console.log("=== Testing Mutual Reschedule Flow ===\n");

    // 1. Reset State
    console.log("1. Resetting Product 1 to location_selected...");
    // Assuming reset_test_state.js is still valid or similar logic
    // We'll just assume product 1 is ready or use a helper if needed.
    // For now, let's just make sure it's in a valid state manually or via this script
    // NOTE: This relies on reset_test_state.js having run, or we can just try.

    // Simulating User 1 (Seller) and User 2 (Buyer)
    const SELLER = { 'Content-Type': 'application/json', 'X-User-ID': '1' };
    const BUYER = { 'Content-Type': 'application/json', 'X-User-ID': '2' };

    // Helper to get status
    async function getStatus() {
        const res = await fetch(`${API_URL}/api/products/1`);
        const data = await res.json();
        return {
            status: data.status,
            requested_by: data.reschedule_requested_by
        };
    }

    // Step A: Seller Requests Reschedule
    console.log("\n[A] Seller (User 1) Requests Reschedule...");
    const req1 = await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: SELLER });
    const data1 = await req1.json();
    console.log(`    Response: ${JSON.stringify(data1)}`);

    const state1 = await getStatus();
    if (state1.requested_by === 1) console.log("    ✅ Verified: reschedule_requested_by = 1");
    else console.log(`    ❌ Failed: requested_by is ${state1.requested_by}`);

    // Step B: Seller Cancels Request (Reject)
    console.log("\n[B] Seller (User 1) Cancels Request...");
    const req2 = await fetch(`${API_URL}/api/products/1/reschedule/reject`, { method: 'POST', headers: SELLER });
    console.log(`    Response: ${JSON.stringify(await req2.json())}`);

    const state2 = await getStatus();
    if (state2.requested_by === null) console.log("    ✅ Verified: Request cleared");
    else console.log(`    ❌ Failed: requested_by is ${state2.requested_by}`);

    // Step C: Seller Requests Again
    console.log("\n[C] Seller (User 1) Requests Again...");
    await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: SELLER });

    // Step D: Buyer Accepts
    console.log("\n[D] Buyer (User 2) Accepts Request...");
    const req3 = await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: BUYER });
    const data3 = await req3.json();
    console.log(`    Response: ${JSON.stringify(data3)}`);

    const state3 = await getStatus();
    if (state3.status === 'reserved' && state3.requested_by === null) {
        console.log("    ✅ Verified: Status reset to 'reserved' and request cleared");
    } else {
        console.log(`    ❌ Failed: Status=${state3.status}, Req=${state3.requested_by}`);
    }

    console.log("\n=== Test Complete ===");
}

runTest();
