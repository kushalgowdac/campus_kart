
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, fetchTransactions, deleteProduct } from "../api";
import { useAuth } from "../context/AuthContext";

export default function SellerDashboard() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState("listings"); // listings | sales
    const [listings, setListings] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            if (activeTab === "listings") {
                const data = await fetchProducts(`?sellerid=${currentUser.uid}`);
                setListings(data);
            } else {
                const data = await fetchTransactions(`?sellerid=${currentUser.uid}`);
                setSales(data);
            }
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab, currentUser]);

    const handleDelete = async (pid) => {
        const confirmed = window.confirm("Are you sure you want to delete this listing?");
        console.log("Delete confirmation:", confirmed);
        if (!confirmed) return;

        setStatus({ type: "", message: "" });
        try {
            console.log("Deleting product:", pid);
            await deleteProduct(pid);
            setListings(listings.filter((l) => l.pid !== pid));
            setStatus({ type: "success", message: "Listing deleted successfully" });
        } catch (err) {
            console.error("Delete error:", err);
            setStatus({ type: "error", message: err.message || "Failed to delete listing" });
        }
    };

    if (!currentUser) return <div>Please log in.</div>;

    return (
        <div className="page-content">
            <header className="hero" style={{ padding: '2rem 0' }}>
                <div>
                    <h1>Seller Dashboard</h1>
                    <p className="subtext">Manage your listings and track your sales.</p>
                    <div className="tab-row">
                        <button
                            className={activeTab === "listings" ? "tab active" : "tab"}
                            onClick={() => setActiveTab("listings")}
                        >
                            My Listings
                        </button>
                        <button
                            className={activeTab === "sales" ? "tab active" : "tab"}
                            onClick={() => setActiveTab("sales")}
                        >
                            Sold Items
                        </button>
                    </div>
                </div>
            </header>

            {status.message && (
                <div className={`status ${status.type}`}>{status.message}</div>
            )}

            {loading ? (
                <div className="card">Loading...</div>
            ) : activeTab === "listings" ? (
                <section className="card list">
                    <div className="list-header">
                        <h2>My Listings</h2>
                        <span>{listings.length} items</span>
                    </div>
                    {listings.length === 0 && <p className="muted">No active listings.</p>}
                    <div className="list-grid">
                        {listings.map((item) => (
                            <article key={item.pid} className="item">
                                <Link to={`/product/${item.pid}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
                                    {item.img_url ? (
                                        <img src={item.img_url} alt={item.pname} className="thumb" />
                                    ) : (
                                        <div className="thumb placeholder">No image</div>
                                    )}
                                    <div className="item-body">
                                        <h3>{item.pname}</h3>
                                        <p className="muted">{item.status}</p>
                                        <p>₹ {item.price}</p>
                                    </div>
                                </Link>
                                <div className="item-actions" style={{ padding: '0 1rem 1rem' }}>
                                    <button className="ghost danger" onClick={() => handleDelete(item.pid)}>
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ) : (
                <section className="card">
                    <h2>Sales History</h2>
                    {sales.length === 0 ? (
                        <p className="muted">No sales yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    <th style={{ padding: '0.5rem' }}>Product</th>
                                    <th style={{ padding: '0.5rem' }}>Buyer ID</th>
                                    <th style={{ padding: '0.5rem' }}>Date</th>
                                    <th style={{ padding: '0.5rem' }}>Qty</th>
                                    <th style={{ padding: '0.5rem' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <tr key={sale.tid} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.5rem' }}>{sale.pname}</td>
                                        <td style={{ padding: '0.5rem' }}>{sale.buyerid}</td>
                                        <td style={{ padding: '0.5rem' }}>{new Date(sale.time_of_purchase).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.5rem' }}>{sale.quantity}</td>
                                        <td style={{ padding: '0.5rem' }}>₹ {Number(sale.price) * sale.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            )}
        </div>
    );
}
