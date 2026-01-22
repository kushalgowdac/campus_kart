const API_URL = "http://localhost:3000";

async function checkProduct1() {
    try {
        const res = await fetch(`${API_URL}/api/products/1`);
        const product = await res.json();
        console.log('Product ID:', product.pid);
        console.log('Product Name:', product.pname);
        console.log('Seller ID:', product.sellerid);
        console.log('Current Status:', product.status);
    } catch (err) {
        console.error(err);
    }
}
checkProduct1();
