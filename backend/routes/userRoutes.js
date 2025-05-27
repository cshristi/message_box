const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to get user from token
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

router.get('/users', auth, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user.id } });
  res.json(users);
});

module.exports = router;
// // routes/userRoutes.js
// const express = require('express');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');

// const router = express.Router();

// // Middleware: verify JWT
// const auth = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).send("Unauthorized");

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch {
//     res.status(401).send("Invalid token");
//   }
// };

// // Get all users (except current user)
// router.get('/users', auth, async (req, res) => {
//   try {
//     const users = await User.find({ _id: { $ne: req.user.id } });
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;
