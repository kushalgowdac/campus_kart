
// Native fetch in Node
const API_URL = 'http://127.0.0.1:3000/api';

async function run() {
    try {
        console.log('--- Debugging Reserve Route ---');

        // 1. Create Product
        console.log('Creating product...');
        const create = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pname: 'Debug Item',
                price: 100,
                status: 'available',
                sellerid: 2
            })
        });

        const cData = await create.json();
        console.log('Create Status:', create.status);
        console.log('Create Resp:', JSON.stringify(cData));

        if (!cData.pid) throw new Error('No PID returned');
        const pid = cData.pid;

        // 2. Try Reserve
        const url = `${API_URL}/products/${pid}/reserve`;
        console.log(`\nCalling POST ${url}`);

        const reserve = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': '1'
            }
        });

        console.log('Reserve Status:', reserve.status);
        const rText = await reserve.text();
        console.log('Reserve Body:', rText);

        // 3. Try GET /products/:id to verify it exists
        const get = await fetch(`${API_URL}/products/${pid}`);
        console.log(`\nGET /products/${pid} Status:`, get.status);

    } catch (e) {
        console.error('FATAL:', e);
    }
}

run();
