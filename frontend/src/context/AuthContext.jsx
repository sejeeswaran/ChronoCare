import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

const TOKEN_KEY = 'chronocare_token';
const USER_KEY = 'chronocare_user';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem(USER_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(false);

    // Persist token + user on changes
    useEffect(() => {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    }, [token]);

    useEffect(() => {
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
        else localStorage.removeItem(USER_KEY);
    }, [user]);

    // Verify token on mount
    useEffect(() => {
        if (!token) return;
        fetch('http://127.0.0.1:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => {
                if (!r.ok) throw new Error('Invalid token');
                return r.json();
            })
            .then(data => setUser(data))
            .catch(() => {
                setToken(null);
                setUser(null);
            });
    }, []);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            setToken(data.token);
            setUser(data.user);
            return data;
        } finally {
            setLoading(false);
        }
    }, []);

    const signup = useCallback(async (name, email, password, role) => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Signup failed');
            setToken(data.token);
            setUser(data.user);
            return data;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        // Force a page reload to nuke the mounted HealthDataContext preventing cross-session data bleeding
        window.location.reload();
    }, []);

    const isDoctor = user?.role === 'doctor';
    const isPatient = user?.role === 'patient';
    const isAuthenticated = !!token && !!user;

    const contextValue = useMemo(() => ({
        user, token, loading,
        login, signup, logout,
        isDoctor, isPatient, isAuthenticated,
    }), [user, token, loading, login, signup, logout, isDoctor, isPatient, isAuthenticated]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export default AuthContext;
