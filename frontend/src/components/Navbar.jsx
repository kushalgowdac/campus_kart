
import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchProducts } from "../api";
import rvceLogo from "../assets/rvce-logo.png";

export default function Navbar({ variant = "app" }) {
    const { currentUser, logout, gamification } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sellerAlertCount, setSellerAlertCount] = useState(0);
    const [buyerAlertCount, setBuyerAlertCount] = useState(0);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {
        if (!currentUser) {
            setSellerAlertCount(0);
            setBuyerAlertCount(0);
            return undefined;
        }

        let active = true;

        const loadAlerts = async () => {
            try {
                const uid = Number(currentUser.uid);
                const inProgressStatuses = ["reserved", "location_proposed", "location_selected", "otp_generated"];

                const [sellerListings, allListings] = await Promise.all([
                    fetchProducts(`?sellerid=${uid}`),
                    fetchProducts(""),
                ]);

                if (!active) return;

                const sellerAlerts = Array.isArray(sellerListings)
                    ? sellerListings.filter((item) =>
                        inProgressStatuses.includes((item.status || "").toLowerCase()) && item.reserved_by
                    ).length
                    : 0;

                const buyerAlerts = Array.isArray(allListings)
                    ? allListings.filter((item) => {
                        const status = (item.status || "").toLowerCase();
                        if (status === "available" || status === "sold") return false;
                        return Number(item.reserved_by) === uid;
                    }).length
                    : 0;

                setSellerAlertCount(sellerAlerts);
                setBuyerAlertCount(buyerAlerts);
            } catch {
                // silent
            }
        };

        loadAlerts();
        const interval = setInterval(loadAlerts, 30000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [currentUser]);

    return (
        <header className="navbar" role="banner">
            <div className="navbar-inner container">
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
                            <Link
                                to="/"
                                className={`navbar__link${location.pathname === "/" && !location.search.includes("view=sell") ? " active" : ""}`}
                            >
                                Home
                                {buyerAlertCount > 0 && <span className="nav-dot nav-dot--corner" aria-label="Cart updates" />}
                            </Link>
                            <Link
                                to="/?view=sell"
                                className={`navbar__link${location.pathname === "/" && location.search.includes("view=sell") ? " active" : ""}`}
                            >
                                Sell
                            </Link>
                            <NavLink to="/community" className={({ isActive }) => `navbar__link${isActive ? " active" : ""}`}>
                                Community
                            </NavLink>
                            <NavLink to="/wishlist" className={({ isActive }) => `navbar__link${isActive ? " active" : ""}`}>
                                Wishlist
                            </NavLink>
                            <NavLink to="/dashboard" className={({ isActive }) => `navbar__link${isActive ? " active" : ""}`}>
                                Dashboard
                                {sellerAlertCount > 0 && <span className="nav-dot nav-dot--corner" aria-label="Reservation updates" />}
                            </NavLink>
                            {currentUser.role === 'admin' && (
                                <NavLink to="/admin" className={({ isActive }) => `navbar__link${isActive ? " active" : ""}`}>
                                    Admin
                                </NavLink>
                            )}
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
            </div>
        </header>
    );
}
