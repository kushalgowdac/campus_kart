// Comprehensive Backend API Test Script
const API_URL = "http://localhost:3000";

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;
let warnings = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`${colors.green}✓${colors.reset} ${name}`);
        passedTests++;
    } catch (err) {
        console.log(`${colors.red}✗${colors.reset} ${name}`);
        console.log(`  Error: ${err.message}`);
        failedTests++;
    }
}

async function warn(message) {
    console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
    warnings++;
}

async function get(path) {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return await res.json();
}

async function post(path, body) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return await res.json();
}

async function del(path) {
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return await res.json();
}

console.log('\n=== CampusKart Backend API Verification ===\n');

// Test 1: Server Health
console.log('1. Server Health');
await test('GET / (server running)', async () => {
    const data = await get('/');
    if (!data || typeof data !== 'string') throw new Error('Unexpected response');
});

await test('GET /db-test (database connection)', async () => {
    const data = await get('/db-test');
    if (!data.message || !data.message.includes('connected')) throw new Error('DB not connected');
});

// Test 2: Users API
console.log('\n2. Users API');
await test('GET /api/users (list users)', async () => {
    const users = await get('/api/users');
    if (!Array.isArray(users) || users.length === 0) throw new Error('No users found');
});

await test('GET /api/users/1 (get user by ID)', async () => {
    const user = await get('/api/users/1');
    if (!user.uid || !user.name) throw new Error('Invalid user data');
});

// Test 3: Products API
console.log('\n3. Products API');
await test('GET /api/products (list products)', async () => {
    const products = await get('/api/products');
    if (!Array.isArray(products)) throw new Error('Invalid response');
});

await test('GET /api/products/1 (get product by ID)', async () => {
    const product = await get('/api/products/1');
    if (!product.pid || !product.pname) throw new Error('Invalid product data');
});

await test('GET /api/products?sellerid=1 (filter by seller)', async () => {
    const products = await get('/api/products?sellerid=1');
    if (!Array.isArray(products)) throw new Error('Invalid response');
});

// Test 4: Wishlist API
console.log('\n4. Wishlist API');
await test('GET /api/wishlist?uid=1 (get user wishlist)', async () => {
    const wishlist = await get('/api/wishlist?uid=1');
    if (!Array.isArray(wishlist)) throw new Error('Invalid response');
});

await test('POST /api/wishlist (duplicate prevention)', async () => {
    try {
        await post('/api/wishlist', { uid: 1, pid: 1 });
        throw new Error('Should have prevented duplicate');
    } catch (err) {
        if (!err.message.includes('already in wishlist')) throw err;
    }
});

// Test 5: Transactions API
console.log('\n5. Transactions API');
await test('GET /api/transactions (list transactions)', async () => {
    const transactions = await get('/api/transactions');
    if (!Array.isArray(transactions)) throw new Error('Invalid response');
});

await test('GET /api/transactions?buyerid=1 (filter by buyer)', async () => {
    const transactions = await get('/api/transactions?buyerid=1');
    if (!Array.isArray(transactions)) throw new Error('Invalid response');
});

await test('GET /api/transactions?sellerid=1 (filter by seller)', async () => {
    const transactions = await get('/api/transactions?sellerid=1');
    if (!Array.isArray(transactions)) throw new Error('Invalid response');
});

// Test 6: Product Specs
console.log('\n6. Product Specs API');
try {
    await test('GET /api/specs?pid=1 (get product specs)', async () => {
        const specs = await get('/api/specs?pid=1');
        if (!Array.isArray(specs)) throw new Error('Invalid response');
    });
} catch {
    warn('Specs endpoint may not be implemented');
}

// Test 7: Product Images
console.log('\n7. Product Images API');
try {
    await test('GET /api/images?pid=1 (get product images)', async () => {
        const images = await get('/api/images?pid=1');
        if (!Array.isArray(images)) throw new Error('Invalid response');
    });
} catch {
    warn('Images endpoint may not be fully implemented');
}

// Test 8: Categories
console.log('\n8. Categories API');
try {
    await test('GET /api/categories (list categories)', async () => {
        const categories = await get('/api/categories');
        if (!Array.isArray(categories)) throw new Error('Invalid response');
    });
} catch {
    warn('Categories endpoint may not be implemented');
}

// Test 9: Error Handling
console.log('\n9. Error Handling');
await test('GET /api/products/99999 (404 for non-existent)', async () => {
    try {
        await get('/api/products/99999');
        throw new Error('Should have returned 404');
    } catch (err) {
        if (!err.message.includes('404')) throw err;
    }
});

await test('DELETE /api/products/3 (product with transactions)', async () => {
    try {
        await del('/api/products/3');
        throw new Error('Should have prevented deletion');
    } catch (err) {
        if (!err.message.includes('transaction') && !err.message.includes('400')) throw err;
    }
});

// Summary
console.log('\n=== Test Results ===');
console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
console.log(`${colors.yellow}Warnings: ${warnings}${colors.reset}`);
console.log(`\nTotal Coverage: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

process.exit(failedTests > 0 ? 1 : 0);
