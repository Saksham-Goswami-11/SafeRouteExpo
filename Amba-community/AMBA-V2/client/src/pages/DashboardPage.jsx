// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../api/apiService';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        setStats(response.data);
      } catch (err) {
        console.error("Stats Load Failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className={styles.loader}>Analyzing Safety Data...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Safety Analytics</h1>
        <p>Real-time community health and incident metrics.</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.statCard}>
          <h3>{stats?.totalPosts || 0}</h3>
          <p>Total Incidents Reported</p>
        </div>
        <div className={styles.statCard} style={{borderColor: '#e53e3e'}}>
          <h3 style={{color: '#e53e3e'}}>{stats?.highRiskPosts || 0}</h3>
          <p>High Risk Scenarios</p>
        </div>
        <div className={styles.statCard}>
          <h3>{stats?.helpRequests || 0}</h3>
          <p>Active Help Flags</p>
        </div>
      </div>
      
      <div className={styles.infoBox}>
        <h3>AI Insight</h3>
        <p>Current community risk level is <strong>{stats?.highRiskPosts > 5 ? 'Elevated' : 'Stable'}</strong> based on recent reports.</p>
      </div>
    </div>
  );
};

export default DashboardPage;