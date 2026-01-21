import React, { useEffect, useMemo, useState } from "react";
import {
  fetchProducts,
  fetchUsers,
  createUser,
  createProduct,
  createProductSpec,
  addWishlist,
  createTransaction,
} from "./api.js";

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

export default function App() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(initialProduct);
  const [signup, setSignup] = useState({ name: "", email: "", password: "" });
  const [view, setView] = useState("buy");
  const [wishlist, setWishlist] = useState({ uid: "", pid: "" });
  const [purchase, setPurchase] = useState({ buyerid: "", pid: "", quantity: 1 });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

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

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);

      const stored = localStorage.getItem("campuskart_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  useEffect(() => {
    loadProducts();
  }, [queryString]);

  useEffect(() => {
    loadUsers();
  }, []);

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
      if (!currentUser?.uid) {
        setStatus({ type: "error", message: "Please login first." });
        return;
      }
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
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };
  const quickWishlist = async (pid) => {
    try {
      if (!currentUser?.uid) {
        setStatus({ type: "error", message: "Please login first." });
        return;
      }
      await addWishlist({ uid: Number(currentUser.uid), pid: Number(pid) });
      setStatus({ type: "success", message: "Wishlist updated" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  const quickBuy = async (pid) => {
    try {
      if (!currentUser?.uid) {
        setStatus({ type: "error", message: "Please login first." });
        return;
      }
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

  const submitWishlist = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    try {
      if (!currentUser?.uid) {
        setStatus({ type: "error", message: "Please login first." });
        return;
      }
      await addWishlist({
        uid: Number(currentUser.uid),
        pid: Number(wishlist.pid),
      });
      setWishlist({ uid: "", pid: "" });
      setStatus({ type: "success", message: "Wishlist updated" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  const submitPurchase = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    try {
      if (!currentUser?.uid) {
        setStatus({ type: "error", message: "Please login first." });
        return;
      }
      await createTransaction({
        buyerid: Number(currentUser.uid),
        pid: Number(purchase.pid),
        quantity: Number(purchase.quantity || 1),
        status: "completed",
      });
      setPurchase({ buyerid: "", pid: "", quantity: 1 });
      await loadProducts();
      setStatus({ type: "success", message: "Transaction recorded" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    try {
      if (!signup.name || !signup.email || !signup.password) {
        setStatus({ type: "error", message: "All signup fields required." });
        return;
      }
      await createUser(signup);
      setSignup({ name: "", email: "", password: "" });
      await loadUsers();
      setStatus({ type: "success", message: "Signup successful" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  const handleLoginChange = (e) => {
    const selectedId = Number(e.target.value);
    const user = users.find((u) => u.uid === selectedId) || null;
    setCurrentUser(user);
    if (user) {
      localStorage.setItem("campuskart_user", JSON.stringify(user));
      setStatus({ type: "success", message: `Logged in as ${user.name}` });
    } else {
      localStorage.removeItem("campuskart_user");
    }
  };

  const logout = () => {
    localStorage.removeItem("campuskart_user");
    setCurrentUser(null);
    setView("buy");
  };

  return (
    <div className="page">
      <nav className="nav">
        <div>
          <p className="eyebrow">CampusKart</p>
          <strong>Marketplace</strong>
        </div>
        {currentUser ? (
          <div className="nav-user">
            <span>{currentUser.name}</span>
            <button className="ghost" type="button" onClick={logout}>
              Logout
            </button>
          </div>
        ) : null}
      </nav>

      {status.message && (
        <div className={`status ${status.type}`}>{status.message}</div>
      )}

      {!currentUser ? (
        <section className="auth">
          <div className="card auth-card">
            <h2>Login</h2>
            <p className="muted">Choose your user ID to continue.</p>
            <select value={currentUser?.uid || ""} onChange={handleLoginChange}>
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setView("buy")}>
              Continue
            </button>
          </div>
          <div className="card auth-card">
            <h2>Sign up</h2>
            <form onSubmit={submitSignup} className="form">
              <input
                name="name"
                placeholder="Full name"
                value={signup.name}
                onChange={handleChange(setSignup)}
                required
              />
              <input
                name="email"
                placeholder="College email"
                value={signup.email}
                onChange={handleChange(setSignup)}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={signup.password}
                onChange={handleChange(setSignup)}
                required
              />
              <button type="submit">Create account</button>
            </form>
          </div>
        </section>
      ) : (
        <>
          <header className="hero">
            <div>
              <h1>Welcome back, {currentUser.name}</h1>
              <p className="subtext">
                Browse listings or create a new one. Choose a mode below.
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
              <p className="hint">Filtered via /api/products?q=...</p>
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
                    placeholder="Image URL or file name (in /images)"
                    value={form.image_url}
                    onChange={handleChange(setForm)}
                  />
                  <button type="submit">Create listing</button>
                </form>
              </div>
            </section>
          ) : (
            <section className="grid">
              <section className="card list">
                <div className="list-header">
                  <h2>Listings</h2>
                  <span>{loading ? "Loading..." : `${products.length} items`}</span>
                </div>
                <div className="list-grid">
                  {products.map((item) => (
                    <article key={item.pid} className="item">
                      {item.img_url ? (
                        <img src={item.img_url} alt={item.pname} className="thumb" />
                      ) : (
                        <div className="thumb placeholder">No image</div>
                      )}
                      <div className="item-body">
                        <h3>{item.pname}</h3>
                        <p className="muted">Category: {item.category || "—"}</p>
                        <p className="muted">Seller: {item.seller_name || "—"}</p>
                        <div className="item-actions">
                          <button type="button" onClick={() => quickWishlist(item.pid)}>
                            Add to wishlist
                          </button>
                          <button type="button" className="ghost" onClick={() => quickBuy(item.pid)}>
                            Buy now
                          </button>
                        </div>
                      </div>
                      <div className="item-meta">
                        <span className={`badge ${item.status}`}>{item.status}</span>
                        <p>₹ {item.price}</p>
                        <p className="muted">Copies: {item.no_of_copies}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              <div className="card">
                <h2>Wishlist</h2>
                <form onSubmit={submitWishlist} className="form">
                  <input
                    type="number"
                    name="pid"
                    placeholder="Product ID"
                    value={wishlist.pid}
                    onChange={handleNumberChange(setWishlist)}
                    required
                  />
                  <button type="submit">Add to wishlist</button>
                </form>

                <h2 className="spaced">Record Transaction</h2>
                <form onSubmit={submitPurchase} className="form">
                  <input
                    type="number"
                    name="pid"
                    placeholder="Product ID"
                    value={purchase.pid}
                    onChange={handleNumberChange(setPurchase)}
                    required
                  />
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    value={purchase.quantity}
                    onChange={handleNumberChange(setPurchase)}
                    min={1}
                  />
                  <button type="submit">Complete purchase</button>
                </form>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
