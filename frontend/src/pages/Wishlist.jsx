import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWishlist, removeWishlistItem } from "../api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Wishlist() {
    const { currentUser } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ type: "", message: "" });

    const loadWishlist = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await fetchWishlist(currentUser.uid);
            setWishlist(data);
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWishlist();
    }, [currentUser]);

    const handleRemove = async (pid) => {
        try {
            await removeWishlistItem(currentUser.uid, pid);
            setWishlist(wishlist.filter((item) => item.pid !== pid));
            setStatus({ type: "success", message: "Removed from wishlist" });
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        }
    };

    if (!currentUser) return <div>Please log in to view your wishlist.</div>;

    return (
        <>
            <Navbar />
            <div className="page-content">
            <header className="hero" style={{ padding: '2rem 50' }}>
                <div>
                    <h1>My Wishlist</h1>
                    <p className="subtext">Items you've saved for later.</p>
                </div>
            </header>

            {status.message && (
                <div className={`status ${status.type}`}>{status.message}</div>
            )}

            {loading ? (
                <div className="card">Loading...</div>
            ) : wishlist.length === 0 ? (
                <div className="card">
                    <p className="muted">Your wishlist is empty. Start adding items you like!</p>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <button style={{ marginTop: '1rem' }}>Browse Products</button>
                    </Link>
                </div>
            ) : (
                <section className="card list">
                    <div className="list-header">
                        <h2>Saved Items</h2>
                        <span>{wishlist.length} items</span>
                    </div>
                    <div className="list-grid">
                        {wishlist.map((item) => (
                            <article key={item.pid} className="item">
                                <Link to={`/product/${item.pid}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
                                    <div className="thumb placeholder">No image</div>
                                    <div className="item-body">
                                        <h3>{item.pname}</h3>
                                        <p className="muted">{item.status}</p>
                                        <p>₹ {item.price}</p>
                                    </div>
                                </Link>
                                <div className="item-actions" style={{ padding: '0 1rem 1rem' }}>
                                    <button className="ghost" onClick={() => handleRemove(item.pid)}>
                                        Remove
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}
            </div>
        </>
    );
}
