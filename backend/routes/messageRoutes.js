const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Get all messages (both room and private messages)
router.get('/', async (req, res) => {
  try {
    const room = req.query.room || 'General';
    const messages = await Message.find({
      $or: [
        { room: room }, // Room messages
        { receiverEmail: { $exists: true } } // Private messages
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message (supports both room and private messages)
router.post('/', async (req, res) => {
  const { sender, senderEmail, receiverEmail, content, room = 'General' } = req.body;
  
  try {
    const message = new Message({
      sender,
      senderEmail,
      receiverEmail, // This will be undefined for room messages
      content,
      room,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all online users
router.get('/users/online', async (req, res) => {
  try {
    const users = await User.find({}, 'name email').limit(50);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;