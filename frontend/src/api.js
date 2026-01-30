const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getConfig = (method = "GET", body = null) => {
  const headers = { "Content-Type": "application/json" };
  const stored = localStorage.getItem("campuskart_user");
  if (stored) {
    try {
      const { uid } = JSON.parse(stored);
      headers["X-User-ID"] = uid.toString();
    } catch (e) { /* ignore */ }
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }
  return config;
};

const handle = async (res) => {
  if (!res.ok) {
    const text = await res.text();
    // Try to parse JSON error if possible
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || text);
    } catch (e) {
      throw new Error(text || "Request failed");
    }
  }
  return res.json();
};

export const fetchProducts = async (query = "") => {
  const res = await fetch(`${API_URL}/api/products${query}`);
  return handle(res);
};

export const searchProducts = async (filters) => {
  const params = new URLSearchParams();

  // Only include category and sortPrice
  if (filters.category) {
    params.append('category', filters.category);
  }
  if (filters.sortPrice) {
    params.append('sortPrice', filters.sortPrice);
  }
  const queryString = params.toString();
  const url = queryString
    ? `${API_URL}/api/products/search?${queryString}`
    : `${API_URL}/api/products/search`;
  const res = await fetch(url);
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
  const res = await fetch(`${API_URL}/api/users`, getConfig("POST", payload));
  return handle(res);
};

export const createProductSpec = async (payload) => {
  const res = await fetch(`${API_URL}/api/product-specs`, getConfig("POST", payload));
  return handle(res);
};

export const createProduct = async (payload) => {
  const res = await fetch(`${API_URL}/api/products`, getConfig("POST", payload));
  return handle(res);
};

export const updateProduct = async (pid, payload) => {
  const res = await fetch(`${API_URL}/api/products/${pid}`, getConfig("PUT", payload));
  return handle(res);
};

export const addWishlist = async (payload) => {
  const res = await fetch(`${API_URL}/api/wishlist`, getConfig("POST", payload));
  return handle(res);
};

export const createTransaction = async (payload) => {
  const res = await fetch(`${API_URL}/api/transactions`, getConfig("POST", payload));
  return handle(res);
};

export const fetchTransactions = async (query = "") => {
  const res = await fetch(`${API_URL}/api/transactions${query}`);
  return handle(res);
};

export const getMyPurchases = async () => {
  const res = await fetch(`${API_URL}/api/transactions/my-purchases`, getConfig());
  return handle(res);
};

export const deleteProduct = async (pid) => {
  const res = await fetch(`${API_URL}/api/products/${pid}`, getConfig("DELETE"));
  return handle(res);
};

export const fetchWishlist = async (uid) => {
  const res = await fetch(`${API_URL}/api/wishlist?uid=${uid}`);
  return handle(res);
};

export const removeWishlistItem = async (uid, pid) => {
  const res = await fetch(`${API_URL}/api/wishlist/${uid}/${pid}`, getConfig("DELETE"));
  return handle(res);
};

// OTP / Exchange Flow
export const reserveProduct = async (pid) => {
  const res = await fetch(`${API_URL}/api/products/${pid}/reserve`, getConfig("POST", {}));
  return handle(res);
};

export const confirmMeet = async (pid) => {
  const res = await fetch(`${API_URL}/api/products/${pid}/confirm-meet`, getConfig("POST", {}));
  return handle(res);
};

export const verifyOtp = async (productId, otp) => {
  const res = await fetch(`${API_URL}/api/otp/verify`, getConfig("POST", { productId, otp }));
  return handle(res);
};

export const cancelReservation = async (pid) => {
  const res = await fetch(`${API_URL}/api/products/${pid}/cancel`, getConfig("POST", {}));
  return handle(res);
};

export const rescheduleProduct = async (pid) => {
  const res = await fetch(`${API_URL}/api/products/${pid}/reschedule`, getConfig("POST", {}));
  return handle(res);
};

export const rejectReschedule = async (pid) => {
  const res = await fetch(`${API_URL}/api/products/${pid}/reschedule/reject`, getConfig("POST", {}));
  return handle(res);
};

// Location Selection Flow
export const createLocations = async (pid, locations) => {
  const res = await fetch(`${API_URL}/api/locations/${pid}`, getConfig("POST", { locations }));
  return handle(res);
};

export const getLocations = async (pid) => {
  const res = await fetch(`${API_URL}/api/locations/${pid}`);
  return handle(res);
};

export const selectLocation = async (pid, location) => {
  const res = await fetch(`${API_URL}/api/locations/${pid}/select`, getConfig("POST", { location }));
  return handle(res);
};

// Gamification
export const fetchGamificationMe = async () => {
  const res = await fetch(`${API_URL}/api/gamification/me`, getConfig());
  return handle(res);
};

export const fetchUserGamification = async (uid) => {
  const res = await fetch(`${API_URL}/api/gamification/user/${uid}`);
  return handle(res);
};

export const trackGamificationLogin = async () => {
  const res = await fetch(`${API_URL}/api/gamification/login`, getConfig("POST", {}));
  return handle(res);
};

export const fetchLeaderboard = async (limit = 10) => {
  const res = await fetch(`${API_URL}/api/gamification/leaderboard?limit=${encodeURIComponent(limit)}`);
  return handle(res);
};

export const createRating = async (payload) => {
  const res = await fetch(`${API_URL}/api/gamification/ratings`, getConfig("POST", payload));
  return handle(res);
};

export const checkRatingStatus = async (pid) => {
  const res = await fetch(`${API_URL}/api/gamification/ratings/${pid}`, getConfig("GET"));
  return handle(res);
};
