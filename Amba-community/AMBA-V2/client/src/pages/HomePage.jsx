// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Link ko import karo
import { getPosts } from '../api/apiService';
import PostCard from '../components/PostCard';
import styles from './HomePage.module.css';
import Button from '../components/Button'; // Button ko import karo

const HomePage = () => {
  // ... (useState, useEffect code waisa hi rahega) ...
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await getPosts();
        setPosts(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError('Failed to load feed. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className={styles.homePage}>
      <div className={styles.feedContainer}>

        {/* --- YEH NAYA SECTION HAI --- */}
        <div className={styles.header}>
          <h1 className={styles.title}>The Pulse</h1>
          <Link to="/create-post">
            <Button>Create Post</Button>
          </Link>
        </div>
        {/* --- YAHAN TAK --- */}

        {loading && <p>Loading posts...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && (
          <div className={styles.postList}>
            {posts.length === 0 ? (
              <p>No posts yet. Be the first to share!</p>
            ) : (
              posts.map(post => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;