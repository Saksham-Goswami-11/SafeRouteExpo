// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { getMyPosts, updateProfile } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Button from '../components/Button';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedFile, setSelectedFile] = useState(null); // File state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const response = await getMyPosts();
        setMyPosts(response.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchMyPosts();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('bio', bio);
    if (selectedFile) {
      formData.append('profilePicture', selectedFile);
    }

    try {
      const response = await updateProfile(formData);
      login(response.data, localStorage.getItem('token')); 
      setIsEditing(false);
    } catch (err) { alert("Failed to update profile"); }
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrapper}>
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarPlaceholder}>{user?.username?.charAt(0).toUpperCase()}</div>
          )}
        </div>

        <div className={styles.userInfo}>
          {isEditing ? (
            <form onSubmit={handleUpdate} className={styles.editForm}>
              <label className={styles.fileLabel}>
                Change Profile Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setSelectedFile(e.target.files[0])} 
                  className={styles.fileInput}
                />
              </label>
              
              <textarea 
                className={styles.bioArea} 
                rows="3" 
                placeholder="Write your bio..." 
                value={bio} 
                onChange={(e)=>setBio(e.target.value)} 
              />
              
              <div className={styles.editBtns}>
                <Button type="submit">Save Changes</Button>
                <button type="button" onClick={()=>setIsEditing(false)} className={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h1 className={styles.username}>{user?.username}</h1>
              <p className={styles.bio}>{user?.bio || "No bio yet."}</p>
              <div className={styles.metaRow}>
                <span className={styles.roleBadge}>{user?.role}</span>
                <button onClick={()=>setIsEditing(true)} className={styles.editBtn}>Edit Profile</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.contentSection}>
        <h2 className={styles.sectionTitle}>Activity History ({myPosts.length})</h2>
        <div className={styles.postGrid}>
          {loading ? <p>Loading history...</p> : myPosts.map(post => <PostCard key={post._id} post={post} />)}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;