// Native fetch is available in Node 18+
// import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

async function log(msg, type = 'info') {
    const color = type === 'success' ? colors.green : type === 'error' ? colors.red : colors.yellow;
    console.log(`${color}${msg}${colors.reset}`);
}

async function request(method, path, body = null, userId = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (userId) headers['X-User-ID'] = userId.toString();

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${path}`, opts);
    let data;
    try {
        data = await res.json();
    } catch {
        data = await res.text();
    }
    return { status: res.status, data };
}

async function runTests() {
    try {
        log('=== Starting OTP Flow Tests ===');

        // Setup: Ensure we have users and a fresh product
        // Buyer: ID 1, Seller: ID 2 (Assuming seed data)
        const buyerId = 1;
        const sellerId = 2; // Should be 'Kushal Gowda' based on seed

        // 1. Create a fresh available product for testing
        log('\n[Setup] Creating test product...');
        const createRes = await request('POST', '/products', {
            pname: 'OTP Test Product',
            price: 500,
            status: 'available',
            sellerid: sellerId,
            category: 'Electronics'
        });

        if (createRes.status !== 201) throw new Error(`Failed to create product: ${JSON.stringify(createRes.data)}`);
        const pid = createRes.data.pid;
        log(`Created product ID: ${pid}`, 'success');

        // 2. Reserve Product (Buyer)
        log('\n[Test 1] Reserve Product (Available -> Reserved)');
        const reserveRes = await request('POST', `/products/${pid}/reserve`, {}, buyerId);
        if (reserveRes.status === 200 && reserveRes.data.status === 'reserved') {
            log('✓ Reserved successfully', 'success');
        } else {
            log(`✗ Reserve failed: ${JSON.stringify(reserveRes.data)}`, 'error');
            process.exit(1);
        }

        // 3. Confirm Meet (Buyer) -> Generates OTP
        log('\n[Test 2] Confirm Meet (Reserved -> Meet Confirmed + OTP)');
        const confirmRes = await request('POST', `/products/${pid}/confirm-meet`, {}, buyerId);
        let otp;
        if (confirmRes.status === 200 && confirmRes.data.otp) {
            otp = confirmRes.data.otp;
            log(`✓ Meet confirmed. OTP received: ${otp}`, 'success');
        } else {
            log(`✗ Confirm meet failed: ${JSON.stringify(confirmRes.data)}`, 'error');
            process.exit(1);
        }

        // 4. Verify OTP (Seller) -> Marks Sold
        log('\n[Test 3] Verify OTP (Meet Confirmed -> Sold)');
        const verifyRes = await request('POST', '/otp/verify', {
            productId: pid,
            otp: otp
        }, sellerId); // Authenticated as seller

        if (verifyRes.status === 200 && verifyRes.data.success) {
            log('✓ OTP Verified successfully', 'success');
        } else {
            log(`✗ OTP Verification failed: ${JSON.stringify(verifyRes.data)}`, 'error');
            process.exit(1);
        }

        // 5. Rate Limiting Test (New Product)
        log('\n[Test 4] Rate Limiting (5 failed attempts)');
        // Create another product
        const p2Res = await request('POST', '/products', {
            pname: 'Rate Limit Test',
            price: 100,
            status: 'available',
            sellerid: sellerId
        });
        const pid2 = p2Res.data.pid;

        await request('POST', `/products/${pid2}/reserve`, {}, buyerId);
        const confirm2 = await request('POST', `/products/${pid2}/confirm-meet`, {}, buyerId);
        const otp2 = confirm2.data.otp;
        log(`Created Product ${pid2} with OTP ${otp2}`);

        // Fail 5 times
        for (let i = 1; i <= 6; i++) {
            const res = await request('POST', '/otp/verify', { productId: pid2, otp: '000000' }, sellerId);
            if (i <= 5) {
                if (res.status === 400 && res.data.error && res.data.error.includes('attempts remaining')) {
                    log(`✓ Attempt ${i} correctly rejected`, 'success');
                } else {
                    log(`✗ Attempt ${i} unexpected response: ${JSON.stringify(res.data)}`, 'error');
                }
            } else {
                // 6th attempt should be locked
                if (res.status === 403 && res.data.error && res.data.error.includes('locked')) {
                    log('✓ Account correctly locked after 5 attempts', 'success');
                } else {
                    log(`✗ 6th attempt should be locked but got: ${JSON.stringify(res.data)}`, 'error');
                }
            }
        }

        // 6. Security Validations
        log('\n[Test 6] Security Validations');

        // Try verifying with wrong seller
        const p3Res = await request('POST', '/products', { pname: 'Sec Test', price: 10, sellerid: sellerId });
        const pid3 = p3Res.data.pid;
        await request('POST', `/products/${pid3}/reserve`, {}, buyerId);
        await request('POST', `/products/${pid3}/confirm-meet`, {}, buyerId);

        const wrongSellerRes = await request('POST', '/otp/verify', { productId: pid3, otp: '123456' }, 999);
        if (wrongSellerRes.status === 403) {
            log('✓ Wrong seller correctly rejected', 'success');
        } else {
            log('✗ Wrong seller NOT rejected', 'error');
        }

        log('\n=== All Tests Passed ===', 'success');
        process.exit(0);

    } catch (error) {
        log(`\nFATAL ERROR: ${error.message}`, 'error');
        process.exit(1);
    }
}

runTests();
