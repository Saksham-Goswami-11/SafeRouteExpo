// src/pages/NGOHelpDesk.jsx
import React, { useState, useEffect } from 'react';
import { getFlaggedPosts } from '../api/apiService';
import styles from './NGOHelpDesk.module.css';
import { Link } from 'react-router-dom';

const NGOHelpDesk = () => {
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlagged = async () => {
      try {
        const response = await getFlaggedPosts();
        setFlaggedPosts(response.data);
      } catch (err) {
        console.error('Error fetching flagged posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlagged();
  }, []);

  if (loading) return <div className={styles.page}>Loading Help Desk...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>NGO Help Desk</h1>
        <p className={styles.subtitle}>Priority incidents flagged by the community and AI.</p>
      </header>

      <div className={styles.list}>
        {flaggedPosts.length === 0 ? (
          <div className={styles.emptyState}>No active help requests at the moment.</div>
        ) : (
          flaggedPosts.map(post => (
            <div key={post._id} className={styles.helpCard}>
              <div className={styles.cardHeader}>
                {/* AI Risk Score Badge */}
                <span className={styles.riskBadge} style={{ 
                  backgroundColor: post.riskScore > 0.7 ? '#e53e3e' : '#f6e05e' 
                }}>
                  AI Risk: {(post.riskScore * 100).toFixed(0)}%
                </span>
                <span className={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>

              <h2 className={styles.postTitle}>{post.title}</h2>
              <p className={styles.location}>📍 {post.locationLandmark}</p>
              <p className={styles.excerpt}>{post.text.substring(0, 120)}...</p>

              <div className={styles.cardActions}>
                <Link to={`/post/${post._id}`} className={styles.viewBtn}>View Full Incident</Link>
                <button className={styles.offerBtn} onClick={() => alert('Feature coming soon: Directly message the user')}>
                  Offer Direct Help
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NGOHelpDesk;