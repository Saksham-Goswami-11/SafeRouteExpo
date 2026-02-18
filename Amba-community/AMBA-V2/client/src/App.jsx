// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailPage from './pages/PostDetailPage';
import NGOHelpDesk from './pages/NGOHelpDesk';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage'; // Naya Import

// Auth Route Wrappers
import ProtectedRoute from './components/ProtectedRoute';
import NGORoute from './components/NGORoute';

function App() {
  return (
    <> 
      <Navbar /> 
      <main>
        <Routes>
          {/* --- Public Routes (Sab dekh sakte hain) --- */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/search" element={<SearchPage />} /> {/* Naya Route */}
          
          {/* --- Protected Member Routes (Sirf logged-in users) --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* --- NGO Only Routes --- */}
          <Route element={<NGORoute />}>
            <Route path="/ngo-help-desk" element={<NGOHelpDesk />} />
          </Route>

          {/* 404 - Not Found */}
          <Route path="*" element={
            <div style={{padding: '100px', textAlign: 'center'}}>
              <h1>404 - Page Not Found</h1>
              <a href="/" style={{color: 'var(--foreground)'}}>Go Home</a>
            </div>
          } />
        </Routes>
      </main>
    </>
  );
}

export default App;