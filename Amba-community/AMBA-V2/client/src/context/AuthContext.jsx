// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/apiService'; // Hamari API file

// 1. Context banao
const AuthContext = createContext();

// 2. "Provider" component banao
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // Taaki hum pehle check kar sakein

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        // Agar token hai, toh use API header mein set karo
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Ab backend se '/api/auth/me' call karke user ki info lo
        // (Yeh endpoint humne backend mein nahi banaya hai, abhi banayenge)
        try {
          const response = await api.get('/auth/me');
          setUser(response.data); // User ko global state mein save karo
        } catch (err) {
          // Agar token invalid hai, toh user ko logout kar do
          console.error('Token invalid, logging out', err);
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          api.defaults.headers.common['Authorization'] = null;
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // AuthContext.jsx ke andar login function aisa hona chahiye:
const login = (userData, token) => {
  setUser(userData);
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('token', token);
};

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    api.defaults.headers.common['Authorization'] = null;
  };

  // Jab tak loading true hai, poori app ko mat dikhao
  if (loading) {
    return <div>Loading App...</div>; // Yahan hum ek premium spinner laga sakte hain
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook banao
export const useAuth = () => {
  return useContext(AuthContext);
};