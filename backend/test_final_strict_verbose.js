// Final Strict Verification - Enhanced
const API_URL = "http://localhost:3000";

async function runTest() {
    console.log("=== Final Strict Handshake Test (Verbose) ===\n");
    const SELLER = { 'Content-Type': 'application/json', 'X-User-ID': '1' };
    const BUYER = { 'Content-Type': 'application/json', 'X-User-ID': '2' };

    // 0. Ensure clean slate (Reject if pending)
    await fetch(`${API_URL}/api/products/1/reschedule/reject`, { method: 'POST', headers: SELLER });

    // 1. Force state logic (skipped for brevity, assuming established state)

    // 2. Seller Request
    console.log("[Action] Seller Requesting...");
    let res = await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: SELLER });
    console.log(`Response Status: ${res.status}`);
    let data = await res.json();
    console.log("Response Body:", JSON.stringify(data));

    res = await fetch(`${API_URL}/api/products/1`);
    let prod = await res.json();
    console.log(`[Check] Status: ${prod.status} (Req: ${prod.reschedule_requested_by})`);

    // 3. Buyer Accept
    console.log("\n[Action] Buyer Accepting...");
    res = await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: BUYER });
    console.log(`Response Status: ${res.status}`);
    data = await res.json();
    console.log("Response Body:", JSON.stringify(data));

    res = await fetch(`${API_URL}/api/products/1`);
    prod = await res.json();
    console.log(`[Check] Status: ${prod.status} (Req: ${prod.reschedule_requested_by})`);

    if (prod.status === 'reserved' && prod.reschedule_requested_by === null) {
        console.log("✅ PASS: Status Reset to 'reserved', Req Cleared.");
    } else {
        console.log("❌ FAIL: Reset logic incorrect.");
    }
}
runTest();
