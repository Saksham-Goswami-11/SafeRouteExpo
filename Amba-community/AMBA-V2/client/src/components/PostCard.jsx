// src/components/PostCard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { likePost, dislikePost } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import styles from './PostCard.module.css';

const PostCard = ({ post: initialPost }) => {
  // Hum prop ko 'initialPost' bula rahe hain aur state ko 'post'
  // Taaki jab hum like/dislike karein to UI update ho sake
  const [post, setPost] = useState(initialPost);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Agar parent se naya data aaye, to state update karo
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return alert("Please login to vote.");
    try {
      const { data } = await likePost(post._id);
      setPost(data);
    } catch (err) { console.error("Like failed"); }
  };

  const handleDislike = async (e) => {
    e.stopPropagation();
    if (!user) return alert("Please login to vote.");
    try {
      const { data } = await dislikePost(post._id);
      setPost(data);
    } catch (err) { console.error("Dislike failed"); }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Safety Alert at ${post.locationLandmark}: ${post.text}`,
          url: `${window.location.origin}/post/${post._id}`,
        });
      } catch (err) { console.log("Share failed"); }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
      alert("Link copied to clipboard!");
    }
  };

  // Safe checks using Optional Chaining (?.)
  const isLiked = post?.likes?.includes(user?._id);
  const isDisliked = post?.dislikes?.includes(user?._id);

  return (
    <div className={styles.card} onClick={() => navigate(`/post/${post._id}`)}>
      <div className={styles.cardHeader}>
        <div className={styles.author}>
          {/* ANONYMOUS LOGIC & AVATAR */}
          <div className={styles.avatar}>
            {post.isAnonymous ? '👻' : (post.author?.username?.charAt(0).toUpperCase() || 'U')}
          </div>
          <div className={styles.meta}>
            <span className={styles.username}>
              {post.isAnonymous ? 'Anonymous User' : (post.author?.username || 'User')}
            </span>
            <span className={styles.loc}>📍 {post.locationLandmark}</span>
          </div>
        </div>
        
        {/* HELP FLAG OR RISK SCORE */}
        {post.isFlaggedForHelp ? (
          <div className={styles.helpBadge}>🚨 HELP NEEDED</div>
        ) : (
          <div className={styles.risk} style={{ color: post.riskScore > 0.5 ? '#ff4d4d' : '#00ff88' }}>
            {(post.riskScore * 100).toFixed(0)}% AI Risk
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.text}>
          {post.text.length > 100 ? post.text.substring(0, 100) + '...' : post.text}
        </p>
        
        {/* Thumbnail for Media if available */}
        {post.mediaUrl && post.mediaType === 'image' && (
          <div className={styles.mediaPreview}>
            <img src={post.mediaUrl} alt="Evidence" />
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <button className={`${styles.btn} ${isLiked ? styles.activeLike : ''}`} onClick={handleLike}>
            🛡️ <span>{post?.likes?.length || 0}</span>
          </button>
          <button className={`${styles.btn} ${isDisliked ? styles.activeDislike : ''}`} onClick={handleDislike}>
            ⚠️ <span>{post?.dislikes?.length || 0}</span>
          </button>
          <button className={styles.btn} onClick={(e) => {e.stopPropagation(); navigate(`/post/${post._id}`)}}>
            💬 <span>{post?.comments?.length || 0}</span>
          </button>
        </div>
        <button className={styles.shareBtn} onClick={handleShare}>🔗 Share</button>
      </div>
    </div>
  );
};

export default PostCard;