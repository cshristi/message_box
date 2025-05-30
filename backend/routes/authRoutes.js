const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Signup route
router.post('/signup', authController.signup);

// Login route
router.post('/login', authController.login);

// Get profile route
router.get('/profile', authController.getProfile);

// Update profile route (with file upload)
router.put('/update-profile', authController.updateProfile);

module.exports = router;