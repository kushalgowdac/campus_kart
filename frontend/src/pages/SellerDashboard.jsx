
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, fetchTransactions, deleteProduct, updateProduct, getMyPurchases } from "../api";
import { useAuth } from "../context/AuthContext";

const API_BASE =
    (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/$/, "")) ||
    (typeof window !== "undefined" ? window.location.origin : "");

const LISTING_FILTERS = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "sold", label: "Sold" },
];

const normalizeImageInput = (value) => {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
        return trimmed;
    }
    const sanitized = trimmed.replace(/^\/+/, "").replace(/^images\//i, "");
    return API_BASE ? `${API_BASE}/images/${sanitized}` : `/images/${sanitized}`;
};

const displayImageValue = (url) => {
    if (!url) return "";
    if (API_BASE && url.startsWith(`${API_BASE}/images/`)) {
        return url.substring(`${API_BASE}/images/`.length);
    }
    if (url.startsWith("/images/")) {
        return url.substring("/images/".length);
    }
    return url;
};

const INITIAL_EDIT_FORM = {
    pname: "",
    category: "",
    price: "",
    bought_year: "",
    preferred_for: "",
    no_of_copies: "1",
    img_url: "",
};

export default function SellerDashboard() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState("listings"); // listings | sales | purchases
    const [listings, setListings] = useState([]);
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState(() => ({ ...INITIAL_EDIT_FORM }));
    const [savingEdit, setSavingEdit] = useState(false);
    const [listingFilter, setListingFilter] = useState("all");

    const toNumberOrNull = (value) => {
        if (value === "" || value === null || value === undefined) return null;
        const numeric = Number(value);
        return Number.isNaN(numeric) ? null : numeric;
    };

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            if (activeTab === "listings") {
                const data = await fetchProducts(`?sellerid=${currentUser.uid}`);
                setListings(data);
            } else if (activeTab === "sales") {
                const data = await fetchTransactions(`?sellerid=${currentUser.uid}`);
                setSales(data);
            } else if (activeTab === "purchases") {
                const data = await getMyPurchases();
                setPurchases(data);
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

    const startEdit = (product) => {
        setEditingProduct(product);
        setEditForm({
            pname: product.pname || "",
            category: product.category || "",
            price: product.price != null ? String(product.price) : "",
            bought_year: product.bought_year != null ? String(product.bought_year) : "",
            preferred_for: product.preferred_for || "",
            no_of_copies: "1",
            img_url: displayImageValue(product.img_url),
        });
    };

    const closeEdit = () => {
        setEditingProduct(null);
        setEditForm({ ...INITIAL_EDIT_FORM });
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (event) => {
        event.preventDefault();
        if (!editingProduct) return;

        setSavingEdit(true);
        setStatus({ type: "", message: "" });
        try {
            const imageUrl = normalizeImageInput(editForm.img_url);
            const payload = {
                pname: editForm.pname,
                category: editForm.category || null,
                price: toNumberOrNull(editForm.price),
                bought_year: toNumberOrNull(editForm.bought_year),
                preferred_for: editForm.preferred_for || null,
                no_of_copies: 1,
                sellerid: currentUser?.uid ?? null,
                image_url: imageUrl,
            };

            await updateProduct(editingProduct.pid, payload);
            await loadData();

            setStatus({ type: "success", message: "Listing updated successfully" });
            closeEdit();
        } catch (err) {
            console.error("Update error:", err);
            setStatus({ type: "error", message: err.message || "Failed to update listing" });
        } finally {
            setSavingEdit(false);
        }
    };

    const filteredListings = listings.filter((item) => {
        if (listingFilter === "all") return true;
        const status = (item.status || "").toLowerCase();
        if (listingFilter === "available") return status === "available";
        if (listingFilter === "sold") return status === "sold";
        return true;
    });

    const renderEmptyState = () => (
        <p className="muted">No records yet.</p>
    );

    const renderActiveTab = () => {
        if (activeTab === "listings") {
            return (
                <section className="card list">
                    <div className="list-header" style={{ alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 auto' }}>
                            <h2 style={{ marginBottom: '0.25rem' }}>My Listings</h2>
                            <span className="muted" style={{ fontSize: '0.9rem' }}>{filteredListings.length} items</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {LISTING_FILTERS.map((filter) => (
                                <button
                                    key={filter.value}
                                    type="button"
                                    className="ghost"
                                    onClick={() => setListingFilter(filter.value)}
                                    style={{
                                        borderColor: listingFilter === filter.value ? '#2563eb' : undefined,
                                        color: listingFilter === filter.value ? '#2563eb' : undefined,
                                        fontWeight: listingFilter === filter.value ? 600 : 400,
                                    }}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {listings.length === 0 ? (
                        renderEmptyState()
                    ) : filteredListings.length === 0 ? (
                        <p className="muted">No listings match this filter.</p>
                    ) : (
                        <div className="list-grid">
                            {filteredListings.map((item) => (
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
                                            <p className="muted">Single-unit listing</p>
                                        </div>
                                    </Link>
                                    <div className="item-actions" style={{ padding: '0 1rem 1rem' }}>
                                        {item.status === "available" && (
                                            <button className="ghost" onClick={() => startEdit(item)}>
                                                Edit
                                            </button>
                                        )}
                                        {item.status === "available" ? (
                                            <button className="ghost danger" onClick={() => handleDelete(item.pid)}>
                                                Delete
                                            </button>
                                        ) : (
                                            <span className="muted" style={{ fontSize: '0.85rem' }}>
                                                Only available listings can be deleted
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            );
        }

        if (activeTab === "sales") {
            return (
                <section className="card">
                    <h2>Sales History</h2>
                    {sales.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    <th style={{ padding: '0.5rem' }}>Product</th>
                                    <th style={{ padding: '0.5rem' }}>Buyer</th>
                                    <th style={{ padding: '0.5rem' }}>Date</th>
                                    <th style={{ padding: '0.5rem' }}>Qty</th>
                                    <th style={{ padding: '0.5rem' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <tr key={sale.tid} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.5rem' }}>{sale.pname}</td>
                                        <td style={{ padding: '0.5rem' }}>{sale.buyer_name || sale.buyerid}</td>
                                        <td style={{ padding: '0.5rem' }}>{new Date(sale.time_of_purchase).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.5rem' }}>{sale.quantity}</td>
                                        <td style={{ padding: '0.5rem' }}>₹ {Number(sale.price) * sale.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            );
        }

        return (
            <section className="card">
                <h2>My Purchases</h2>
                {purchases.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <th style={{ padding: '0.5rem' }}>Product</th>
                                <th style={{ padding: '0.5rem' }}>Seller</th>
                                <th style={{ padding: '0.5rem' }}>Date</th>
                                <th style={{ padding: '0.5rem' }}>Qty</th>
                                <th style={{ padding: '0.5rem' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map((purchase) => (
                                <tr key={purchase.tid} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.5rem' }}>{purchase.product_name}</td>
                                    <td style={{ padding: '0.5rem' }}>{purchase.seller_name}</td>
                                    <td style={{ padding: '0.5rem' }}>{new Date(purchase.time_of_purchase).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.5rem' }}>{purchase.quantity}</td>
                                    <td style={{ padding: '0.5rem' }}>₹ {purchase.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        );
    };

    if (!currentUser) return <div>Please log in.</div>;

    return (
        <>
        <div className="page-content">
            <header className="hero" style={{ padding: '2rem 0' }}>
                <div>
                    <h1>Dashboard</h1>
                    <p className="subtext">Manage your marketplace activity.</p>
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
                        <button
                            className={activeTab === "purchases" ? "tab active" : "tab"}
                            onClick={() => setActiveTab("purchases")}
                        >
                            My Purchases
                        </button>
                    </div>
                </div>
            </header>

            {status.message && (
                <div className={`status ${status.type}`}>{status.message}</div>
            )}

            {loading ? (
                <div className="card">Loading...</div>
            ) : (
                renderActiveTab()
            )}
        </div>
        {editingProduct && (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                }}
            >
                <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Edit Listing</h3>
                        <button className="ghost" onClick={closeEdit} type="button">
                            Close
                        </button>
                    </div>
                    <form onSubmit={handleEditSubmit} className="form-grid" style={{ display: 'grid', gap: '0.75rem' }}>
                        <label className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>Product name</span>
                            <input
                                type="text"
                                name="pname"
                                value={editForm.pname}
                                onChange={handleEditChange}
                                required
                            />
                        </label>
                        <label className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>Category</span>
                            <input
                                type="text"
                                name="category"
                                value={editForm.category}
                                onChange={handleEditChange}
                                placeholder="e.g. Books"
                            />
                        </label>
                        <label className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>Price (₹)</span>
                            <input
                                type="number"
                                min="0"
                                name="price"
                                value={editForm.price}
                                onChange={handleEditChange}
                                required
                            />
                        </label>
                        <label className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>Image URL</span>
                            <input
                                type="text"
                                name="img_url"
                                value={editForm.img_url}
                                onChange={handleEditChange}
                                placeholder="https://... or dbmstb.jpg"
                            />
                        </label>
                        <label className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>Preferred for</span>
                            <input
                                type="text"
                                name="preferred_for"
                                value={editForm.preferred_for}
                                onChange={handleEditChange}
                                placeholder="Ideal buyer profile"
                            />
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                            <label className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span>Bought year</span>
                                <input
                                    type="number"
                                    name="bought_year"
                                    min="2000"
                                    max={new Date().getFullYear()}
                                    value={editForm.bought_year}
                                    onChange={handleEditChange}
                                />
                            </label>
                            <div className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span>Units</span>
                                <p className="muted" style={{ margin: 0 }}>
                                    Single-unit listings only. Duplicate the listing if you have more items.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                            <button className="ghost" type="button" onClick={closeEdit}>
                                Cancel
                            </button>
                            <button type="submit" disabled={savingEdit}>
                                {savingEdit ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
}
