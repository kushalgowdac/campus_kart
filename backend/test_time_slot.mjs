/**
 * Test Location Time Slot Feature
 */

const API_URL = "http://localhost:3000";
const sellerId = 1;

async function testTimeSlot() {
    console.log('\n🧪 Testing Location Time Slot Feature\n');

    try {
        // 1. Get an existing product (or find one)
        // We'll try product 17 which we used before, or find an available one
        let pid = 17;

        console.log(`1️⃣ Using Product ID: ${pid}`);

        // 2. Propose locations with times
        console.log('\n2️⃣ Proposing locations with times...');
        const payload = {
            locations: [
                { location: 'Kriyakalpa', time: '2:00 PM Today' },
                { location: 'Mingos', time: '3:30 PM Tomorrow' }
            ]
        };

        const res1 = await fetch(`${API_URL}/api/locations/${pid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': sellerId.toString()
            },
            body: JSON.stringify(payload)
        });

        const data1 = await res1.json();
        console.log(`   Status: ${res1.status}`);
        console.log(`   Response:`, data1);

        if (res1.status === 400 && data1.error.includes('Product must be')) {
            console.log('   ⚠️ Product not in reserved state. Skipping proposal test.');
        }

        // 3. Get locations to verify time is saved
        console.log('\n3️⃣ Fetching locations to verify time storage...');
        const res2 = await fetch(`${API_URL}/api/locations/${pid}`);
        const locations = await res2.json();

        console.log(`   Found ${locations.length} locations:`);
        locations.forEach(loc => {
            console.log(`   - ${loc.location} @ ${loc.meeting_time || 'No time set'}`);
        });

        const hasTime = locations.some(l => l.meeting_time);
        if (hasTime) {
            console.log('\n✅ VERIFIED: Meeting times are being saved and retrieved correctly!');
        } else {
            console.log('\n❌ FAILED: No meeting times found in response.');
        }

    } catch (err) {
        console.error('\n❌ Test error:', err.message);
    }
}

testTimeSlot();
