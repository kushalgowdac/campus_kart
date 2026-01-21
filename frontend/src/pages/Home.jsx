
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    fetchProducts,
    createProduct,
    createProductSpec,
    addWishlist,
    createTransaction,
} from "../api";
import { useAuth } from "../context/AuthContext";

const initialProduct = {
    pname: "",
    category: "",
    price: "",
    status: "available",
    bought_year: "",
    preferred_for: "all",
    no_of_copies: 1,
    image_url: "",
    spec_name: "",
    spec_value: "",
};

export default function Home() {
    const { currentUser } = useAuth();
    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState("");
    const [form, setForm] = useState(initialProduct);
    const [view, setView] = useState("buy");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    // Separate states for quick actions not needed if we just use alert or status
    const [wishlistPid, setWishlistPid] = useState("");
    const [purchase, setPurchase] = useState({ pid: "", quantity: 1 });

    const queryString = useMemo(() => {
        return query ? `?q=${encodeURIComponent(query)}` : "";
    }, [query]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await fetchProducts(queryString);
            setProducts(data);
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [queryString]);

    const handleChange = (setter) => (e) => {
        const { name, value } = e.target;
        setter((prev) => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (setter) => (e) => {
        const { name, value } = e.target;
        setter((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    };

    const submitProduct = async (e) => {
        e.preventDefault();
        setStatus({ type: "", message: "" });
        try {
            if (!currentUser?.uid) return;

            const imageValue = form.image_url?.trim();
            const resolvedImage = imageValue
                ? imageValue.startsWith("http") || imageValue.startsWith("/images")
                    ? imageValue
                    : `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/images/${imageValue}`
                : null;

            const created = await createProduct({
                ...form,
                price: Number(form.price),
                bought_year: form.bought_year ? Number(form.bought_year) : null,
                no_of_copies: Number(form.no_of_copies || 1),
                image_url: resolvedImage,
                sellerid: Number(currentUser.uid),
            });

            if (form.spec_name && form.spec_value) {
                await createProductSpec({
                    pid: created.pid,
                    spec_name: form.spec_name,
                    spec_value: form.spec_value,
                });
            }
            setForm(initialProduct);
            await loadProducts();
            setStatus({ type: "success", message: "Product created" });
            setView("buy");
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    const quickWishlist = async (pid) => {
        try {
            if (!currentUser?.uid) return;
            await addWishlist({ uid: Number(currentUser.uid), pid: Number(pid) });
            setStatus({ type: "success", message: "Added to wishlist" });
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    // Keep manual inputs for wishlist/buy as they were in original?
    // Or simplify. The prompt asked for "Product Details, Cart". 
    // I'll keep the "buy now" button active.

    const quickBuy = async (pid) => {
        try {
            if (!currentUser?.uid) return;
            await createTransaction({
                buyerid: Number(currentUser.uid),
                pid: Number(pid),
                quantity: 1,
                status: "completed",
            });
            await loadProducts();
            setStatus({ type: "success", message: "Purchase completed" });
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    return (
        <div className="page-content">
            {status.message && (
                <div className={`status ${status.type}`}>{status.message}</div>
            )}

            <header className="hero">
                <div>
                    <h1>Welcome back, {currentUser?.name}</h1>
                    <p className="subtext">
                        Browse listings or create a new one.
                    </p>
                    <div className="tab-row">
                        <button
                            className={view === "buy" ? "tab active" : "tab"}
                            onClick={() => setView("buy")}
                            type="button"
                        >
                            Buy
                        </button>
                        <button
                            className={view === "sell" ? "tab active" : "tab"}
                            onClick={() => setView("sell")}
                            type="button"
                        >
                            Sell
                        </button>
                    </div>
                </div>
                <div className="hero-card">
                    <h3>Quick Search</h3>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by product name"
                    />
                    <button className="ghost" onClick={loadProducts} type="button">
                        Search
                    </button>
                </div>
            </header>

            {view === "sell" ? (
                <section className="grid">
                    <div className="card">
                        <h2>Create Listing</h2>
                        <form onSubmit={submitProduct} className="form">
                            <input
                                name="pname"
                                placeholder="Product name"
                                value={form.pname}
                                onChange={handleChange(setForm)}
                                required
                            />
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange(setForm)}
                            >
                                <option value="">Select category</option>
                                <option value="Books">Books</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Equipments">Equipments</option>
                                <option value="Gadgets">Gadgets</option>
                                <option value="Electronics">Electronics</option>
                            </select>
                            <input
                                type="number"
                                name="price"
                                placeholder="Price"
                                value={form.price}
                                onChange={handleNumberChange(setForm)}
                                required
                            />
                            <input
                                type="number"
                                name="bought_year"
                                placeholder="Bought year"
                                value={form.bought_year}
                                onChange={handleNumberChange(setForm)}
                            />
                            <select
                                name="preferred_for"
                                value={form.preferred_for}
                                onChange={handleChange(setForm)}
                            >
                                <option value="all">All</option>
                                <option value="1st">1st</option>
                                <option value="2nd">2nd</option>
                                <option value="3rd">3rd</option>
                                <option value="4th">4th</option>
                            </select>
                            <input
                                type="number"
                                name="no_of_copies"
                                placeholder="Number of copies"
                                value={form.no_of_copies}
                                onChange={handleNumberChange(setForm)}
                            />
                            <input
                                name="spec_name"
                                placeholder="Specification name (optional)"
                                value={form.spec_name}
                                onChange={handleChange(setForm)}
                            />
                            <input
                                name="spec_value"
                                placeholder="Specification value (optional)"
                                value={form.spec_value}
                                onChange={handleChange(setForm)}
                            />
                            <input
                                name="image_url"
                                placeholder="Image URL or file name"
                                value={form.image_url}
                                onChange={handleChange(setForm)}
                            />
                            <button type="submit">Create listing</button>
                        </form>
                    </div>
                </section>
            ) : (
                <section className="card list">
                    <div className="list-header">
                        <h2>Listings</h2>
                        <span>{loading ? "Loading..." : `${products.length} items`}</span>
                    </div>
                    <div className="list-grid">
                        {products.map((item) => (
                            <article key={item.pid} className="item">
                                <Link to={`/product/${item.pid}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
                                    {item.img_url ? (
                                        <img src={item.img_url} alt={item.pname} className="thumb" />
                                    ) : (
                                        <div className="thumb placeholder">No image</div>
                                    )}
                                    <div className="item-body">
                                        <h3>{item.pname}</h3>
                                        <p className="muted">Category: {item.category || "—"}</p>
                                        <p className="muted">Seller: {item.seller_name || "—"}</p>
                                    </div>
                                </Link>

                                <div className="item-actions" style={{ padding: '0 1rem 1rem' }}>
                                    <div className="item-meta" style={{ marginBottom: '0.5rem' }}>
                                        <span className={`badge ${item.status}`}>{item.status}</span>
                                        <p>₹ {item.price}</p>
                                    </div>
                                    <button type="button" onClick={() => quickWishlist(item.pid)}>
                                        ♡
                                    </button>
                                    <button type="button" className="ghost" onClick={() => quickBuy(item.pid)}>
                                        Buy
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
