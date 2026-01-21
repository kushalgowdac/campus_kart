// Backend API Test Script - Detailed Output
import fetch from 'node-fetch';
import fs from 'fs';

const API_URL = "http://localhost:3000";
const results = [];
let passedTests = 0;
let failedTests = 0;

function log(message) {
    console.log(message);
    results.push(message);
}

async function test(name, fn) {
    try {
        await fn();
        log(`✓ PASS: ${name}`);
        passedTests++;
        return true;
    } catch (err) {
        log(`✗ FAIL: ${name}`);
        log(`  └─ ${err.message}\n`);
        failedTests++;
        return false;
    }
}

async function get(path) {
    const res = await fetch(`${API_URL}${path}`);
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
    return JSON.parse(text);
}

async function post(path, body) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
    return JSON.parse(text);
}

async function runTests() {
    log('\n=== CAMPUSKART BACKEND API VERIFICATION ===\n');

    log('--- SERVER HEALTH ---');
    await test('Server running', async () => {
        await get('/');
    });

    await test('Database connection', async () => {
        const data = await get('/db-test');
        if (!data.message?.includes('connected')) throw new Error('Not connected');
    });

    log('\n--- USERS API ---');
    await test('List users', async () => {
        const users = await get('/api/users');
        if (!Array.isArray(users) || users.length === 0) throw new Error('No users');
        log(`  └─ Found ${users.length} users`);
    });

    await test('Get user by ID', async () => {
        const user = await get('/api/users/1');
        if (!user.uid) throw new Error('Invalid user');
        log(`  └─ User: ${user.name}`);
    });

    log('\n--- PRODUCTS API ---');
    await test('List products', async () => {
        const products = await get('/api/products');
        if (!Array.isArray(products)) throw new Error('Invalid response');
        log(`  └─ Found ${products.length} products`);
    });

    await test('Get product by ID', async () => {
        const product = await get('/api/products/1');
        if (!product.pid) throw new Error('Invalid product');
        log(`  └─ Product: ${product.pname}`);
    });

    await test('Filter products by seller', async () => {
        const products = await get('/api/products?sellerid=1');
        if (!Array.isArray(products)) throw new Error('Invalid response');
        log(`  └─ Found ${products.length} products for seller 1`);
    });

    log('\n--- WISHLIST API ---');
    await test('Get user wishlist', async () => {
        const wishlist = await get('/api/wishlist?uid=1');
        if (!Array.isArray(wishlist)) throw new Error('Invalid response');
        log(`  └─ User 1 has ${wishlist.length} wishlist items`);
    });

    await test('Duplicate prevention', async () => {
        try {
            await post('/api/wishlist', { uid: 1, pid: 1 });
            throw new Error('Should prevent duplicate');
        } catch (err) {
            if (!err.message.includes('already')) throw err;
            log(`  └─ Correctly prevented duplicate`);
        }
    });

    log('\n--- TRANSACTIONS API ---');
    await test('List all transactions', async () => {
        const txns = await get('/api/transactions');
        if (!Array.isArray(txns)) throw new Error('Invalid response');
        log(`  └─ Found ${txns.length} transactions`);
    });

    await test('Filter by buyer', async () => {
        const txns = await get('/api/transactions?buyerid=1');
        if (!Array.isArray(txns)) throw new Error('Invalid response');
        log(`  └─ Buyer 1 has ${txns.length} transactions`);
    });

    await test('Filter by seller', async () => {
        const txns = await get('/api/transactions?sellerid=1');
        if (!Array.isArray(txns)) throw new Error('Invalid response');
        log(`  └─ Seller 1 has ${txns.length} sales`);
    });

    log('\n--- ERROR HANDLING ---');
    await test('404 for non-existent product', async () => {
        try {
            await get('/api/products/99999');
            throw new Error('Should return 404');
        } catch (err) {
            if (!err.message.includes('404')) throw err;
            log(`  └─ Correctly returned 404`);
        }
    });

    await test('Prevent deletion of product with transactions', async () => {
        try {
            const res = await fetch(`${API_URL}/api/products/3`, { method: 'DELETE' });
            const text = await res.text();
            if (res.ok) throw new Error('Should have failed');
            if (!text.includes('transaction')) throw new Error('Wrong error message');
            log(`  └─ Correctly prevented deletion`);
        } catch (err) {
            if (err.message.includes('Wrong error') || err.message.includes('Should have')) throw err;
        }
    });

    log('\n--- TEST SUMMARY ---');
    log(`Passed: ${passedTests}`);
    log(`Failed: ${failedTests}`);
    log(`Coverage: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

    fs.writeFileSync('backend_test_results.txt', results.join('\n'));
    log('\nResults saved to backend_test_results.txt');

    process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch(err => {
    log(`\nFATAL ERROR: ${err.message}`);
    fs.writeFileSync('backend_test_results.txt', results.join('\n'));
    process.exit(1);
});
