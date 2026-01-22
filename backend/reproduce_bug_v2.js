// Reproduce Reschedule Bug - Final Verification
const API_URL = "http://localhost:3000";

async function runTest() {
    console.log("=== Verification Test: Seller Request Reschedule ===\n");
    const SELLER = { 'Content-Type': 'application/json', 'X-User-ID': '1' };

    // 1. Reset/Check Pre-State
    // Ensure no pending request
    await fetch(`${API_URL}/api/products/1/reschedule/reject`, { method: 'POST', headers: SELLER });

    let res = await fetch(`${API_URL}/api/products/1`);
    let pre = await res.json();
    console.log(`PRE Status: ${pre.status} (Req: ${pre.reschedule_requested_by})`);

    // 2. Perform Request
    console.log("\n[Action] POST /reschedule (Seller)...");
    res = await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: SELLER });
    let data = await res.json();
    console.log("Response:", JSON.stringify(data));

    // 3. Check Post-State
    res = await fetch(`${API_URL}/api/products/1`);
    let post = await res.json();
    console.log(`POST Status: ${post.status} (Req: ${post.reschedule_requested_by})`);

    // 4. Validate
    if (post.status === 'reserved') {
        console.log("\n❌ FAIL: Status reset to 'reserved'. Bug persists.");
    } else if (post.reschedule_requested_by == 1 && (post.status === 'location_selected' || post.status === 'otp_generated')) {
        console.log("\n✅ PASS: Status preserved, Request set correctly.");
    } else {
        console.log("\n❓ INDETERMINATE: Unexpected state.");
    }
}
runTest();
