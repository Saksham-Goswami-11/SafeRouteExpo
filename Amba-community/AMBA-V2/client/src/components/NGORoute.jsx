// src/components/NGORoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NGORoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // Wait karo jab tak auth check na ho jaye

  // Agar user nahi hai ya uska role 'ngo' nahi hai, toh home bhej do
  if (!user || user.role !== 'ngo') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default NGORoute;