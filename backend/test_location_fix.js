// Test script to verify location proposal fix
const API_URL = "http://localhost:3000";

async function testLocationProposal() {
    try {
        console.log("Testing location proposal for product 1 as user 1...");

        const response = await fetch(`${API_URL}/api/locations/1`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': '1'
            },
            body: JSON.stringify({
                locations: [
                    { location: 'Mingos', time: '10:00' }
                ]
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ SUCCESS:", data);
        } else {
            console.log("❌ ERROR:", data);
        }
    } catch (err) {
        console.error("❌ Request failed:", err.message);
    }
}

testLocationProposal();
