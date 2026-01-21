
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import SellerDashboard from "./pages/SellerDashboard";
import Wishlist from "./pages/Wishlist";
import "./styles.css";

const ProtectedRoute = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="page">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/dashboard" element={<SellerDashboard />} />
              <Route path="/wishlist" element={<Wishlist />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
