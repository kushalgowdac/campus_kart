import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProfile from "./pages/SellerProfile";
import Wishlist from "./pages/Wishlist";
import Community from "./pages/Community";
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProductVerification from "./pages/admin/ProductVerification";
import AdminUserManagement from "./pages/admin/UserManagement";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminReports from "./pages/admin/Reports";
import "./styles.css";

const ProtectedRoute = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const AdminProtectedRoute = () => {
  const token = localStorage.getItem("adminToken");
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
};

const AppLayout = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthPortal = location.pathname === "/login" || location.pathname === "/admin/login";

  return (
    <div className={isAuthPortal || isAdminRoute ? "page page--full" : "page"}>
      {!isAuthPortal && !isAdminRoute && <Navbar />}
      <div className={isAuthPortal || isAdminRoute ? "" : "container"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<AdminProductVerification />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="reports" element={<AdminReports />} />
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/:sellerId" element={<SellerProfile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/community" element={<Community />} />
          </Route>
        </Routes>
      </div>
      {!isAuthPortal && !isAdminRoute && <Chatbot />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}
