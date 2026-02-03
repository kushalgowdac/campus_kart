
import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchGamificationMe, fetchUsers, trackGamificationLogin } from "../api";

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
    const [gamification, setGamification] = useState(null);

    const reloadUsers = async () => {
        try {
            const usersData = await fetchUsers();
            setUsers(usersData);
            return usersData;
        } catch (err) {
            console.warn("Failed to load users", err);
            setUsers([]);
            return [];
        }
    };

    useEffect(() => {
        // Load users and check local storage
        const initAuth = async () => {
            try {
                const usersData = await reloadUsers();

                const stored = getStoredUser();
                if (stored) {
                    // Verify user still exists vs fetched users
                    const validUser = usersData.find(u => u.uid === stored.uid);
                    if (validUser) {
                        setCurrentUser(validUser);
                        try {
                            const profile = await fetchGamificationMe();
                            setGamification(profile);
                        } catch (err) {
                            // Do not block app boot on gamification.
                            setGamification(null);
                        }
                    } else {
                        localStorage.removeItem("campuskart_user");
                        setCurrentUser(null);
                        setGamification(null);
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

    const refreshGamification = async () => {
        if (!getStoredUser()?.uid) {
            setGamification(null);
            return null;
        }
        const profile = await fetchGamificationMe();
        setGamification(profile);
        return profile;
    };

    const login = async (uid) => {
        const user = users.find((u) => u.uid === Number(uid));
        if (user) {
            setCurrentUser(user);
            localStorage.setItem("campuskart_user", JSON.stringify(user));

            // Best-effort login tracking (adds trust points).
            try {
                await trackGamificationLogin();
            } catch (err) {
                // ignore
            }

            try {
                await refreshGamification();
            } catch {
                // ignore
            }
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem("campuskart_user");
        setGamification(null);
    };

    const value = {
        currentUser,
        users,
        login,
        logout,
        loading,
        reloadUsers,
        gamification,
        refreshGamification,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
