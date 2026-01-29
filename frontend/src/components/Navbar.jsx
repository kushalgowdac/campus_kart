
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import rvceLogo from "../assets/rvce-logo.png";

export default function Navbar({ variant = "app" }) {
    const { currentUser, logout, gamification } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="navbar" role="banner">
            <Link to={currentUser ? "/" : "/login"} className="navbar__brand" aria-label="CampusKart">
                <img className="brand-logo" src={rvceLogo} alt="RVCE logo" />
                <div className="brand-text">
                    <div className="brand-title">CampusKart Marketplace</div>
                    <div className="brand-subtitle">RV College of Engineering</div>
                </div>
            </Link>

            <nav className="navbar__actions" aria-label="Primary">
                {variant === "portal" ? null : currentUser ? (
                    <>
                        <Link to="/" className="navbar__link">Home</Link>
                        <Link to="/wishlist" className="navbar__link">Wishlist</Link>
                        <Link to="/dashboard" className="navbar__link">Dashboard</Link>
                        {typeof gamification?.trustPoints === "number" && (
                            <span className="navbar__score" title="Trust Score">
                                Trust: <strong>{gamification.trustPoints}</strong>
                            </span>
                        )}
                        <span className="navbar__user" title={currentUser.email}>{currentUser.name}</span>
                        <button className="ghost" type="button" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <Link to="/login" className="navbar__link">Login</Link>
                )}
            </nav>
        </header>
    );
}
