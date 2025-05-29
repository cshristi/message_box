const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  senderEmail: {
    type: String,
    required: true,
  },
  receiverEmail: {
    type: String,
    required: false, // null for group messages
  },
  content: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    required: false, // null for private messages
  },
  timestamp: {
    type: String,
    default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  readBy: [{
    type: String, // Array of user emails who have read this message
    required: false,
  }],
}, {
  timestamps: true, // This adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Message', messageSchema);