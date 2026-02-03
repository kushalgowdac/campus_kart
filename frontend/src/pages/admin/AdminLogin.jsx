import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../api";

/**
 * @typedef {Object} AdminLoginProps
 */

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => {
    setError("");
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await adminLogin(form.email, form.password);
      localStorage.setItem("adminToken", response.token);
      localStorage.setItem("adminProfile", JSON.stringify(response.admin));
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page admin-auth" aria-label="Admin login">
      <div className="auth-center">
        <div className="auth-inner">
          <div className="card auth-card admin-auth-card">
            <div className="admin-auth__header">
              <p className="eyebrow">Admin Access</p>
              <h2 className="auth-title">CampusKart Console</h2>
              <p className="muted">Sign in with your admin credentials.</p>
            </div>

            {error && <p className="error">{error}</p>}

            <form className="form" onSubmit={handleSubmit}>
              <label className="field" htmlFor="admin-email">
                <span className="label">Admin Email</span>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="field" htmlFor="admin-password">
                <span className="label">Password</span>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </label>

              <button type="submit" disabled={submitting}>
                {submitting ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
