
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, fetchTransactions, deleteProduct, updateProduct, getMyPurchases } from "../api";
import { useAuth } from "../context/AuthContext";
import { resolveImageUrl } from "../utils/images";
import productPlaceholder from "../assets/product-placeholder.svg";

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
    const [approvalNotice, setApprovalNotice] = useState(null);
    const [reservationNotice, setReservationNotice] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState(() => ({ ...INITIAL_EDIT_FORM }));
    const [savingEdit, setSavingEdit] = useState(false);
    const [listingFilter, setListingFilter] = useState("all");
    const previousVerificationRef = useRef(new Map());
    const previousListingStateRef = useRef(new Map());
    const noticeTimeoutRef = useRef(null);
    const reservationTimeoutRef = useRef(null);

    const pendingCount = listings.filter((item) => (item.verification_status || "approved") === "pending").length;

    const toNumberOrNull = (value) => {
        if (value === "" || value === null || value === undefined) return null;
        const numeric = Number(value);
        return Number.isNaN(numeric) ? null : numeric;
    };

    const loadData = async () => {
        if (!currentUser) return;
        if (activeTab === "achievements") {
            setLoading(false);
            return;
        }
        setLoading(true);
        if (activeTab !== "listings") {
            setStatus({ type: "", message: "" });
        }
        try {
            if (activeTab === "listings") {
                const storageKey = `campuskart_verification_status_${currentUser.uid}`;
                const listingStateKey = `campuskart_listing_state_${currentUser.uid}`;
                if (previousVerificationRef.current.size === 0) {
                    try {
                        const stored = localStorage.getItem(storageKey);
                        if (stored) {
                            const parsed = JSON.parse(stored);
                            previousVerificationRef.current = new Map(Object.entries(parsed).map(([pid, value]) => [Number(pid), value]));
                        }
                    } catch {
                        // ignore
                    }
                }
                if (previousListingStateRef.current.size === 0) {
                    try {
                        const stored = localStorage.getItem(listingStateKey);
                        if (stored) {
                            const parsed = JSON.parse(stored);
                            previousListingStateRef.current = new Map(Object.entries(parsed).map(([pid, value]) => [Number(pid), value]));
                        }
                    } catch {
                        // ignore
                    }
                }

                const data = await fetchProducts(`?sellerid=${currentUser.uid}`);
                const previous = previousVerificationRef.current;
                const newlyApproved = [];
                const newlyRejected = [];
                const newlyFlagged = [];

                data.forEach((item) => {
                    const prevStatus = previous.get(item.pid);
                    const nextStatus = item.verification_status || "approved";
                    if (prevStatus && prevStatus !== nextStatus) {
                        if (nextStatus === "approved") newlyApproved.push(item.pname);
                        if (nextStatus === "rejected") newlyRejected.push(item.pname);
                        if (nextStatus === "flagged") newlyFlagged.push(item.pname);
                    }
                });

                if (newlyApproved.length || newlyRejected.length || newlyFlagged.length) {
                    if (noticeTimeoutRef.current) {
                        clearTimeout(noticeTimeoutRef.current);
                    }

                    if (newlyApproved.length) {
                        setApprovalNotice({
                            type: "success",
                            message: `✅ Admin approved ${newlyApproved.length} listing(s): ${newlyApproved.slice(0, 3).join(", ")}${newlyApproved.length > 3 ? "…" : ""}`,
                        });
                    } else if (newlyRejected.length) {
                        setApprovalNotice({
                            type: "error",
                            message: `❌ Admin rejected ${newlyRejected.length} listing(s): ${newlyRejected.slice(0, 3).join(", ")}${newlyRejected.length > 3 ? "…" : ""}`,
                        });
                    } else if (newlyFlagged.length) {
                        setApprovalNotice({
                            type: "info",
                            message: `⚠️ Admin flagged ${newlyFlagged.length} listing(s): ${newlyFlagged.slice(0, 3).join(", ")}${newlyFlagged.length > 3 ? "…" : ""}`,
                        });
                    }

                    noticeTimeoutRef.current = setTimeout(() => {
                        setApprovalNotice(null);
                    }, 20000);
                }

                const previousListings = previousListingStateRef.current;
                const cancelledReservations = [];

                data.forEach((item) => {
                    const prev = previousListings.get(item.pid);
                    if (!prev) return;
                    const prevStatus = (prev.status || "").toLowerCase();
                    const nextStatus = (item.status || "").toLowerCase();
                    const prevReservedBy = prev.reserved_by;
                    const nextReservedBy = item.reserved_by;

                    const wasInProgress = ["reserved", "location_proposed", "location_selected", "otp_generated"].includes(prevStatus);
                    const nowAvailable = nextStatus === "available";
                    const reservationCleared = prevReservedBy != null && nextReservedBy == null;

                    if (wasInProgress && nowAvailable && reservationCleared) {
                        cancelledReservations.push(item.pname);
                    }
                });

                if (cancelledReservations.length) {
                    if (reservationTimeoutRef.current) {
                        clearTimeout(reservationTimeoutRef.current);
                    }
                    setReservationNotice({
                        type: "warning",
                        message: `⚠️ Reservation cancelled for: ${cancelledReservations.slice(0, 3).join(", ")}${cancelledReservations.length > 3 ? "…" : ""}`,
                    });
                    reservationTimeoutRef.current = setTimeout(() => {
                        setReservationNotice(null);
                    }, 20000);
                }

                previousVerificationRef.current = new Map(
                    data.map((item) => [item.pid, item.verification_status || "approved"])
                );
                previousListingStateRef.current = new Map(
                    data.map((item) => [item.pid, { status: item.status, reserved_by: item.reserved_by }])
                );
                try {
                    const serialized = Object.fromEntries(previousVerificationRef.current.entries());
                    localStorage.setItem(storageKey, JSON.stringify(serialized));
                } catch {
                    // ignore
                }
                try {
                    const serializedListings = Object.fromEntries(previousListingStateRef.current.entries());
                    localStorage.setItem(listingStateKey, JSON.stringify(serializedListings));
                } catch {
                    // ignore
                }
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

    useEffect(() => {
        if (activeTab !== "listings" || !currentUser) return undefined;
        const interval = setInterval(() => {
            loadData();
        }, 30000);
        return () => clearInterval(interval);
    }, [activeTab, currentUser]);

    useEffect(() => () => {
        if (noticeTimeoutRef.current) {
            clearTimeout(noticeTimeoutRef.current);
        }
        if (reservationTimeoutRef.current) {
            clearTimeout(reservationTimeoutRef.current);
        }
    }, []);

    // Achievements view removed (use Community page)

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

    const isInProgressStatus = (status) =>
        ["reserved", "location_proposed", "location_selected", "otp_generated"].includes((status || "").toLowerCase());

    // Only show alert for items in "reserved" status (awaiting seller action)
    const reservedListings = listings.filter((item) => (item.status || "").toLowerCase() === "reserved" && item.reserved_by);
    // Show all in-progress items in the Reserved/In Progress section
    const allInProgressListings = listings.filter((item) => isInProgressStatus(item.status) && item.reserved_by);
    const otherListings = filteredListings.filter((item) => !isInProgressStatus(item.status));

    const getStatusLabel = (status) => {
        switch ((status || "").toLowerCase()) {
            case "reserved":
                return "Reserved";
            case "location_proposed":
                return "Locations Proposed";
            case "location_selected":
                return "Location Confirmed";
            case "otp_generated":
                return "OTP Generated";
            default:
                return status || "unknown";
        }
    };

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
                            <span className="muted" style={{ fontSize: '0.9rem' }}>{otherListings.length} items</span>
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
                    {reservedListings.length > 0 && (
                        <div className="status info" style={{ marginBottom: '1rem' }}>
                            <strong>Reservation alert:</strong> {reservedListings.length} item(s) reserved.
                            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
                                {reservedListings.slice(0, 3).map((item) => (
                                    <li key={item.pid}>
                                        {item.buyer_name || "Buyer"} reserved {item.pname}.{' '}
                                        <Link to={`/product/${item.pid}`}>Propose locations</Link>
                                    </li>
                                ))}
                            </ul>
                            {reservedListings.length > 3 && (
                                <p className="muted" style={{ marginTop: '0.5rem' }}>
                                    +{reservedListings.length - 3} more reservations pending.
                                </p>
                            )}
                        </div>
                    )}
                    {allInProgressListings.length > 0 && (
                        <section className="card" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ marginTop: 0 }}>Reserved / In Progress</h3>
                            <div className="list-grid">
                                {allInProgressListings.map((item) => (
                                    <article key={item.pid} className="item">
                                        <Link to={`/product/${item.pid}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
                                            <img
                                                src={item.img_url ? resolveImageUrl(item.img_url) : productPlaceholder}
                                                alt={item.pname}
                                                className="thumb"
                                                onError={(e) => {
                                                    if (e.currentTarget.src !== productPlaceholder) {
                                                        e.currentTarget.src = productPlaceholder;
                                                    }
                                                }}
                                            />
                                            <div className="item-body">
                                                <h3>{item.pname}</h3>
                                                <span className={`badge ${item.status}`}>{getStatusLabel(item.status)}</span>
                                                <p>₹ {item.price}</p>
                                                <p className="muted">Buyer: {item.buyer_name || "Buyer"}</p>
                                            </div>
                                        </Link>
                                        <div className="item-actions" style={{ padding: '0 1rem 1rem' }}>
                                            <Link to={`/product/${item.pid}`} className="ghost">
                                                View & respond
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                    {listings.length === 0 ? (
                        renderEmptyState()
                    ) : otherListings.length === 0 ? (
                        <p className="muted">No listings match this filter.</p>
                    ) : (
                        <div className="list-grid">
                            {otherListings.map((item) => (
                                <article key={item.pid} className="item">
                                    <Link to={`/product/${item.pid}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
                                        <img
                                            src={item.img_url ? resolveImageUrl(item.img_url) : productPlaceholder}
                                            alt={item.pname}
                                            className="thumb"
                                            onError={(e) => {
                                                if (e.currentTarget.src !== productPlaceholder) {
                                                    e.currentTarget.src = productPlaceholder;
                                                }
                                            }}
                                        />
                                        <div className="item-body">
                                            <h3>{item.pname}</h3>
                                            {item.verification_status === "pending" ? (
                                                <span className="badge pending">Waiting for approval</span>
                                            ) : (
                                                <span className={`badge ${item.status}`}>{getStatusLabel(item.status)}</span>
                                            )}
                                            <p>₹ {item.price}</p>
                                            <p className="muted">Single-unit listing</p>
                                            <p className="muted">
                                                Verification: {item.verification_status ? item.verification_status : "approved"}
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="item-actions" style={{ padding: '0 1rem 1rem' }}>
                                        {item.verification_status === "pending" ? (
                                            <span className="muted" style={{ fontSize: '0.85rem' }}>
                                                Waiting for admin approval
                                            </span>
                                        ) : (
                                            <>
                                                {item.status === "available" ? (
                                                    <button className="ghost danger" onClick={() => handleDelete(item.pid)}>
                                                        Delete
                                                    </button>
                                                ) : (
                                                    <span className="muted" style={{ fontSize: '0.85rem' }}>
                                                        Only available listings can be deleted
                                                    </span>
                                                )}
                                            </>
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

        if (activeTab === "purchases") {
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
        }

        if (activeTab === "achievements") {
            return (
                <section className="card">
                    <p className="muted">Achievements are now available in Community.</p>
                </section>
            );
        }

        return null;
    };

    if (!currentUser) return <div>Please log in.</div>;

    return (
        <div className="page-content">
            <header className="page-header">
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
                        <Link className="tab" to="/community">
                            Community Badges
                        </Link>
                    </div>
                </div>
            </header>

            {status.message && (
                <div className={`status ${status.type}`}>{status.message}</div>
            )}
            {approvalNotice?.message && (
                <div className={`status ${approvalNotice.type}`}>{approvalNotice.message}</div>
            )}
            {activeTab === "listings" && pendingCount > 0 && (
                <div className="status info">
                    ⏳ {pendingCount} listing(s) waiting for admin approval.
                </div>
            )}
            {reservationNotice?.message && (
                <div className={`status ${reservationNotice.type}`}>{reservationNotice.message}</div>
            )}

            {loading ? (
                <div className="card">Loading...</div>
            ) : (
                renderActiveTab()
            )}

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
                                <select
                                    name="preferred_for"
                                    value={editForm.preferred_for}
                                    onChange={handleEditChange}
                                    required
                                >
                                    <option value="" disabled>
                                        Select preferred year
                                    </option>
                                    <option value="all">All</option>
                                    <option value="1st">1st</option>
                                    <option value="2nd">2nd</option>
                                    <option value="3rd">3rd</option>
                                    <option value="4th">4th</option>
                                </select>
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
        </div>
    );
}
