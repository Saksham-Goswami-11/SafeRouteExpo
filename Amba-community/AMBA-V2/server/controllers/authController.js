// server/controllers/authController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- LOGIN USER (Fixed) ---
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Response mein default values bhej rahe hain agar field missing ho toh
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio || "Safe streets, strong community.",
        profilePicture: user.profilePicture || "",
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- REGISTER USER ---
export const registerUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ username, email, password, role });
    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- GET ME ---
export const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// --- UPDATE PROFILE ---
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.bio = req.body.bio || user.bio;
      
      if (req.file) {
        // Backend URL check karo, agar port 5000 hai toh ye sahi hai
        user.profilePicture = `http://localhost:5000/uploads/${req.file.filename}`;
      }
      
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        profilePicture: updatedUser.profilePicture
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};