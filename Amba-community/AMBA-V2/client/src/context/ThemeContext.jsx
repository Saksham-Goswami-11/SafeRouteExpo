// src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

// Pehle check karo ki user ne pehle se koi theme chuni thi ya nahi
const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('theme');
    if (typeof storedPrefs === 'string') {
      return storedPrefs;
    }
    // Agar user ne nahi chuni, toh unke system ki setting check karo
    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (userMedia.matches) {
      return 'dark';
    }
  }
  return 'light'; // Default
};

// 1. Context banao
const ThemeContext = createContext();

// 2. "Provider" component banao (jo poori app ko wrap karega)
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Jab bhi 'theme' state badle, yeh effect run hoga
  useEffect(() => {
    // body tag par class add/remove karo
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
    // User ki choice ko browser mein save karo
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Ek custom hook banao taaki toggle button aasani se context use kar sake
export const useTheme = () => {
  return useContext(ThemeContext);
};