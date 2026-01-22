const API_URL = "http://localhost:3000";
const MY_SELLER_ID = 1; // Assuming you are logged in as ID 1

async function findMyProducts() {
    try {
        const res = await fetch(`${API_URL}/api/products?sellerid=${MY_SELLER_ID}`);
        const products = await res.json();

        console.log(`\n📦 Products owned by Seller ID ${MY_SELLER_ID}:`);
        products.forEach(p => {
            console.log(`   - [ID: ${p.pid}] ${p.pname} (${p.status})`);
        });

        if (products.length === 0) {
            console.log("\n⚠️ You have no products! We should create one.");
        }
    } catch (err) {
        console.error(err);
    }
}
findMyProducts();
