/**
 * Simple Quick Test for Location Endpoints
 */

const API_URL = "http://localhost:3000";

async function quickTest() {
    console.log('\n🔍 Quick Location API Test\n');

    try {
        // Test 1: Check if location routes exist
        console.log('1️⃣ Testing GET /api/locations/9');
        const res1 = await fetch(`${API_URL}/api/locations/9`);
        console.log(`   Status: ${res1.status} ${res1.statusText}`);
        const data1 = await res1.json();
        console.log(`   Response:`, data1);

        // Test 2: Check product status
        console.log('\n2️⃣ Getting product 9 status');
        const res2 = await fetch(`${API_URL}/api/products/9`);
        const product = await res2.json();
        console.log(`   Product: ${product.pname}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Seller ID: ${product.sellerid}`);
        console.log(`   Reserved by: ${product.reserved_by || 'none'}`);

        // Test 3: Try proposing locations (will fail if not reserved)
        console.log('\n3️⃣ Testing POST /api/locations (as seller)');
        const res3 = await fetch(`${API_URL}/api/locations/9`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': product.sellerid?.toString() || '1'
            },
            body: JSON.stringify({ locations: ['Kriyakalpa', 'Mingos'] })
        });
        console.log(`   Status: ${res3.status} ${res3.statusText}`);
        const data3 = await res3.json();
        console.log(`   Response:`, data3);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    }
}

quickTest();
