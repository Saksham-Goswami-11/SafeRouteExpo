// src/components/Button.jsx
import React from 'react';
import styles from './Button.module.css';

// Hum button ke text ko 'children' se lenge
const Button = ({ children, onClick, type = 'button' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={styles.button}
    >
      {children}
    </button>
  );
};

export default Button;