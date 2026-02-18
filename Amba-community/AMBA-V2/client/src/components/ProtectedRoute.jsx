// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth(); // Check karo ki user logged in hai ya nahi

  if (!user) {
    // Agar logged in nahi hai, toh login page par bhej do
    return <Navigate to="/login" replace />;
  }

  // Agar logged in hai, toh child components (jaise CreatePostPage) ko render karo
  return <Outlet />;
};

export default ProtectedRoute;