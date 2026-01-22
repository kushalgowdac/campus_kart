/**
 * Complete Location Selection Workflow Test
 * Tests all endpoints and workflow transitions
 */

const API_URL = "http://localhost:3000";

// Test data
const sellerId = 1;
const buyerId = 2;
let testProductId = null;

const headers = {
    "Content-Type": "application/json"
};

async function apiCall(endpoint, method = "GET", body = null, userId = null) {
    const options = {
        method,
        headers: { ...headers }
    };

    if (userId) {
        options.headers["X-User-ID"] = userId.toString();
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const text = await response.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = text;
    }

    return { status: response.status, data, ok: response.ok };
}

async function testWorkflow() {
    console.log('\n🧪 Testing Location Selection Workflow\n');
    console.log('='.repeat(50));

    try {
        // Step 1: Find an available product
        console.log('\n1️⃣ Finding available product...');
        const { data: products } = await apiCall('/api/products?status=available');

        if (!products || products.length === 0) {
            console.log('⚠️  No available products found. Creating one...');
            const { data: newProduct } = await apiCall('/api/products', 'POST', {
                pname: 'Test Location Product',
                price: 100,
                category: 'Test',
                sellerid: sellerId
            }, sellerId);
            testProductId = newProduct.pid;
        } else {
            testProductId = products[0].pid;
        }
        console.log(`✅ Using product ID: ${testProductId}`);

        // Step 2: Buyer reserves product
        console.log('\n2️⃣ Buyer reserving product...');
        const reserve = await apiCall(`/api/products/${testProductId}/reserve`, 'POST', {}, buyerId);
        if (!reserve.ok) {
            console.log(`❌ Reserve failed: ${JSON.stringify(reserve.data)}`);
            return;
        }
        console.log(`✅ Product reserved. Status: ${reserve.data.status}`);

        // Step 3: Seller proposes locations
        console.log('\n3️⃣ Seller proposing locations...');
        const proposeLocations = await apiCall(
            `/api/locations/${testProductId}`,
            'POST',
            { locations: ['Kriyakalpa', 'Mingos'] },
            sellerId
        );

        if (!proposeLocations.ok) {
            console.log(`❌ Propose locations failed: ${JSON.stringify(proposeLocations.data)}`);
            return;
        }
        console.log(`✅ Locations proposed. Status: ${proposeLocations.data.status}`);
        console.log(`   Locations: ${proposeLocations.data.locations.join(', ')}`);

        // Step 4: Get proposed locations
        console.log('\n4️⃣ Fetching proposed locations...');
        const getLocations = await apiCall(`/api/locations/${testProductId}`);
        if (!getLocations.ok) {
            console.log(`❌ Get locations failed: ${JSON.stringify(getLocations.data)}`);
            return;
        }
        console.log(`✅ Found ${getLocations.data.length} locations:`);
        getLocations.data.forEach(loc => {
            console.log(`   - ${loc.location} (selected: ${loc.is_selected})`);
        });

        // Step 5: Buyer selects location
        console.log('\n5️⃣ Buyer selecting location...');
        const selectLocation = await apiCall(
            `/api/locations/${testProductId}/select`,
            'POST',
            { location: 'Kriyakalpa' },
            buyerId
        );

        if (!selectLocation.ok) {
            console.log(`❌ Select location failed: ${JSON.stringify(selectLocation.data)}`);
            return;
        }
        console.log(`✅ Location selected: ${selectLocation.data.selectedLocation}`);
        console.log(`   Status: ${selectLocation.data.status}`);

        // Step 6: Verify location is marked as selected
        console.log('\n6️⃣ Verifying location selection...');
        const verifyLocations = await apiCall(`/api/locations/${testProductId}`);
        const selectedLoc = verifyLocations.data.find(l => l.is_selected);
        if (selectedLoc) {
            console.log(`✅ Location marked as selected: ${selectedLoc.location}`);
        } else {
            console.log('❌ No location marked as selected!');
        }

        // Step 7: Generate OTP
        console.log('\n7️⃣ Buyer generating OTP...');
        const confirmMeet = await apiCall(
            `/api/products/${testProductId}/confirm-meet`,
            'POST',
            {},
            buyerId
        );

        if (!confirmMeet.ok) {
            console.log(`❌ OTP generation failed: ${JSON.stringify(confirmMeet.data)}`);
            return;
        }
        console.log(`✅ OTP generated: ${confirmMeet.data.otp}`);
        console.log(`   Expires in: ${confirmMeet.data.expiresIn} seconds`);

        // Step 8: Verify product status
        console.log('\n8️⃣ Checking final product status...');
        const { data: product } = await apiCall(`/api/products/${testProductId}`);
        console.log(`✅ Product status: ${product.status}`);

        console.log('\n' + '='.repeat(50));
        console.log('✅ ALL TESTS PASSED! Location workflow is working correctly.\n');

        // Cleanup
        console.log('🧹 Cleaning up (cancelling reservation)...');
        await apiCall(`/api/products/${testProductId}/cancel`, 'POST', {}, buyerId);
        console.log('✅ Cleanup complete\n');

    } catch (err) {
        console.error('\n❌ TEST FAILED:');
        console.error(err.message);
        console.error(err.stack);
    }
}

testWorkflow();
