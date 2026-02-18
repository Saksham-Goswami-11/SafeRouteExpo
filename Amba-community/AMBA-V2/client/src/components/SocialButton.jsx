// src/components/SocialButton.jsx
import React from 'react';
import styles from './SocialButton.module.css';

// Hum 'G' (Google) aur 'A' (Apple) ko text ki tarah use karenge
// Taki humein icon library ki zaroorat na pade
const SocialButton = ({ children, provider }) => {

  const providerStyle = provider === 'google' ? styles.google : styles.apple;
  const logo = provider === 'google' ? 'G' : ''; // Apple ke liye logo/icon

  return (
    <button className={`${styles.socialButton} ${providerStyle}`}>
      <span className={styles.logo}>{logo}</span>
      {children}
    </button>
  );
};

export default SocialButton;