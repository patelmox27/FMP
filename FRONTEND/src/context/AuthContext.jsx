import React, { createContext, useState, useEffect } from 'react';
import { login, register } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync persistence for better zero-latency experience
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, [user]);

  const handleLogin = async (email, password) => {
    try {
      const data = await login(email, password);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.data || data.user || { authenticated: true });
        return true;
      }
    } catch (error) {

      console.error("Login failed", error);
      throw error;
    }
  };

  const handleRegister = async (userData) => {
    try {
      await register(userData);
      // Auto-login optionally, or just return success
      return true;
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, handleLogin, handleRegister, handleLogout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
