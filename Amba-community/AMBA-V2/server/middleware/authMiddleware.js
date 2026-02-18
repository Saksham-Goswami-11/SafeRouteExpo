// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// --- Protect Middleware (Security Guard) ---
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Get the token from the header
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find and attach the user
      req.user = await User.findById(decoded.id).select('-password');

      // 5. Move to the next function
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // 6. If no token
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// --- NGO/Admin Middleware (Role Check) ---
// This middleware *must* run AFTER the 'protect' middleware
export const ngo = (req, res, next) => {
  // 1. We assume 'protect' has already run and attached 'req.user'
  if (req.user && (req.user.role === 'ngo' || req.user.role === 'admin')) {
    // 2. If the user's role is 'ngo' or 'admin', let them pass
    next();
  } else {
    // 3. If not, send a 403 (Forbidden) error
    res.status(403).json({ message: 'Not authorized. NGO or Admin access required.' });
  }
};