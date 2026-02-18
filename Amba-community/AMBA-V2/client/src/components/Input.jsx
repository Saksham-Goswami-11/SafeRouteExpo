// src/components/Input.jsx
import React from 'react';
import styles from './Input.module.css';

// Hum 'props' (jaise type, placeholder) ko directly input field mein pass kar denge
const Input = ({ type = 'text', placeholder, value, onChange }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={styles.input}
    />
  );
};

export default Input;