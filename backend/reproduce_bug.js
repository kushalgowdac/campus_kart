// Reproduce Reschedule Bug
const API_URL = "http://localhost:3000";

async function runTest() {
    console.log("=== Reproduction Test: Seller Request Reschedule ===\n");

    const SELLER = { 'Content-Type': 'application/json', 'X-User-ID': '1' };
    const BUYER = { 'Content-Type': 'application/json', 'X-User-ID': '2' };

    // 1. Force valid state: location_selected, no request
    console.log("[Setup] Resetting to known start state...");
    // We assume there's a way to reset. 
    // Since I don't have a direct reset API, I'll rely on current state or manual DB check/update if I could.
    // Instead, let's just inspect PRE-state.

    let res = await fetch(`${API_URL}/api/products/1`);
    let preProduct = await res.json();
    console.log("PRE-State Status:", preProduct.status);
    console.log("PRE-State Request:", preProduct.reschedule_requested_by);

    if (preProduct.status !== 'location_selected' && preProduct.status !== 'otp_generated') {
        console.warn("⚠️ Warning: Product not in meeting state. Test might fail to run.");
    }

    if (preProduct.reschedule_requested_by !== null) {
        console.log("⚠️ Cleaning up existing request first...");
        await fetch(`${API_URL}/api/products/1/reschedule/reject`, { method: 'POST', headers: SELLER });
    }

    // 2. Perform Request as Seller
    console.log("\n[Action] Seller calling POST /reschedule...");
    res = await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: SELLER });
    const responseData = await res.json();
    console.log("Response:", JSON.stringify(responseData));

    // 3. Check POST-State
    res = await fetch(`${API_URL}/api/products/1`);
    const postProduct = await res.json();
    console.log("POST-State Status:", postProduct.status);
    console.log("POST-State Request:", postProduct.reschedule_requested_by);

    // 4. Verdict
    if (postProduct.status === 'reserved') {
        console.log("\n❌ BUG REPRODUCED: Status reset to 'reserved' immediately!");
    } else if (postProduct.reschedule_requested_by != 1) {
        console.log("\n❌ BUG: Request flag NOT set correctly.");
    } else {
        console.log("\n✅ BEHAVIOR CORRECT: Status preserved, Request set.");
    }
}

runTest();
