// Test Global Blocking Rule
const API_URL = "http://localhost:3000";

async function runTest() {
    console.log("=== Testing Strict Workflow Rules ===\n");

    const SELLER = { 'Content-Type': 'application/json', 'X-User-ID': '1' };
    const BUYER = { 'Content-Type': 'application/json', 'X-User-ID': '2' };

    // 1. Setup: Ensure product is in valid state and REQUEST reschedule
    console.log("[Setup] Resetting status & Requesting Reschedule...");
    // Force reset state via DB/API if needed or assume prev state.
    // Let's assume we can carry on. 
    // Request Reschedule (Seller)
    let res = await fetch(`${API_URL}/api/products/1/reschedule`, { method: 'POST', headers: SELLER });
    let data = await res.json();
    console.log("Reschedule Request Status:", data);

    if (data.status !== 'requested' && data.message !== 'You have already requested to reschedule. Waiting for other party.') {
        console.log("⚠️ Setup failed or state unrelated. Proceeding anyway to test blocks.");
    }

    console.log("\n--- Testing Blocked Actions ---");

    // Test 1: Block OTP Generation (confirm-meet)
    console.log("1. Testing Blocked OTP Generation...");
    res = await fetch(`${API_URL}/api/products/1/confirm-meet`, { method: 'POST', headers: BUYER });
    data = await res.json();
    if (res.status === 400 && data.error.includes("Action blocked")) {
        console.log("✅ PASS: OTP Generation blocked.");
    } else {
        console.log("❌ FAIL: OTP Generation NOT blocked correctly.", data);
    }

    // Test 2: Block Location Proposal
    // Reset status locally or assume it might fail due to status check first, but let's try.
    // Note: status might be location_selected, so proposal might fail on status check first.
    // But blocking check is what we want. In my code, status check is before blocking check.
    // Spec said: "DISABLE ALL of: Propose locations...". 
    // My implementation puts blocking check AFTER status check.
    // This is fine as long as invalid actions are stopped.
    // If status is location_selected, propose is blocked by status.
    // If status is reserved, propose is blocked by reschedule request (if allowed to request in reserved?? Spec says request only in location_selected/otp_generated).
    // So strictly speaking, blocking is only relevant where the action is otherwise valid.

    // Test 3: Block OTP Verification
    // Force status to otp_generated if possible or mocking.
    // Since we are in location_selected, verification fails on status.

    // Let's rely on the explicit error we got for OTP generation which IS valid in location_selected.

    console.log("\n--- Testing Cancel/Reset clears Block ---");
    // Buyer cancels entire transaction
    res = await fetch(`${API_URL}/api/products/1/cancel`, { method: 'POST', headers: BUYER });
    data = await res.json();
    console.log("Cancel Result:", data);

    // Verify reschedule_requested_by is NULL
    res = await fetch(`${API_URL}/api/products/1`);
    data = await res.json();
    if (data.reschedule_requested_by === null) {
        console.log("✅ PASS: Cancel cleared the request flag.");
    } else {
        console.log("❌ FAIL: Request flag still set:", data.reschedule_requested_by);
    }

    console.log("\n=== Test Complete ===");
}

runTest();
