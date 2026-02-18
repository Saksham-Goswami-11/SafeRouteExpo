// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css'; 
import Input from '../components/Input';
import Button from '../components/Button';
import SocialButton from '../components/SocialButton';
import { loginUser } from '../api/apiService';
import { useAuth } from '../context/AuthContext'; // AuthContext import

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth(); // 'login' function context se lo

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError(null);

    try {
      const userData = { email, password };
      const response = await loginUser(userData);
      
      // Context ke 'login' function ko call karo
      login(response.data, response.data.token);
      
      // User ko homepage par bhej do
      navigate('/');

    } catch (err) { // <-- YEH HAI FIX: (err)
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Log in to continue to AMBA</p>
        
        <form onSubmit={handleLogin} className={styles.form}>
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

          <div className={styles.forgotPassword}>
            <Link to="/forgot-password" className={styles.link}>
              Forgot Password?
            </Link>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          
          <Button type="submit">
            Log In
          </Button>
        </form>
        
        <div className={styles.divider}>
          <span>OR</span>
        </div>
        
        <SocialButton provider="google">
          Continue with Google
        </SocialButton>
        <SocialButton provider="apple">
          Continue with Apple
        </SocialButton>

        <div className={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.link}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;