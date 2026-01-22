// Minimal test for reschedule
const API_URL = "http://localhost:3000";

async function test() {
    console.log("TESTING RESCHEDULE...");
    try {
        const response = await fetch(`${API_URL}/api/products/1/reschedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-ID': '1' }
        });
        console.log(`STATUS: ${response.status}`);
        const text = await response.text();
        console.log(`BODY: ${text}`);
    } catch (e) {
        console.log(`ERROR: ${e.message}`);
    }
}
test();
