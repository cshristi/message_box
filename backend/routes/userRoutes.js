const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { storage } = require('../utils/cloudinary'); // <-- import
const upload = multer({ storage });

const router = express.Router();

// Middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Unauthorized");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
};

// GET user by ID
router.get('/users/:id', auth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found");
  res.json(user);
});

// PUT: Update Profile with Cloudinary
router.put('/users/update-profile/:id', auth, upload.single('profilePhoto'), async (req, res) => {
  const { name, email, password } = req.body;
  const updates = { name, email };

  if (password) {
    updates.password = await bcrypt.hash(password, 10);
  }

  if (req.file && req.file.path) {
    updates.profilePhoto = req.file.path; // Cloudinary URL
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!updatedUser) return res.status(404).send("User not found");

  res.json(updatedUser);
});

module.exports = router;
