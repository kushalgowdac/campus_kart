// Final Strict Verification
const API_URL = "http://localhost:3000";

async function runTest() {
    console.log("=== Final Strict Handshake Test ===\n");
    const SELLER = { 'Content-Type': 'application/json', 'X-User-ID': '1' };
    const BUYER = { 'Content-Type': 'application/json', 'X-User-ID': '2' };

    // 0. Ensure clean slate (Reject if pending)
    await fetch(`${API_URL}/api/products/1/reschedule/reject`, { method: 'POST', headers: SELLER });

    // 1. Force state to location_selected
    // (Assuming clean slate script ran or we manually trust prev state, but let's check)
    let res = await fetch(`${API_URL}/api/products/1`);
    let prod = await res.json();
    if (prod.status === 'reserved') {
        // Fix state if needed for test
        // (But strictly we should rely on system behavior. Let's assume we start from reserved, propose, select)
    }

    // 2. Seller Request
    console.log("[Action] Seller Requesting...");
    res = await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: SELLER });
    let data = await res.json();
    console.log("Response:", data.message);

    res = await fetch(`${API_URL}/api/products/1`);
    prod = await res.json();
    console.log(`[Check] Status: ${prod.status} (Req: ${prod.reschedule_requested_by})`);

    if (prod.reschedule_requested_by == 1 && prod.status !== 'reserved') {
        console.log("✅ PASS: Request Set, Status Preserved.");
    } else {
        console.log("❌ FAIL: Request logic incorrect.");
    }

    // 3. Buyer Accept
    console.log("\n[Action] Buyer Accepting...");
    res = await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: BUYER });
    data = await res.json();
    console.log("Response:", data.message);

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
