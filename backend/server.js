const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const cors = require('cors');
const socketIO = require('socket.io');
const User = require('./models/User'); // Import User model
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/messages', messageRoutes);

// Store connected users in Map { socketId => userData }
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('userJoined', async (userData) => {
    connectedUsers.set(socket.id, userData);
    console.log(`👤 ${userData.name} joined the chat`);

    // Update user's isOnline status in the database
    try {
      await User.findOneAndUpdate(
        { email: userData.email },
        { isOnline: true },
        { new: true }
      );
      // Emit updated user list
      const users = await User.find({}, 'name email isOnline').lean();
      io.emit('updateUserList', users);
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  });

  socket.on('sendMessage', (messageData) => {
    io.emit('receiveMessage', messageData);
  });

  socket.on('disconnect', async () => {
    const userData = connectedUsers.get(socket.id);
    console.log(`❌ User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.id);

    if (userData) {
      try {
        // Update user's isOnline status in the database
        await User.findOneAndUpdate(
          { email: userData.email },
          { isOnline: false },
          { new: true }
        );
        // Emit updated user list
        const users = await User.find({}, 'name email isOnline').lean();
        io.emit('updateUserList', users);
      } catch (error) {
        console.error('Error updating user offline status:', error);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));