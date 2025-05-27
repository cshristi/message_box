const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  receiverEmail: {
    type: String,
    required: false // Optional for room messages
  },
  content: {
    type: String,
    required: true
  },
  room: {
    type: String,
    default: 'General'
  },
  timestamp: {
    type: String,
    default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);