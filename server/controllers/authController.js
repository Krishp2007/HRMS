const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hrms_secret_jwt_token_key_2026_dev', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).populate('managerId', 'fullName email employeeId');

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'Inactive') {
        return res.status(403).json({ message: 'Your account is deactivated. Contact HR.' });
      }

      return res.json({
        _id: user._id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        phone: user.phone,
        manager: user.managerId,
        joiningDate: user.joiningDate,
        status: user.status,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('managerId', 'fullName email employeeId');

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user (client handles token deletion)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  return res.json({ message: 'Logged out successfully' });
};

module.exports = {
  loginUser,
  getMe,
  logoutUser,
};
