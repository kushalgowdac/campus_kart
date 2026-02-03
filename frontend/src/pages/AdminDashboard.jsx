import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("stats");
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [analytics, setAnalytics] = useState({
        timeSeries: [],
        category: [],
        year: [],
        funnel: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Check if user is admin
        if (currentUser && currentUser.role !== 'admin') {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const fetchData = async (endpoint) => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/api/admin/${endpoint}`, {
                headers: {
                    "X-User-ID": currentUser.uid,
                },
            });
            if (!res.ok) throw new Error(await res.text());
            return await res.json();
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) return;
        
        const loadData = async () => {
            if (activeTab === "stats") {
                const data = await fetchData("stats");
                if (data) setStats(data);
            } else if (activeTab === "users") {
                const data = await fetchData("users");
                if (data) setUsers(data);
            } else if (activeTab === "products") {
                const data = await fetchData("products");
                if (data) setProducts(data);
            } else if (activeTab === "analytics") {
                const [timeSeries, category, year, funnel] = await Promise.all([
                    fetchData("analytics/time-series?period=day&limit=7"),
                    fetchData("analytics/category"),
                    fetchData("analytics/year"),
                    fetchData("analytics/funnel"),
                ]);
                setAnalytics({ timeSeries, category, year, funnel });
            }
        };

        loadData();
    }, [activeTab, currentUser]);

    const handleRoleChange = async (uid, newRole) => {
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${uid}/role`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-ID": currentUser.uid,
                },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) throw new Error(await res.text());
            
            // Reload users
            const data = await fetchData("users");
            if (data) setUsers(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (uid) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${uid}`, {
                method: "DELETE",
                headers: {
                    "X-User-ID": currentUser.uid,
                },
            });
            if (!res.ok) throw new Error(await res.text());
            
            // Reload users
            const data = await fetchData("users");
            if (data) setUsers(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleExportCSV = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/analytics/export-csv`, {
                headers: {
                    "X-User-ID": currentUser.uid,
                },
            });
            if (!res.ok) throw new Error(await res.text());
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transactions.csv';
            a.click();
        } catch (err) {
            setError(err.message);
        }
    };

    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <div className="page-content">
                <div className="card">
                    <h2>Access Denied</h2>
                    <p>Admin privileges required.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <header className="hero">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p className="subtext">Manage users, products, and view analytics</p>
                    <div className="tab-row">
                        {["stats", "users", "products", "analytics"].map((tab) => (
                            <button
                                key={tab}
                                className={activeTab === tab ? "tab active" : "tab"}
                                onClick={() => setActiveTab(tab)}
                                type="button"
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {error && (
                <div className="status error">{error}</div>
            )}

            {loading && <p className="muted">Loading...</p>}

            {activeTab === "stats" && stats && (
                <div className="grid">
                    <div className="card">
                        <h3>Users</h3>
                        <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                            {stats.total_users}
                        </p>
                        <p className="muted">{stats.admin_users} admins</p>
                    </div>
                    <div className="card">
                        <h3>Products</h3>
                        <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                            {stats.total_products}
                        </p>
                        <p className="muted">
                            {stats.available_products} available, {stats.sold_products} sold
                        </p>
                    </div>
                    <div className="card">
                        <h3>Transactions</h3>
                        <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                            {stats.total_transactions}
                        </p>
                        <p className="muted">₹ {Number(stats.total_gmv || 0).toLocaleString()} GMV</p>
                    </div>
                    <div className="card">
                        <h3>OTP Verification</h3>
                        <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                            {stats.completed_otps}
                        </p>
                        <p className="muted">Completed exchanges</p>
                    </div>
                </div>
            )}

            {activeTab === "users" && (
                <div className="card">
                    <h2>User Management</h2>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                                <th style={{ padding: "0.5rem" }}>ID</th>
                                <th style={{ padding: "0.5rem" }}>Name</th>
                                <th style={{ padding: "0.5rem" }}>Email</th>
                                <th style={{ padding: "0.5rem" }}>Role</th>
                                <th style={{ padding: "0.5rem" }}>Listings</th>
                                <th style={{ padding: "0.5rem" }}>Transactions</th>
                                <th style={{ padding: "0.5rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.uid} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "0.5rem" }}>{user.uid}</td>
                                    <td style={{ padding: "0.5rem" }}>{user.name}</td>
                                    <td style={{ padding: "0.5rem" }}>{user.email}</td>
                                    <td style={{ padding: "0.5rem" }}>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="moderator">Moderator</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: "0.5rem" }}>{user.listings_count}</td>
                                    <td style={{ padding: "0.5rem" }}>{user.transactions_count}</td>
                                    <td style={{ padding: "0.5rem" }}>
                                        <button
                                            className="ghost danger"
                                            onClick={() => handleDeleteUser(user.uid)}
                                            style={{ fontSize: "0.85rem" }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "products" && (
                <div className="card">
                    <h2>Product Management</h2>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                                <th style={{ padding: "0.5rem" }}>ID</th>
                                <th style={{ padding: "0.5rem" }}>Name</th>
                                <th style={{ padding: "0.5rem" }}>Category</th>
                                <th style={{ padding: "0.5rem" }}>Price</th>
                                <th style={{ padding: "0.5rem" }}>Status</th>
                                <th style={{ padding: "0.5rem" }}>Seller</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.pid} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "0.5rem" }}>{product.pid}</td>
                                    <td style={{ padding: "0.5rem" }}>{product.pname}</td>
                                    <td style={{ padding: "0.5rem" }}>{product.category}</td>
                                    <td style={{ padding: "0.5rem" }}>₹ {product.price}</td>
                                    <td style={{ padding: "0.5rem" }}>{product.status}</td>
                                    <td style={{ padding: "0.5rem" }}>{product.seller_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "analytics" && (
                <div>
                    <div className="card" style={{ marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2>Analytics</h2>
                            <button onClick={handleExportCSV}>Export CSV</button>
                        </div>
                    </div>

                    <div className="grid">
                        <div className="card">
                            <h3>Time Series (Last 7 Days)</h3>
                            <table style={{ width: "100%", marginTop: "0.5rem" }}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Transactions</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.timeSeries?.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{row.period}</td>
                                            <td>{row.transaction_count}</td>
                                            <td>₹ {Number(row.revenue || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card">
                            <h3>Category Analytics</h3>
                            <table style={{ width: "100%", marginTop: "0.5rem" }}>
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Products</th>
                                        <th>Sales</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.category?.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{row.category}</td>
                                            <td>{row.products_count}</td>
                                            <td>{row.transactions_count}</td>
                                            <td>₹ {Number(row.total_revenue || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card">
                            <h3>Student Year Analytics</h3>
                            <table style={{ width: "100%", marginTop: "0.5rem" }}>
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Products</th>
                                        <th>Sales</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.year?.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{row.year}</td>
                                            <td>{row.products_count}</td>
                                            <td>{row.transactions_count}</td>
                                            <td>₹ {Number(row.total_revenue || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card">
                            <h3>Conversion Funnel</h3>
                            {analytics.funnel && (
                                <div>
                                    {analytics.funnel.funnel.map((row, idx) => (
                                        <div key={idx} style={{ marginBottom: "0.5rem" }}>
                                            <strong>{row.status}:</strong> {row.count}
                                        </div>
                                    ))}
                                    <hr style={{ margin: "1rem 0" }} />
                                    <div>
                                        <strong>OTP Conversion:</strong> {analytics.funnel.otp_conversion.used_otps} / {analytics.funnel.otp_conversion.total_otps}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
