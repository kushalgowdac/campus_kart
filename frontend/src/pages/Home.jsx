
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    fetchProducts,
    searchProducts,
    createProduct,
    createProductSpec,
    addWishlist,
    fetchLeaderboard,
} from "../api";
import { useAuth } from "../context/AuthContext";
import BadgesRow from "../components/BadgesRow";
import Toast from "../components/Toast";
import ProductCard from "../components/ProductCard";
import SearchFilters from "../components/SearchFilters";

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

const MARKET_FILTERS = [
    { value: "available", label: "Available" },
    { value: "cart", label: "Cart" },
];

export default function Home() {
    const { currentUser, gamification } = useAuth();
    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState("");
    const [form, setForm] = useState(initialProduct);
    const [view, setView] = useState("buy");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [marketFilter, setMarketFilter] = useState("available");
    const [filters, setFilters] = useState({
        category: "",
        sortPrice: ""
    });

    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showBadges, setShowBadges] = useState(false);

    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardError, setLeaderboardError] = useState("");

    // Wishlist state - track items in wishlist
    const [wishlistItems, setWishlistItems] = useState(() => {
        const saved = localStorage.getItem('campuskart_wishlist');
        return saved ? JSON.parse(saved) : [];
    });

    // Toast notification state
    const [toast, setToast] = useState(null);

    const queryString = useMemo(() => {
        return query ? `?q=${encodeURIComponent(query)}` : "";
    }, [query]);

    // Helper to check if any filters are active
    const hasActiveFilters = (filterObj) => {
        return filterObj.category || filterObj.sortPrice;
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            // Use regular fetchProducts if no filters, otherwise use search
            const data = hasActiveFilters(filters)
                ? await searchProducts(filters)
                : await fetchProducts("");
            setProducts(data);
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleFilterChange = (newFilters) => {
        console.log('🎛️  Filter change detected:', newFilters);
        setFilters(newFilters);
        // No need to call API - useMemo will handle filtering/sorting client-side
    };

    const handleClearFilters = () => {
        console.log('🧹 Clearing all filters');
        setFilters({
            category: "",
            sortPrice: ""
        });
        // Products will update automatically via useMemo
    };

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                const rows = await fetchLeaderboard(10);
                setLeaderboard(rows);
                setLeaderboardError("");
            } catch (err) {
                setLeaderboardError(err.message);
            }
        };
        loadLeaderboard();
    }, []);

    const availableProducts = useMemo(() =>
        products.filter((item) => (item.status || "").toLowerCase() === "available"),
        [products]);

    const cartProducts = useMemo(() => {
        if (!currentUser?.uid) return [];
        const uid = String(currentUser.uid);
        return products.filter((item) => {
            const status = (item.status || "").toLowerCase();
            if (status === "available" || status === "sold") return false;
            const reservedBy = item.reserved_by != null ? String(item.reserved_by) : null;
            return reservedBy === uid;
        });
    }, [products, currentUser]);

    const visibleProducts = marketFilter === "cart" ? cartProducts : availableProducts;

    // Client-side filtering and sorting - creates processed copy
    const sortedProducts = useMemo(() => {
        console.log('🔍 Processing products...');
        console.log('📦 Original visibleProducts count:', visibleProducts.length);
        console.log('🏷️  Category filter:', filters.category || 'None (All Categories)');
        console.log('💰 Sort filter:', filters.sortPrice || 'None (Default)');

        // Step 1: Filter by category (don't mutate original)
        let processedProducts = [...visibleProducts];

        if (filters.category) {
            console.log('🔎 Filtering by category:', filters.category);
            processedProducts = processedProducts.filter(product =>
                product.category === filters.category
            );
            console.log('✅ After category filter:', processedProducts.length, 'products');
        }

        // Step 2: Sort by price
        if (filters.sortPrice === 'asc') {
            console.log('⬆️  Sorting: Price Low to High');
            processedProducts.sort((a, b) => {
                const priceA = Number(a.price) || 0;
                const priceB = Number(b.price) || 0;
                return priceA - priceB;
            });
        } else if (filters.sortPrice === 'desc') {
            console.log('⬇️  Sorting: Price High to Low');
            processedProducts.sort((a, b) => {
                const priceA = Number(a.price) || 0;
                const priceB = Number(b.price) || 0;
                return priceB - priceA;
            });
        } else {
            console.log('🔵 No price sorting (keeping default order)');
        }

        // Debug output
        if (processedProducts.length > 0) {
            console.log('📊 Final results:', processedProducts.length, 'products');
            console.log('🎯 First 3 products:',
                processedProducts.slice(0, 3).map(p => ({
                    name: p.pname,
                    category: p.category,
                    price: p.price
                }))
            );
        } else {
            console.log('⚠️  No products match the filters');
        }

        return processedProducts;
    }, [visibleProducts, filters.category, filters.sortPrice]);

    const cartValue = useMemo(
        () => cartProducts.reduce((total, item) => total + Number(item.price || 0), 0),
        [cartProducts]
    );

    const listSubtitle = loading
        ? "Loading..."
        : marketFilter === "cart"
            ? currentUser
                ? `${sortedProducts.length} item(s) in cart`
                : "Log in to view cart"
            : `${sortedProducts.length} single-unit listings`;

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

    const toggleWishlist = async (pid, pname) => {
        if (!currentUser?.uid) {
            setToast({ type: "error", message: "Please log in to use wishlist" });
            return;
        }

        const isInWishlist = wishlistItems.includes(pid);

        if (isInWishlist) {
            // Remove from wishlist
            const updated = wishlistItems.filter(id => id !== pid);
            setWishlistItems(updated);
            localStorage.setItem('campuskart_wishlist', JSON.stringify(updated));
            setToast({ type: "success", message: "Removed from wishlist" });
        } else {
            // Add to wishlist
            try {
                await addWishlist({ uid: Number(currentUser.uid), pid: Number(pid) });
                const updated = [...wishlistItems, pid];
                setWishlistItems(updated);
                localStorage.setItem('campuskart_wishlist', JSON.stringify(updated));
                setToast({ type: "success", message: `❤️ ${pname} added to wishlist!` });
            } catch (err) {
                setToast({ type: "error", message: err.message || "Failed to add to wishlist" });
            }
        }
    };

    // NOTE: The "Buy" button navigates to ProductDetails where the OTP reservation flow is implemented.

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
                <div style={{ display: "grid", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                            type="button"
                            className={`leaderboard-icon-btn ${showBadges ? "active" : ""}`}
                            onClick={() => setShowBadges((prev) => !prev)}
                            aria-label={showBadges ? "Hide badges" : "Show badges"}
                            title={showBadges ? "Hide badges" : "Show badges"}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path
                                    d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className={`leaderboard-icon-btn ${showLeaderboard ? "active" : ""}`}
                            onClick={() => setShowLeaderboard((prev) => !prev)}
                            aria-label={showLeaderboard ? "Hide leaderboard" : "Show leaderboard"}
                            title={showLeaderboard ? "Hide leaderboard" : "Show leaderboard"}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path
                                    d="M8 21H16M12 17V21M7 4H17V6C17 9.31371 14.3137 12 11 12H13C9.68629 12 7 9.31371 7 6V4Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M17 6H19C19 8.76142 16.7614 11 14 11"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M7 6H5C5 8.76142 7.23858 11 10 11"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
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

                    {currentUser && (
                        <div className="hero-card">
                            <h3>Your Trust Score</h3>
                            <p className="muted" style={{ marginTop: 8 }}>
                                {typeof gamification?.trustPoints === "number" ? (
                                    <>
                                        <strong style={{ color: "var(--rvce-navy)" }}>{gamification.trustPoints}</strong> points
                                    </>
                                ) : (
                                    "Loading…"
                                )}
                            </p>
                            <BadgesRow badges={gamification?.badges || []} />
                        </div>
                    )}
                </div>
            </header>

            <div className={`leaderboard-collapse ${showBadges ? "is-open" : ""}`}>
                <section className="grid">
                    <div className="card">
                        <div className="list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <h2 style={{ margin: 0 }}>My Badges</h2>
                            <span className="muted" style={{ fontSize: 12 }}>Achievement badges earned</span>
                        </div>

                        {!gamification?.badges || gamification.badges.length === 0 ? (
                            <p className="muted" style={{ marginTop: 12 }}>No badges earned yet. Keep trading to unlock achievements!</p>
                        ) : (
                            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                                {gamification.badges.map((badge) => (
                                    <div
                                        key={badge.key}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "12px 14px",
                                            border: "1px solid var(--rvce-border)",
                                            borderRadius: 14,
                                            background: "rgba(255,255,255,0.7)",
                                        }}
                                    >
                                        <span style={{ fontSize: 32 }} aria-hidden="true">{badge.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, color: "var(--rvce-navy)" }}>{badge.name}</div>
                                            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{badge.description}</div>
                                            {badge.earnedAt && (
                                                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                                                    Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className={`leaderboard-collapse ${showLeaderboard ? "is-open" : ""}`}>
                <section className="grid">
                    <div className="card">
                        <div className="list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <h2 style={{ margin: 0 }}>Leaderboard</h2>
                            <span className="muted" style={{ fontSize: 12 }}>Top users by trust</span>
                        </div>

                        {leaderboardError ? (
                            <p className="error">{leaderboardError}</p>
                        ) : leaderboard.length === 0 ? (
                            <p className="muted">No leaderboard data yet.</p>
                        ) : (
                            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                                {leaderboard.map((u, idx) => (
                                    <Link
                                        key={u.uid}
                                        to={`/seller/${u.uid}`}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            padding: "10px 12px",
                                            border: "1px solid var(--rvce-border)",
                                            borderRadius: 14,
                                            background: "rgba(255,255,255,0.7)",
                                            textDecoration: "none",
                                            color: "inherit",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(255,255,255,1)";
                                            e.currentTarget.style.borderColor = "var(--rvce-navy)";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.7)";
                                            e.currentTarget.style.borderColor = "var(--rvce-border)";
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "none";
                                        }}
                                    >
                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                            <span className="muted" style={{ width: 24, textAlign: "right" }}>#{idx + 1}</span>
                                            <div>
                                                <div style={{ fontWeight: 800, color: "var(--rvce-navy)" }}>{u.name}</div>
                                                <div className="muted" style={{ fontSize: 12 }}>{u.email}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: 800 }}>{u.trustPoints}</div>
                                            <div className="muted" style={{ fontSize: 12 }}>{u.badgesCount} badge(s)</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {view === "sell" ? (
                <section className="grid">
                    <div className="card">
                        <h2>Create Listing</h2>
                        <p className="muted" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            CampusKart lists single physical items. Create another listing if you have more than one unit.
                        </p>
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
                    {/* Search Filters */}
                    <SearchFilters
                        onFilterChange={handleFilterChange}
                        onClear={handleClearFilters}
                    />

                    <div className="list-header" style={{ alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 auto' }}>
                            <h2 style={{ marginBottom: '0.25rem' }}>{marketFilter === "cart" ? "Cart" : "Listings"}</h2>
                            <span className="muted" style={{ fontSize: '0.9rem' }}>{listSubtitle}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {MARKET_FILTERS.map((filter) => (
                                <button
                                    key={filter.value}
                                    type="button"
                                    className="ghost"
                                    onClick={() => setMarketFilter(filter.value)}
                                    style={{
                                        borderColor: marketFilter === filter.value ? '#2563eb' : undefined,
                                        color: marketFilter === filter.value ? '#2563eb' : undefined,
                                        fontWeight: marketFilter === filter.value ? 600 : 400,
                                    }}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {marketFilter === "cart" && !currentUser ? (
                        <p className="muted">Log in to see items you have in cart.</p>
                    ) : sortedProducts.length === 0 ? (
                        <p className="muted">
                            {marketFilter === "cart" ? "No items in cart." : "No available listings."}
                        </p>
                    ) : (
                        <>
                            {marketFilter === "cart" && (
                                <div style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.75rem',
                                    padding: '1rem',
                                    marginBottom: '1rem'
                                }}>
                                    <p style={{ margin: 0, fontWeight: 600 }}>Cart Summary</p>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                                        {sortedProducts.length} item(s) · ₹ {Number(cartValue || 0).toLocaleString('en-IN')}
                                    </p>
                                    <div className="product-grid">
                                        {sortedProducts.map((item) => (
                                            <ProductCard
                                                key={item.pid}
                                                product={item}
                                                isInWishlist={wishlistItems.includes(item.pid)}
                                                onToggleWishlist={() => toggleWishlist(item.pid, item.pname)}
                                                marketFilter={marketFilter}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {marketFilter !== "cart" && (
                                <div className="product-grid">
                                    {sortedProducts.map((item) => (
                                        <ProductCard
                                            key={item.pid}
                                            product={item}
                                            isInWishlist={wishlistItems.includes(item.pid)}
                                            onToggleWishlist={() => toggleWishlist(item.pid, item.pname)}
                                            marketFilter={marketFilter}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
