const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { loginUser, getMe, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Define rate limit for login: max 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

router.post('/login', loginLimiter, loginUser);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);

module.exports = router;
