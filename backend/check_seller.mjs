const API_URL = "http://localhost:3000";

async function checkProduct() {
    try {
        const res = await fetch(`${API_URL}/api/products/9`);
        const product = await res.json();
        console.log('Product ID:', product.pid);
        console.log('Product Name:', product.pname);
        console.log('Seller ID:', product.sellerid);
        console.log('Seller Name:', product.seller_name);
        console.log('Current Status:', product.status);
    } catch (err) {
        console.error(err);
    }
}
checkProduct();
