
import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchUsers } from "../api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getStoredUser = () => {
    try {
        const stored = localStorage.getItem("campuskart_user");
        return stored ? JSON.parse(stored) : null;
    } catch (err) {
        console.warn("Failed to parse stored user", err);
        localStorage.removeItem("campuskart_user");
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => getStoredUser());
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        // Load users and check local storage
        const initAuth = async () => {
            try {
                const usersData = await fetchUsers();
                setUsers(usersData);

                const stored = getStoredUser();
                if (stored) {
                    // Verify user still exists vs fetched users
                    const validUser = usersData.find(u => u.uid === stored.uid);
                    if (validUser) {
                        setCurrentUser(validUser);
                    } else {
                        localStorage.removeItem("campuskart_user");
                        setCurrentUser(null);
                    }
                }
            } catch (err) {
                console.error("Auth init failed", err);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = (uid) => {
        const user = users.find((u) => u.uid === Number(uid));
        if (user) {
            setCurrentUser(user);
            localStorage.setItem("campuskart_user", JSON.stringify(user));
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem("campuskart_user");
    };

    const value = {
        currentUser,
        users,
        login,
        logout,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
