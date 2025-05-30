const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { storage } = require('../utils/cloudinary'); // Use the centralized storage

// Use the storage from utils/cloudinary.js
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    console.log('File filter - File type:', file.mimetype);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Invalid file type. Only jpg, jpeg, and png are allowed.');
      error.code = 'INVALID_FILE_TYPE';
      return cb(error);
    }
    cb(null, true);
  },
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Signup
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.create({ name, email, password });
    res.json({
      token: generateToken(user._id),
      user: {
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(400).json({ error: 'User already exists' });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          name: user.name,
          email: user.email,
          profilePhoto: user.profilePhoto || null,
        },
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      username: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto || null,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  console.log('=== UPDATE PROFILE REQUEST ===');
  console.log('Headers:', req.headers);
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Handle file upload first, then authenticate inside the callback
  upload.single('profilePhoto')(req, res, async (err) => {
    console.log('=== MULTER CALLBACK ===');
    
    if (err) {
      console.error('Multer error details:', {
        message: err.message,
        code: err.code,
        field: err.field,
        stack: err.stack,
        name: err.name
      });
      
      // Handle specific multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: err.message });
      }
      
      return res.status(400).json({ 
        error: `File upload failed: ${err.message || 'Unknown multer error'}`,
        errorCode: err.code || 'UNKNOWN_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }

    console.log('Request body after multer:', req.body);
    console.log('Request file after multer:', req.file);

    // Now authenticate the user
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('User authenticated:', user.name);

      const { username, email, password } = req.body;
      
      // Update fields
      if (username && username.trim()) {
        console.log('Updating name from', user.name, 'to', username.trim());
        user.name = username.trim();
      }
      if (email && email.trim()) {
        console.log('Updating email from', user.email, 'to', email.trim());
        user.email = email.trim();
      }
      if (password && password.trim()) {
        console.log('Updating password');
        user.password = await bcrypt.hash(password, 10);
      }
      if (req.file && req.file.path) {
        console.log('Updating profile photo from', user.profilePhoto, 'to', req.file.path);
        user.profilePhoto = req.file.path; // Save Cloudinary URL
      }

      await user.save();
      console.log('User saved successfully');

      const response = {
        username: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto || null,
      };
      
      console.log('Sending response:', response);
      res.json(response);

    } catch (authErr) {
      console.error('Authentication or save error:', {
        message: authErr.message,
        stack: authErr.stack,
        name: authErr.name
      });
      
      if (authErr.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (authErr.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      res.status(400).json({ 
        error: authErr.message || 'Failed to update profile',
        errorName: authErr.name,
        details: process.env.NODE_ENV === 'development' ? authErr.stack : undefined
      });
    }
  });
};