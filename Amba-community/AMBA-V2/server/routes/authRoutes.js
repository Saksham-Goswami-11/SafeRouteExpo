import express from 'express';
import { registerUser, loginUser, getMe, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js'; // Naya import

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Yahan humne 'upload.single' middleware add kiya hai
router.put('/profile', protect, upload.single('profilePicture'), updateUserProfile);

export default router;