import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProducts } from "../api";
import { useAuth } from "../context/AuthContext";
import BadgesRow from "../components/BadgesRow";

export default function SellerProfile() {
    const { sellerId } = useParams();
    const { currentUser } = useAuth();
    const [products, setProducts] = useState([]);
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadSellerProducts = async () => {
            setLoading(true);
            setError("");
            try {
                // Fetch all products and filter by seller
                const allProducts = await fetchProducts("");
                const sellerProducts = allProducts.filter(
                    (p) => String(p.sellerid) === String(sellerId) && p.status === "available"
                );

                setProducts(sellerProducts);

                // Get seller info from first product
                if (sellerProducts.length > 0) {
                    setSeller({
                        name: sellerProducts[0].seller_name,
                        email: sellerProducts[0].seller_email,
                        uid: sellerId
                    });
                } else {
                    // If no products, try to get seller info another way
                    // For now, just show the seller ID
                    setSeller({
                        name: `Seller #${sellerId}`,
                        email: "",
                        uid: sellerId
                    });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadSellerProducts();
    }, [sellerId]);

    return (
        <div className="page-content">
            <header className="hero">
                <div>
                    <Link to="/" className="ghost" style={{ marginBottom: 16, display: "inline-block" }}>
                        ← Back to Home
                    </Link>
                    {seller && (
                        <>
                            <h1>{seller.name}'s Store</h1>
                            {seller.email && (
                                <p className="muted" style={{ marginTop: 8 }}>
                                    {seller.email}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </header>

            {error && (
                <div className="status error" style={{ margin: "1rem 0" }}>
                    {error}
                </div>
            )}

            {loading ? (
                <p className="muted">Loading seller's products...</p>
            ) : (
                <section className="card list">
                    <div className="list-header">
                        <div>
                            <h2 style={{ marginBottom: "0.25rem" }}>Available Products</h2>
                            <span className="muted" style={{ fontSize: "0.9rem" }}>
                                {products.length} listing(s) available for purchase
                            </span>
                        </div>
                    </div>

                    {products.length === 0 ? (
                        <p className="muted" style={{ marginTop: 16 }}>
                            This seller has no available products at the moment.
                        </p>
                    ) : (
                        <div className="list-grid">
                            {products.map((item) => (
                                <article key={item.pid} className="item">
                                    <Link
                                        to={`/product/${item.pid}`}
                                        style={{ textDecoration: "none", color: "inherit", display: "block", flex: 1 }}
                                    >
                                        {item.img_url ? (
                                            <img src={item.img_url} alt={item.pname} className="thumb" />
                                        ) : (
                                            <div className="thumb placeholder">No image</div>
                                        )}
                                        <div className="item-body">
                                            <h3>{item.pname}</h3>
                                            <p className="muted">Category: {item.category || "—"}</p>
                                            {item.bought_year && (
                                                <p className="muted">Bought: {item.bought_year}</p>
                                            )}
                                            {item.preferred_for && item.preferred_for !== "all" && (
                                                <p className="muted">Preferred for: {item.preferred_for} year</p>
                                            )}
                                        </div>
                                    </Link>

                                    <div className="item-actions" style={{ padding: "0 1rem 1rem" }}>
                                        <div className="item-meta" style={{ marginBottom: "0.5rem" }}>
                                            <span className={`badge ${item.status}`}>{item.status}</span>
                                            <p>₹ {item.price}</p>
                                        </div>
                                        <Link
                                            to={`/product/${item.pid}`}
                                            className="ghost"
                                            style={{
                                                textDecoration: "none",
                                                padding: "0.5rem 1rem",
                                                display: "inline-block"
                                            }}
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
