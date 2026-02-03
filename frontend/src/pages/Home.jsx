
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    fetchProducts,
    searchProducts,
    createProduct,
    createProductSpec,
    addWishlist,
    removeWishlistItem,
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
    preferred_for: "",
    no_of_copies: 1,
    image_url: "",
};

const MARKET_FILTERS = [
    { value: "available", label: "Available" },
    { value: "cart", label: "Cart" },
];

const PAGE_SIZE = 12;

export default function Home() {
    const { currentUser, gamification } = useAuth();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState("");
    const [form, setForm] = useState(initialProduct);
    const [specs, setSpecs] = useState([{ spec_name: "", spec_value: "" }]);
    const [view, setView] = useState("buy");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [marketFilter, setMarketFilter] = useState("available");
    const [filters, setFilters] = useState({
        category: "",
        sortPrice: ""
    });
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [createdListing, setCreatedListing] = useState(null);
    const resultsRef = useRef(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardError, setLeaderboardError] = useState("");


    // Wishlist state - track items in wishlist
    const [wishlistItems, setWishlistItems] = useState(() => {
        const saved = localStorage.getItem('campuskart_wishlist');
        return saved ? JSON.parse(saved) : [];
    });

    // Toast notification state
    const [toast, setToast] = useState(null);

    // Helper to check if any filters are active
    const hasActiveFilters = (filterObj) => {
        return filterObj.category || filterObj.sortPrice;
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            // Use regular fetchProducts if no filters, otherwise use search
            const data = hasActiveFilters(filters) || query
                ? await searchProducts({ ...filters, q: query })
                : await fetchProducts("");
            setProducts(data);
            if (query || hasActiveFilters(filters)) {
                setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
        } catch (err) {
            setStatus({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                const rows = await fetchLeaderboard(10);
                setLeaderboard(rows);
                setLeaderboardError("");
            } catch (err) {
                setLeaderboardError(err.message || "Failed to load leaderboard");
            }
        };
        loadLeaderboard();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const viewParam = params.get("view");
        if (viewParam === "sell") {
            setView("sell");
        } else {
            setView("buy");
        }
    }, [location.search]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [filters.category, filters.sortPrice, query, marketFilter, view]);

    useEffect(() => {
        if (!createdListing) return;
        const timer = setTimeout(() => setCreatedListing(null), 10000);
        return () => clearTimeout(timer);
    }, [createdListing]);

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

    const displayedProducts = marketFilter === "cart"
        ? sortedProducts
        : sortedProducts.slice(0, visibleCount);

    const handleChange = (setter) => (e) => {
        const { name, value } = e.target;
        setter((prev) => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (setter) => (e) => {
        const { name, value } = e.target;
        setter((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    };

    const addSpecRow = () => {
        setSpecs((prev) => [...prev, { spec_name: "", spec_value: "" }]);
    };

    const updateSpecRow = (index, field, value) => {
        setSpecs((prev) =>
            prev.map((spec, i) => (i === index ? { ...spec, [field]: value } : spec))
        );
    };

    const removeSpecRow = (index) => {
        setSpecs((prev) => {
            if (prev.length === 1) {
                return [{ spec_name: "", spec_value: "" }];
            }
            return prev.filter((_, i) => i !== index);
        });
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

            const specsToSave = specs
                .map((spec) => ({
                    spec_name: spec.spec_name.trim(),
                    spec_value: spec.spec_value.trim(),
                }))
                .filter((spec) => spec.spec_name && spec.spec_value);

            if (specsToSave.length) {
                await Promise.all(
                    specsToSave.map((spec) =>
                        createProductSpec({
                            pid: created.pid,
                            spec_name: spec.spec_name,
                            spec_value: spec.spec_value,
                        })
                    )
                );
            }
            setForm(initialProduct);
            setSpecs([{ spec_name: "", spec_value: "" }]);
            await loadProducts();
            setCreatedListing({
                pid: created.pid,
                pname: created.pname,
                verification_status: created.verification_status || "pending",
            });
                setStatus({ type: "", message: "" });
            setView("buy");
            setMarketFilter("available");
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
            try {
                await removeWishlistItem(Number(currentUser.uid), Number(pid));
                const updated = wishlistItems.filter(id => id !== pid);
                setWishlistItems(updated);
                localStorage.setItem('campuskart_wishlist', JSON.stringify(updated));
                setToast({ type: "success", message: "Removed from wishlist" });
            } catch (err) {
                setToast({ type: "error", message: err.message || "Failed to remove from wishlist" });
            }
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
            {createdListing && (
                <div className={`status ${createdListing.verification_status === "approved" ? "success" : "info"}`}>
                    {createdListing.verification_status === "approved" ? (
                        <>
                            ✅ Your listing is live: {createdListing.pname}.{" "}
                            <Link to={`/product/${createdListing.pid}`}>View listing</Link>
                        </>
                    ) : (
                        <>
                            ⏳ Listing submitted for admin approval: {createdListing.pname}. You'll be notified once it's approved.
                        </>
                    )}
                </div>
            )}

            <header className="market-hero">
                <div className="market-hero__main">
                    <div>
                        <h1>CampusKart</h1>
                        <p className="subtext">
                            Buy and sell within RV College of Engineering.
                        </p>
                        <div className="tab-row">
                            <button
                                className={view === "buy" ? "tab active" : "tab"}
                                onClick={() => setView("buy")}
                                type="button"
                            >
                                Buy
                            </button>
                        </div>
                    </div>

                    <div className="search-panel">
                        <h3>Search listings</h3>
                        <div className="search-input-row">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search books, gadgets, furniture…"
                                autoFocus={view === "buy"}
                                aria-label="Search listings"
                            />
                            <button className="primary" onClick={loadProducts} type="button">
                                Search
                            </button>
                            {query && (
                                <button
                                    className="ghost"
                                    type="button"
                                    onClick={() => {
                                        setQuery("");
                                        loadProducts();
                                    }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                            {loading ? "Searching…" : `${sortedProducts.length} result(s) available`}
                        </div>
                    </div>
                </div>

                {view === "buy" && (
                    <div className="market-hero__side hero-row">
                        {currentUser && (
                            <div className="hero-card hero-card--compact">
                                <h3>Your Trust Score</h3>
                                {typeof gamification?.trustPoints === "number" ? (
                                    <>
                                        <div className="trust-score-inline">
                                            <span className="trust-score-value">
                                                {gamification.trustPoints >= 100 ? "100+" : gamification.trustPoints}
                                            </span>
                                            <span className="muted">pts</span>
                                        </div>
                                        <div className="trust-meter" aria-hidden="true">
                                            <span
                                                style={{ width: `${Math.min(100, Math.max(0, gamification.trustPoints))}%` }}
                                            />
                                        </div>
                                        <p className="muted" style={{ marginTop: 6 }}>
                                            Higher trust boosts visibility.
                                        </p>
                                    </>
                                ) : (
                                    <p className="muted" style={{ marginTop: 8 }}>Loading…</p>
                                )}
                            </div>
                        )}
                        {currentUser && (
                            <div className="hero-card hero-card--compact">
                                <h3>My Badges</h3>
                                {!gamification?.badges || gamification.badges.length === 0 ? (
                                    <p className="muted" style={{ marginTop: 8 }}>No badges earned yet.</p>
                                ) : (
                                    <BadgesRow badges={gamification?.badges || []} />
                                )}
                            </div>
                        )}
                        <div className="hero-card hero-card--compact">
                            <h3>Leaderboard</h3>
                            {leaderboardError ? (
                                <p className="muted" style={{ marginTop: 8 }}>{leaderboardError}</p>
                            ) : leaderboard.length === 0 ? (
                                <p className="muted" style={{ marginTop: 8 }}>No leaderboard data yet.</p>
                            ) : (
                                <div className="mini-leaderboard">
                                    {leaderboard.slice(0, 3).map((u, idx) => (
                                        <Link key={u.uid} to={`/seller/${u.uid}`} className="mini-leaderboard__item">
                                            <span className="muted">#{idx + 1}</span>
                                            <span className="mini-leaderboard__name">{u.name}</span>
                                            <span className="mini-leaderboard__score">{u.trustPoints}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>


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
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontWeight: 600 }}>Specifications</span>
                                    <button type="button" className="ghost" onClick={addSpecRow}>
                                        + Add specification
                                    </button>
                                </div>
                                {specs.map((spec, index) => (
                                    <div
                                        key={`spec-${index}`}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr auto",
                                            gap: "0.5rem",
                                            alignItems: "center",
                                        }}
                                    >
                                        <input
                                            placeholder="Specification name"
                                            value={spec.spec_name}
                                            onChange={(e) => updateSpecRow(index, "spec_name", e.target.value)}
                                        />
                                        <input
                                            placeholder="Specification value"
                                            value={spec.spec_value}
                                            onChange={(e) => updateSpecRow(index, "spec_value", e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="ghost"
                                            onClick={() => removeSpecRow(index)}
                                            aria-label="Remove specification"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
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
                <section className="market-layout">
                    <aside className="market-filters">
                        <SearchFilters
                            onFilterChange={handleFilterChange}
                            onClear={handleClearFilters}
                        />
                        <div className="filters-hint">
                            Tip: Use filters to narrow down results quickly.
                        </div>
                    </aside>

                    <div className="market-results" ref={resultsRef}>
                        <div className="results-header">
                            <div>
                                <h2 style={{ marginBottom: 4 }}>{marketFilter === "cart" ? "My Cart" : "Listings"}</h2>
                                <span className="muted" style={{ fontSize: 13 }}>{listSubtitle}</span>
                            </div>
                            <div className="results-actions">
                                {MARKET_FILTERS.map((filter) => (
                                    <button
                                        key={filter.value}
                                        type="button"
                                        className={marketFilter === filter.value ? "ghost active" : "ghost"}
                                        onClick={() => setMarketFilter(filter.value)}
                                    >
                                        {filter.label}
                                        {filter.value === "cart" && cartProducts.length > 0 && (
                                            <span className="nav-dot nav-dot--corner" aria-label="Cart updates" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="results-meta">
                            <span>{loading ? "Searching…" : `Showing ${displayedProducts.length} of ${sortedProducts.length}`}</span>
                            {query && <span className="chip">Search: {query}</span>}
                        </div>
                        {currentUser && cartProducts.length > 0 && marketFilter !== "cart" && (
                            <div className="status info" style={{ marginTop: '0.75rem' }}>
                                You have reserved item(s). <button className="ghost" onClick={() => setMarketFilter("cart")}>View cart</button>
                            </div>
                        )}

                        {marketFilter === "cart" && !currentUser ? (
                            <div className="empty-state">
                                <h3>Log in to view your cart</h3>
                                <p>Your reserved items will appear here.</p>
                            </div>
                        ) : sortedProducts.length === 0 ? (
                            <div className="empty-state">
                                <h3>No listings found</h3>
                                <p>Try a different keyword or remove filters.</p>
                            </div>
                        ) : (
                            <>
                                {marketFilter === "cart" && (
                                    <div className="summary-card">
                                        <p style={{ margin: 0, fontWeight: 600 }}>Cart Summary</p>
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                                            {sortedProducts.length} item(s) · ₹ {Number(cartValue || 0).toLocaleString('en-IN')}
                                        </p>
                                        <div className="product-grid">
                                            {displayedProducts.map((item) => (
                                                <ProductCard
                                                    key={item.pid}
                                                    product={item}
                                                    isInWishlist={wishlistItems.includes(item.pid)}
                                                    onToggleWishlist={() => toggleWishlist(item.pid, item.pname)}
                                                    marketFilter={marketFilter}
                                                    isOwner={String(item.sellerid) === String(currentUser?.uid)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {marketFilter !== "cart" && (
                                    <div className="product-grid">
                                        {displayedProducts.map((item) => (
                                            <ProductCard
                                                key={item.pid}
                                                product={item}
                                                isInWishlist={wishlistItems.includes(item.pid)}
                                                onToggleWishlist={() => toggleWishlist(item.pid, item.pname)}
                                                marketFilter={marketFilter}
                                                isOwner={String(item.sellerid) === String(currentUser?.uid)}
                                                highlight={createdListing?.pid === item.pid}
                                            />
                                        ))}
                                    </div>
                                )}
                                {marketFilter !== "cart" && displayedProducts.length < sortedProducts.length && (
                                    <div className="load-more">
                                        <button className="primary" type="button" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
                                            Load more listings
                                        </button>
                                        <span className="muted" style={{ fontSize: 12 }}>
                                            Showing {displayedProducts.length} of {sortedProducts.length}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
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
