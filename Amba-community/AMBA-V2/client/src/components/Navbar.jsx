// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// Ye line miss ho gayi thi, isliye error aaya 👇
import styles from './Navbar.module.css'; 
import DarkModeToggle from './DarkModeToggle';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation(); 
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [navSearch, setNavSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper function: Safe NGO Role Check (Capital/Small letters handle karega)
  const isNGO = (user) => {
    return user?.role && user.role.toLowerCase() === 'ngo';
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/search?query=${navSearch}`);
      setNavSearch('');
      setIsMenuOpen(false);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.logoSection}>
          {location.pathname !== '/' && (
            <button onClick={() => navigate(-1)} className={styles.backBtn}>←</button>
          )}
          <Link to="/" className={styles.logo} onClick={closeMenu}>AMBA</Link>
        </div>

        <form onSubmit={handleQuickSearch} className={styles.navSearchForm}>
          <input 
            type="text" 
            placeholder="Search location..." 
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className={styles.navSearchInput}
          />
        </form>
        
        <div className={styles.rightSection}>
          <button className={styles.menuBtn} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.menuOpen : ''}`}>
        <div className={styles.mobileLinks}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/search" onClick={closeMenu}>Safety Search</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={closeMenu}>Safety Stats</Link>
              <Link to="/profile" onClick={closeMenu}>My Profile</Link>
              
              {/* --- FIXED NGO LOGIC --- */}
              {isNGO(user) && (
                <Link to="/ngo-help-desk" onClick={closeMenu} style={{ color: '#e53e3e' }}>
                  🚨 NGO Help Desk
                </Link>
              )}
              {/* ----------------------- */}
              
              <button onClick={() => { logout(); closeMenu(); }} className={styles.mobileLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>Login</Link>
              <Link to="/register" onClick={closeMenu}>Register</Link>
            </>
          )}
          <div className={styles.menuFooter}>
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;