
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createUser } from "../api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const RVCE_DOMAIN = "@rvce.edu.in";
const isRvceEmail = (email) => typeof email === "string" && email.trim().toLowerCase().endsWith(RVCE_DOMAIN);

export default function Login() {
    const { users, login, loading, reloadUsers, currentUser } = useAuth();
    const [signup, setSignup] = useState({ name: "", email: "", password: "" });
    const [loginUid, setLoginUid] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Avoid a race where we navigate before AuthContext state updates,
        // which can cause ProtectedRoute to immediately bounce back to /login.
        if (currentUser) {
            navigate("/", { replace: true });
        }
    }, [currentUser, navigate]);

    const handleLoginChange = (e) => {
        setError("");
        setMessage("");
        setLoginUid(e.target.value);
    };

    const submitLogin = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        if (!loginUid) {
            setError("Please select a user to log in.");
            return;
        }

        const selected = users.find((u) => String(u.uid) === String(loginUid));
        if (selected?.email && !isRvceEmail(selected.email)) {
            setError("Only RVCE email IDs are allowed.");
            return;
        }
        const success = await login(loginUid);
        if (!success) setError("Unable to log in. Please try again.");
    };

    const handleChange = (e) => {
        setError("");
        setMessage("");
        setSignup({ ...signup, [e.target.name]: e.target.value });
    };

    const submitSignup = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!isRvceEmail(signup.email)) {
            setError("Only RVCE email IDs are allowed.");
            return;
        }

        setSubmitting(true);
        try {
            await createUser(signup);
            setSignup({ name: "", email: "", password: "" });
            await reloadUsers();
            setMessage("Account created. You can now select your user to log in.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <section className="auth-page" aria-label="Login and signup">
            <Navbar variant="portal" />

            <div className="auth-center">
                <div className="auth-inner">
                    <div className="auth-layout">
                    <div className="card auth-card">
                    <h2 className="auth-title">Login</h2>
                    <p className="muted">Select your account to continue.</p>

                    <form className="form" onSubmit={submitLogin}>
                        <label className="field" htmlFor="login-user">
                            <span className="label">User</span>
                            <select id="login-user" onChange={handleLoginChange} value={loginUid}>
                                <option value="" disabled>Select user</option>
                                {users.map((user) => (
                                    <option key={user.uid} value={String(user.uid)}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </label>

                        {users.length === 0 && (
                            <p className="hint">No users found yet — create an account on the right.</p>
                        )}

                        <button type="submit">Login</button>
                        <p className="hint">Tip: after signup, your account appears here.</p>
                    </form>
                    </div>

                    <div className="card auth-card">
                    <h2 className="auth-title">Sign up</h2>

                    <div aria-live="polite" aria-atomic="true">
                        {error && <p className="error">{error}</p>}
                        {message && <p className="muted">{message}</p>}
                    </div>

                    <form onSubmit={submitSignup} className="form" noValidate>
                        <label className="field" htmlFor="signup-name">
                            <span className="label">Full name</span>
                            <input
                                id="signup-name"
                                name="name"
                                autoComplete="name"
                                value={signup.name}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label className="field" htmlFor="signup-email">
                            <span className="label">Email</span>
                            <input
                                id="signup-email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={signup.email}
                                onChange={handleChange}
                                required
                            />
                            <span className="hint">Use your RVCE email (ends with {RVCE_DOMAIN}).</span>
                        </label>

                        <label className="field" htmlFor="signup-password">
                            <span className="label">Password</span>
                            <input
                                id="signup-password"
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                value={signup.password}
                                onChange={handleChange}
                                required
                                minLength={4}
                            />
                        </label>

                        <button type="submit" disabled={submitting}>
                            {submitting ? "Creating..." : "Create account"}
                        </button>
                    </form>
                    </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
