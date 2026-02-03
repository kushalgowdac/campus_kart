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

const getAdminConfig = (method = "GET", body = null) => {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("adminToken");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }
  return config;
};

const handleText = async (res) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.text();
};

export const fetchProducts = async (query = "") => {
  const res = await fetch(`${API_URL}/api/products${query}`, getConfig());
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
  if (filters.q) {
    params.append('q', filters.q);
  }
  const queryString = params.toString();
  const url = queryString
    ? `${API_URL}/api/products/search?${queryString}`
    : `${API_URL}/api/products/search`;
  const res = await fetch(url, getConfig());
  return handle(res);
};

export const fetchProductById = async (id) => {
  const res = await fetch(`${API_URL}/api/products/${id}`, getConfig());
  return handle(res);
};

export const fetchProductSpecs = async (pid) => {
  const res = await fetch(`${API_URL}/api/product-specs?pid=${encodeURIComponent(pid)}`);
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

export const createDispute = async (pid, payload) => {
  const res = await fetch(`${API_URL}/api/products/${pid}/dispute`, getConfig("POST", payload));
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

export const cancelReservation = async (pid, payload = {}) => {
  const res = await fetch(`${API_URL}/api/products/${pid}/cancel`, getConfig("POST", payload));
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

export const fetchBadgesCatalog = async () => {
  const res = await fetch(`${API_URL}/api/gamification/badges`);
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

// Admin Auth
export const adminLogin = async (email, password) => {
  const res = await fetch(`${API_URL}/api/admin/login`, getAdminConfig("POST", { email, password }));
  return handle(res);
};

export const getAdminProfile = async () => {
  const res = await fetch(`${API_URL}/api/admin/me`, getAdminConfig());
  return handle(res);
};

export const adminLogout = async () => {
  const res = await fetch(`${API_URL}/api/admin/logout`, getAdminConfig("POST"));
  return handle(res);
};

// Admin Overview + Logs
export const getAdminOverview = async () => {
  const res = await fetch(`${API_URL}/api/admin/analytics/overview`, getAdminConfig());
  return handle(res);
};

export const getAdminLogs = async () => {
  const res = await fetch(`${API_URL}/api/admin/logs`, getAdminConfig());
  return handle(res);
};

// Admin Products
export const getPendingProducts = async () => {
  const res = await fetch(`${API_URL}/api/admin/products/pending`, getAdminConfig());
  return handle(res);
};

export const getFlaggedProducts = async () => {
  const res = await fetch(`${API_URL}/api/admin/products/flagged`, getAdminConfig());
  return handle(res);
};

export const getVerificationHistory = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/admin/products/history${query ? `?${query}` : ""}`, getAdminConfig());
  return handle(res);
};

export const approveProduct = async (productId) => {
  const res = await fetch(`${API_URL}/api/admin/products/${productId}/approve`, getAdminConfig("POST"));
  return handle(res);
};

export const rejectProduct = async (productId, reason) => {
  const res = await fetch(`${API_URL}/api/admin/products/${productId}/reject`, getAdminConfig("POST", { reason }));
  return handle(res);
};

export const flagProduct = async (productId, reason) => {
  const res = await fetch(`${API_URL}/api/admin/products/${productId}/flag`, getAdminConfig("POST", { reason }));
  return handle(res);
};

// Admin Users
export const getAllUsers = async (filters = {}) => {
  const query = new URLSearchParams(
    Object.entries(filters).reduce((acc, [key, value]) => {
      if (value === undefined || value === null || value === "") {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {})
  ).toString();
  const res = await fetch(`${API_URL}/api/admin/users${query ? `?${query}` : ""}`, getAdminConfig());
  return handle(res);
};

export const getUserDetails = async (userId) => {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}`, getAdminConfig());
  return handle(res);
};

export const getUserActivity = async (userId) => {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/activity`, getAdminConfig());
  return handle(res);
};

export const suspendUser = async (userId, reason, durationDays) => {
  const res = await fetch(
    `${API_URL}/api/admin/users/${userId}/suspend`,
    getAdminConfig("POST", { reason, duration_days: durationDays })
  );
  return handle(res);
};

export const unsuspendUser = async (userId, reason) => {
  const res = await fetch(
    `${API_URL}/api/admin/users/${userId}/unsuspend`,
    getAdminConfig("POST", { reason })
  );
  return handle(res);
};

// Admin Analytics
export const getAnalyticsTrends = async (startDate, endDate) => {
  const res = await fetch(
    `${API_URL}/api/admin/analytics/trends?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`,
    getAdminConfig()
  );
  return handle(res);
};

export const getAnalyticsCategories = async () => {
  const res = await fetch(`${API_URL}/api/admin/analytics/categories`, getAdminConfig());
  return handle(res);
};

export const getAnalyticsLocations = async () => {
  const res = await fetch(`${API_URL}/api/admin/analytics/locations`, getAdminConfig());
  return handle(res);
};

export const getAnalyticsTrustDistribution = async () => {
  const res = await fetch(`${API_URL}/api/admin/analytics/trust-distribution`, getAdminConfig());
  return handle(res);
};

export const getAnalyticsAbandonment = async () => {
  const res = await fetch(`${API_URL}/api/admin/analytics/abandonment`, getAdminConfig());
  return handle(res);
};

export const getAnalyticsPeakTimes = async () => {
  const res = await fetch(`${API_URL}/api/admin/analytics/peak-times`, getAdminConfig());
  return handle(res);
};

// Admin Reports
const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const downloadTransactionsReport = async (startDate, endDate) => {
  const start = startDate || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const end = endDate || new Date().toISOString().slice(0, 10);
  const res = await fetch(
    `${API_URL}/api/admin/reports/transactions?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    getAdminConfig()
  );
  const csv = await handleText(res);
  downloadFile(csv, "transactions_report.csv");
  return csv;
};

export const downloadUsersReport = async () => {
  const res = await fetch(`${API_URL}/api/admin/reports/users`, getAdminConfig());
  const csv = await handleText(res);
  downloadFile(csv, "users_report.csv");
  return csv;
};

export const getFlaggedActivityReport = async () => {
  const res = await fetch(`${API_URL}/api/admin/reports/flagged-activity`, getAdminConfig());
  return handle(res);
};
