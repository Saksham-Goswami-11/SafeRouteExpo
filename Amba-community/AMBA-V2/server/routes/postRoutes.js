// server/routes/postRoutes.js
import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  createPostComment,
  flagPostForHelp,
  getFlaggedPosts,
  getDashboardStats,
  getMyPosts,
  searchLocationSafety,
  toggleLike,      // <-- Ye missing tha
  toggleDislike    // <-- Ye missing tha
} from '../controllers/postController.js';
import { protect, ngo } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// --- Specific Routes ---
router.get('/search/safety', searchLocationSafety);
router.get('/stats/dashboard', protect, getDashboardStats);
router.get('/flagged', protect, ngo, getFlaggedPosts);
router.get('/my-posts', protect, getMyPosts);

// --- Like/Dislike Routes ---
router.put('/:id/like', protect, toggleLike);
router.put('/:id/dislike', protect, toggleDislike);

// --- General Routes ---
router.get('/', getPosts);
router.post('/', protect, upload.single('media'), createPost);

// --- Dynamic ID Routes ---
router.get('/:id', getPostById);
router.post('/:id/comments', protect, createPostComment);
router.put('/:id/flag', protect, flagPostForHelp);

export default router;