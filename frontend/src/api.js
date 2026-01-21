const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const handle = async (res) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json();
};

export const fetchProducts = async (query = "") => {
  const res = await fetch(`${API_URL}/api/products${query}`);
  return handle(res);
};

export const fetchProductById = async (id) => {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  return handle(res);
};

export const fetchUsers = async () => {
  const res = await fetch(`${API_URL}/api/users`);
  return handle(res);
};

export const createUser = async (payload) => {
  const res = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
};

export const createProductSpec = async (payload) => {
  const res = await fetch(`${API_URL}/api/product-specs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
};

export const createProduct = async (payload) => {
  const res = await fetch(`${API_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
};

export const addWishlist = async (payload) => {
  const res = await fetch(`${API_URL}/api/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
};

export const createTransaction = async (payload) => {
  const res = await fetch(`${API_URL}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
};

export const fetchTransactions = async (query = "") => {
  const res = await fetch(`${API_URL}/api/transactions${query}`);
  return handle(res);
};

export const deleteProduct = async (pid) => {
  const res = await fetch(`${API_URL}/api/products/${pid}`, {
    method: "DELETE"
  });
  return handle(res);
};

export const fetchWishlist = async (uid) => {
  const res = await fetch(`${API_URL}/api/wishlist?uid=${uid}`);
  return handle(res);
};

export const removeWishlistItem = async (uid, pid) => {
  const res = await fetch(`${API_URL}/api/wishlist/${uid}/${pid}`, {
    method: "DELETE"
  });
  return handle(res);
};
