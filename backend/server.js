const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes'); // Add this line
const cors = require('cors');
const socketIO = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/messages', messageRoutes); // Add message routes

// Store connected users
const connectedUsers = new Map();

// Socket.io Setup
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user joining
  socket.on('userJoined', (userData) => {
    connectedUsers.set(socket.id, userData);
    console.log(`👤 ${userData.name} joined the chat`);
    
    // Broadcast updated user list to all clients
    io.emit('updateUserList', Array.from(connectedUsers.values()));
  });

  // Handle joining specific rooms
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`🏠 User ${socket.id} joined room: ${room}`);
  });

  // Handle sending messages
  socket.on('sendMessage', (messageData) => {
    // Broadcast to specific room or all users
    if (messageData.room) {
      io.to(messageData.room).emit('receiveMessage', messageData);
    } else {
      io.emit('receiveMessage', messageData);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.broadcast.emit('userTyping', data);
  });

  socket.on('stopTyping', (data) => {
    socket.broadcast.emit('userStoppedTyping', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.id);
    
    // Broadcast updated user list to all clients
    io.emit('updateUserList', Array.from(connectedUsers.values()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));