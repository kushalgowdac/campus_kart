import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProfile from "./pages/SellerProfile";
import Wishlist from "./pages/Wishlist";
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import "./styles.css";

const ProtectedRoute = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const AppLayout = () => {
  const location = useLocation();
  const isAuthPortal = location.pathname === "/login";

  return (
    <div className={isAuthPortal ? "page page--full" : "page"}>
      {!isAuthPortal && <Navbar />}
      <div className={isAuthPortal ? "" : "container"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/:sellerId" element={<SellerProfile />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>
        </Routes>
      </div>
      {!isAuthPortal && <Chatbot />}
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
