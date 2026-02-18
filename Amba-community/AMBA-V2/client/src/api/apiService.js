// src/api/apiService.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- AUTH API ---
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (userData) => api.post('/auth/login', userData);
export const updateProfile = (formData) => api.put('/auth/profile', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// --- POSTS API ---
export const getPosts = () => api.get('/posts');
export const getPostById = (postId) => api.get(`/posts/${postId}`);
export const createPost = (formData) => api.post('/posts', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getMyPosts = () => api.get('/posts/my-posts');

// --- LIKE / DISLIKE API ---
export const likePost = (id) => api.put(`/posts/${id}/like`);
// Yahan galti thi (missing '='), ab theek hai:
export const dislikePost = (id) => api.put(`/posts/${id}/dislike`); 

// --- COMMENTS & INTERACTION ---
export const createComment = (postId, commentData) => api.post(`/posts/${postId}/comments`, commentData);
export const flagPostForHelp = (postId) => api.put(`/posts/${postId}/flag`);

// --- DASHBOARD & SEARCH ---
export const getDashboardStats = () => api.get('/posts/stats/dashboard');
export const searchSafety = (query) => api.get(`/posts/search/safety?query=${query}`);
export const getFlaggedPosts = () => api.get('/posts/flagged');

export default api;