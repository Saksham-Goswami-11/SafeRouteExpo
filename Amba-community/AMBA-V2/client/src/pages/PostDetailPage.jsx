// src/pages/PostDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById, createComment } from '../api/apiService';
import styles from './PostDetailPage.module.css';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await getPostById(id);
        setPost(response.data);
      } catch (err) { console.error("Could not load report"); }
    };
    fetchPost();
  }, [id]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await createComment(id, { text: commentText });
      setPost(response.data); // Refresh post to show new comment
      setCommentText('');
    } catch (err) { alert("Failed to add comment"); }
    finally { setIsSubmitting(false); }
  };

  if (!post) return <div className={styles.loading}>Generating AI Safety Report...</div>;

  const riskColor = post.riskScore > 0.7 ? '#e53e3e' : post.riskScore > 0.4 ? '#f6e05e' : '#48bb78';

  return (
    <div className={styles.page}>
      <article className={styles.reportCard}>
        {/* Header: Back & Category */}
        <header className={styles.header}>
          <button onClick={() => navigate(-1)} className={styles.backBtn}>← Back to Pulse</button>
          <span className={styles.categoryBadge}>Community Report</span>
        </header>

        {/* Title & Risk */}
        <section className={styles.heroSection}>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.riskBar} style={{ backgroundColor: `${riskColor}22`, borderLeft: `5px solid ${riskColor}` }}>
            <span className={styles.riskLabel}>AI SAFETY SCORE:</span>
            <span className={styles.riskValue} style={{ color: riskColor }}>
              {(post.riskScore * 100).toFixed(0)}% Risk Detected
            </span>
          </div>
        </section>
       



{/* AI SAFETY ADVISOR CARD */}
<div className={styles.aiAdvisorBox}>
  <div className={styles.aiHeader}>
    <span className={styles.robotIcon}>🤖</span>
    <span>AMBA AI Safety Advisor</span>
  </div>
  <p className={styles.aiText}>
    "{post.aiTip || 'Analyze your surroundings and stay connected with family.'}"
  </p>
</div>



        {/* Author & Meta */}
        <section className={styles.metaRow}>
          <div className={styles.authorBox}>
            <div className={styles.avatar}>{post.author?.username?.charAt(0)}</div>
            <div className={styles.authorMeta}>
              <span className={styles.username}>{post.author?.username || 'Anonymous'}</span>
              <span className={styles.timestamp}>Reported on {new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className={styles.locationBadge}>📍 {post.locationLandmark}</div>
        </section>

        {/* Content */}
        <section className={styles.contentBody}>
          <p className={styles.mainText}>{post.text}</p>
          
          {post.mediaUrl && (
            <div className={styles.mediaFrame}>
              {post.mediaType === 'image' ? (
                <img src={post.mediaUrl} alt="Evidence" className={styles.evidenceMedia} />
              ) : (
                <video src={post.mediaUrl} controls className={styles.evidenceMedia} />
              )}
            </div>
          )}
        </section>

        {/* Interaction Bar */}
        <div className={styles.interactionBar}>
          <button className={styles.supportBtn}>🛡️ Support this Report</button>
          <button className={styles.shareBtn}>🔗 Share</button>
        </div>

        {/* Comment Section */}
        <section className={styles.commentsSection}>
          <h3>Community Discussion ({post.comments?.length || 0})</h3>
          
          <form onSubmit={handleComment} className={styles.commentForm}>
            <textarea 
              placeholder="Provide more info or offer support..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          <div className={styles.commentList}>
            {post.comments?.map((comment, index) => (
              <div key={index} className={styles.commentCard}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentUser}>{comment.username}</span>
                  <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className={styles.commentText}>{comment.text}</p>
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
};

export default PostDetailPage;