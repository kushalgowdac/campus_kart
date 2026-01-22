/**
 * Test OTP Verification Fix
 */

const API_URL = "http://localhost:3000";

async function testOTPVerification() {
    console.log('\n🧪 Testing OTP Verification with otp_generated status\n');

    try {
        // Get product 17 details
        console.log('1️⃣ Checking product 17 status...');
        const res1 = await fetch(`${API_URL}/api/products/17`);
        const product = await res1.json();
        console.log(`   Status: ${product.status}`);
        console.log(`   Seller ID: ${product.sellerid}`);

        if (product.status !== 'otp_generated') {
            console.log(`   ⚠️ Product not in otp_generated state. Current: ${product.status}`);
            console.log('   Cannot test OTP verification.');
            return;
        }

        // Try verifying OTP (use dummy OTP - this will fail but shows the logic works)
        console.log('\n2️⃣ Testing OTP verification endpoint...');
        console.log('   Note: Using dummy OTP 123456 (will fail but proves status check works)');

        const res2 = await fetch(`${API_URL}/api/otp/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': product.sellerid.toString()
            },
            body: JSON.stringify({
                productId: 17,
                otp: '123456'
            })
        });

        const result = await res2.json();
        console.log(`   Status: ${res2.status}`);
        console.log(`   Response:`, result);

        if (result.error && result.error.includes('Invalid OTP')) {
            console.log('\n✅ FIX VERIFIED! Status check now accepts otp_generated');
            console.log('   The error is about wrong OTP, not wrong status.');
        } else if (result.error && result.error.includes('Invalid product status')) {
            console.log('\n❌ Status check still failing!');
        } else if (result.success) {
            console.log('\n✅ OTP VERIFIED SUCCESSFULLY!');
        }

    } catch (err) {
        console.error('\n❌ Test error:', err.message);
    }
}

testOTPVerification();
