import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { getAdminProfile } from "../../api";

/**
 * @typedef {Object} AdminLayoutProps
 * @property {React.ReactNode} [children]
 */

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState("");

  const activeSection = useMemo(() => {
    if (location.pathname.startsWith("/admin/products")) return "products";
    if (location.pathname.startsWith("/admin/users")) return "users";
    if (location.pathname.startsWith("/admin/analytics")) return "analytics";
    if (location.pathname.startsWith("/admin/reports")) return "reports";
    return "dashboard";
  }, [location.pathname]);

  const sectionTitle = useMemo(() => {
    const map = {
      dashboard: "Dashboard Overview",
      products: "Product Verification",
      users: "User Management",
      analytics: "Analytics",
      reports: "Reports",
    };
    return map[activeSection] || "Admin";
  }, [activeSection]);

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const response = await getAdminProfile();
        setAdmin(response.admin);
      } catch (err) {
        setError(err.message);
      }
    };

    loadAdmin();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className={`admin-shell ${collapsed ? "admin-shell--collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <Link to="/admin/dashboard" className="admin-brand">
            <span className="admin-brand__dot" />
            <div>
              <p className="admin-brand__title">CampusKart</p>
              <p className="admin-brand__subtitle">Admin Console</p>
            </div>
          </Link>
          <button className="ghost admin-collapse" onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" className={`admin-nav__link ${activeSection === "dashboard" ? "active" : ""}`}>
            Overview
          </NavLink>
          <NavLink to="/admin/products" className={`admin-nav__link ${activeSection === "products" ? "active" : ""}`}>
            Product Verification
          </NavLink>
          <NavLink to="/admin/users" className={`admin-nav__link ${activeSection === "users" ? "active" : ""}`}>
            User Management
          </NavLink>
          <NavLink to="/admin/analytics" className={`admin-nav__link ${activeSection === "analytics" ? "active" : ""}`}>
            Analytics
          </NavLink>
          <NavLink to="/admin/reports" className={`admin-nav__link ${activeSection === "reports" ? "active" : ""}`}>
            Reports
          </NavLink>
          <button type="button" className="admin-nav__link admin-nav__link--logout" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <Toaster position="top-right" />
        <header className="admin-topbar">
          <div>
            <h1 className="admin-page-title">{sectionTitle}</h1>
            <p className="muted">Manage campus marketplace operations with real-time insights.</p>
          </div>
          <div className="admin-topbar__meta">
            {error && <span className="error">{error}</span>}
            {admin ? (
              <div className="admin-profile">
                <div>
                  <p className="admin-name">{admin.full_name}</p>
                  <p className="admin-email">{admin.email}</p>
                </div>
                <span className={`admin-role admin-role--${admin.role}`}>{admin.role.replace("_", " ")}</span>
              </div>
            ) : (
              <span className="muted">Loading admin...</span>
            )}
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
