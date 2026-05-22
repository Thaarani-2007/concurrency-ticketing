import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Consolidate into a single loading state for clarity
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        // Look for the access token OR the explicit user object we save during Google Login
        const token = localStorage.getItem('access');
        const savedUser = localStorage.getItem('user');

        if (savedUser) {
            // Prefer the saved user object (Guarantees we have the role from Google Login)
            setUser(JSON.parse(savedUser));
        } else if (token) {
            // Fallback for standard login
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
            } catch (error) {
                console.error("Invalid token");
            }
        }
        
        // TELL THE APP WE ARE DONE CHECKING!
        setAuthLoading(false); 
    }, []);

    const login = async (username, password) => {
        const response = await api.post('token/', { username, password });
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        
        const decodedUser = jwtDecode(response.data.access);
        console.log("🔥 THE DECODED TOKEN IS:", decodedUser);
        console.log("DECODED STANDARD TOKEN:", decodedUser);
        setUser(decodedUser);
        
        // CRITICAL: Return the user so Login.jsx knows whether to route to '/' or '/dashboard'
        return decodedUser; 
    };

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user'); // Don't forget to clear this too!
        setUser(null);
    };

    return (
        // CRITICAL: Ensure authLoading and setUser are exposed to the rest of the app
        <AuthContext.Provider value={{ user, setUser, login, logout, authLoading }}>
            {children}
        </AuthContext.Provider>
    );
};