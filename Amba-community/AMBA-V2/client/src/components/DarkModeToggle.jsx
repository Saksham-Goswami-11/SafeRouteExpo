// src/components/DarkModeToggle.jsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from './DarkModeToggle.module.css';

const DarkModeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    // Button par "key" add karna React ke liye accha hai
    // "L" ya "D" text dalo
    <button 
      key={theme} 
      className={styles.toggleButton} 
      onClick={toggleTheme}
    >
      {theme === 'light' ? 'L' : 'D'}
    </button>
  );
};

export default DarkModeToggle;