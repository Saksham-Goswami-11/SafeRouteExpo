// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './RegisterPage.module.css';
import Input from '../components/Input';
import Button from '../components/Button';
import { registerUser } from '../api/apiService';
// Ab humein yahan 'useAuth' ki zaroorat nahi hai

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Success message
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    try {
      const userData = { username, email, password, role };
      await registerUser(userData);
      
      if (role === 'ngo') {
        setSuccess('Application submitted! Your account is pending verification.');
      } else {
        setSuccess('Registration successful! Please log in.');
        setTimeout(() => {
          navigate('/login'); // User ko login page par bhejo
        }, 2000); 
      }

    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        {/* ... (Baaki saara JSX waisa hi hai) ... */}

        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join AMBA to stay safe and aware</p>
        
        <form onSubmit={handleRegister} className={styles.form}>
          
          <div className={styles.roleSelector}>
            <button
              type="button" 
              className={`${styles.roleButton} ${role === 'member' ? styles.active : ''}`}
              onClick={() => setRole('member')}
            >
              I'm a Member
            </button>
            <button
              type="button"
              className={`${styles.roleButton} ${role === 'ngo' ? styles.active : ''}`}
              onClick={() => setRole('ngo')}
            >
              I'm an NGO/Helper
            </button>
          </div>
          
          {role === 'ngo' && (
            <p className={styles.helperText}>
              NGO/Helper accounts require manual verification and will be pending approval.
            </p>
          )}

          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <Button type="submit">
            Sign Up
          </Button>
        </form>
        
        <div className={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;