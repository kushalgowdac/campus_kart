
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createUser } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const { users, login, loading } = useAuth();
    const [signup, setSignup] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLoginChange = (e) => {
        const success = login(e.target.value);
        if (success) {
            navigate("/");
        }
    };

    const handleChange = (e) => {
        setSignup({ ...signup, [e.target.name]: e.target.value });
    };

    const submitSignup = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await createUser(signup);
            setSignup({ name: "", email: "", password: "" });
            // ideally trigger a reload of users in context,
            // but for now we might need to refresh or add to context manually.
            // simpler: just alert user to refresh or quick "login" if we returned the user.
            alert("Signup successful! Please refresh to log in.");
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <section className="auth">
            <div className="card auth-card">
                <h2>Login</h2>
                <p className="muted">Choose your user ID to continue.</p>
                <select onChange={handleLoginChange} defaultValue="">
                    <option value="" disabled>Select user</option>
                    {users.map((user) => (
                        <option key={user.uid} value={user.uid}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
            </div>
            <div className="card auth-card">
                <h2>Sign up</h2>
                {error && <p className="error">{error}</p>}
                <form onSubmit={submitSignup} className="form">
                    <input
                        name="name"
                        placeholder="Full name"
                        value={signup.name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="email"
                        placeholder="College email"
                        value={signup.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={signup.password}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit">Create account</button>
                </form>
            </div>
        </section>
    );
}
