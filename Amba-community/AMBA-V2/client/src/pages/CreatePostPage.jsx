// src/pages/CreatePostPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // <-- Axios import zaruri hai direct call ke liye
import api from '../api/apiService';
import styles from './CreatePostPage.module.css';

const CreatePostPage = () => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [file, setFile] = useState(null);
  
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isHelpFlag, setIsHelpFlag] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [rephrasing, setRephrasing] = useState(false); // <-- New State
  const navigate = useNavigate();

  // --- NEW AI REPHRASE FUNCTION ---
  const handleRephrase = async () => {
    if (!text.trim()) return alert("Please type something first!");
    
    setRephrasing(true);
    try {
      // Direct Python Server Call (Fastest)
      const res = await axios.post('http://127.0.0.1:8000/rephrase', { text });
      setText(res.data.rephrased_text); // Text update kar dia
    } catch (err) {
      console.error("Rephrase failed", err);
      alert("Could not rephrase. Try again.");
    } finally {
      setRephrasing(false);
    }
  };
  // --------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('text', text);
    formData.append('locationLandmark', location);
    formData.append('isAnonymous', isAnonymous);
    formData.append('isFlaggedForHelp', isHelpFlag);
    if (file) formData.append('media', file);

    try {
      await api.post('/posts', formData);
      navigate('/');
    } catch (err) { alert("Post failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <button onClick={() => navigate(-1)} className={styles.backLink}>← Back</button>
          <h1>Report Incident</h1>
        </header>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Title</label>
            <input placeholder="Short headline..." value={title} onChange={(e)=>setTitle(e.target.value)} required />
          </div>

          <div className={styles.inputGroup}>
            <label>Location</label>
            <input placeholder="Landmark, Sector, or City..." value={location} onChange={(e)=>setLocation(e.target.value)} required />
          </div>

          <div className={styles.inputGroup}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <label>Description</label>
              
              {/* --- MAGIC BUTTON --- */}
              <button 
                type="button" 
                onClick={handleRephrase} 
                className={styles.magicBtn}
                disabled={rephrasing || !text}
              >
                {rephrasing ? '✨ Magic...' : '✨ AI Rephrase'}
              </button>
              {/* -------------------- */}

            </div>
            <textarea 
              placeholder="Describe the situation (You can write in Hinglish too)..." 
              value={text} 
              onChange={(e)=>setText(e.target.value)} 
              required 
            />
          </div>
          
          {/* Toggles */}
          <div className={styles.toggleSection}>
            <div className={`${styles.toggleRow} ${isAnonymous ? styles.activeRow : ''}`}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleIcon}>👻</span>
                <div>
                  <span className={styles.toggleTitle}>Post Anonymously</span>
                  <p className={styles.toggleDesc}>Hide your username from public view.</p>
                </div>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={`${styles.toggleRow} ${isHelpFlag ? styles.dangerRow : ''}`}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleIcon}>🚨</span>
                <div>
                  <span className={styles.toggleTitle}>Raise Help Flag</span>
                  <p className={styles.toggleDesc}>Alert NGOs & Authorities immediately.</p>
                </div>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={isHelpFlag} onChange={(e) => setIsHelpFlag(e.target.checked)} />
                <span className={`${styles.slider} ${styles.dangerSlider}`}></span>
              </label>
            </div>
          </div>

          <div className={styles.uploadBox}>
            <p>📸 Add Evidence (Optional)</p>
            <input type="file" accept="image/*,video/*" onChange={(e)=>setFile(e.target.files[0])} />
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Processing...' : 'Post to Community'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;