
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="nav">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div>
                    <p className="eyebrow">CampusKart</p>
                    <strong>Marketplace</strong>
                </div>
            </Link>
            {currentUser ? (
                <div className="nav-user">
                    <Link to="/" style={{ marginRight: '1rem', color: 'inherit', textDecoration: 'none' }}>Home</Link>
                    <Link to="/wishlist" style={{ marginRight: '1rem', color: 'inherit', textDecoration: 'none' }}>Wishlist</Link>
                    <Link to="/dashboard" style={{ marginRight: '1rem', color: 'inherit', textDecoration: 'none' }}>Dashboard</Link>
                    <span>{currentUser.name}</span>
                    <button className="ghost" type="button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            ) : (
                <Link to="/login">Login</Link>
            )}
        </nav>
    );
}
