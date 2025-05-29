const express = require('express');
const { signup, login, getProfile, updateProfile } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', getProfile);
router.put('/update-profile', updateProfile);

module.exports = router;