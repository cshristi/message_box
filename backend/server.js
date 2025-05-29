// const express = require('express');
// const http = require('http');
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const messageRoutes = require('./routes/messageRoutes');
// const cors = require('cors');
// const socketIO = require('socket.io');
// const User = require('./models/User');
// const Message = require('./models/Message'); // Add Message model import
// require('dotenv').config();

// const app = express();
// const server = http.createServer(app);
// const io = socketIO(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//   },
// });

// connectDB();

// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:3000',
//   credentials: true,
// }));
// app.use(express.json());

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api', userRoutes);
// app.use('/api/messages', messageRoutes);
// // Example Express route
// app.post('/api/messages/mark-read', (req, res) => {
//   const { messageIds, userEmail } = req.body;
//   // Your logic to update the messages in the database
//   res.json({ success: true });
// });

// // Store connected users in Map { socketId => userData }
// const connectedUsers = new Map();

// io.on('connection', (socket) => {
//   socket.on('typing', ({ from, to }) => {
//     io.to(to).emit('typing', { from });
//   });

//   socket.on('stopTyping', ({ from, to }) => {
//     io.to(to).emit('stopTyping', { from });
//   });
// });

// io.on('connection', (socket) => {
//   console.log(`🔌 User connected: ${socket.id}`);

//   socket.on('userJoined', async (userData) => {
//     connectedUsers.set(socket.id, userData);
//     console.log(`👤 ${userData.name} joined the chat`);

//     // Update user's isOnline status in the database
//     try {
//       await User.findOneAndUpdate(
//         { email: userData.email },
//         { isOnline: true },
//         { new: true }
//       );
//       // Emit updated user list
//       const users = await User.find({}, 'name email isOnline').lean();
//       io.emit('updateUserList', users);
//     } catch (error) {
//       console.error('Error updating user online status:', error);
//     }
//   });

//   socket.on('sendMessage', (messageData) => {
//     io.emit('receiveMessage', messageData);
//   });

//   // Handle marking messages as read
//   socket.on('markMessagesRead', async ({ messageIds, userEmail }) => {
//     try {
//       // Update messages in database
//       await Message.updateMany(
//         { _id: { $in: messageIds } },
//         { $addToSet: { readBy: userEmail } }
//       );

//       // Get updated messages to emit the read status
//       const updatedMessages = await Message.find({ _id: { $in: messageIds } });
      
//       // Emit read receipt to all connected clients
//       updatedMessages.forEach(message => {
//         io.emit('messageRead', {
//           messageId: message._id,
//           readBy: message.readBy
//         });
//       });

//       console.log(`📖 Messages marked as read by ${userEmail}`);
//     } catch (error) {
//       console.error('Error marking messages as read:', error);
//     }
//   });

//   socket.on('disconnect', async () => {
//     const userData = connectedUsers.get(socket.id);
//     console.log(`❌ User disconnected: ${socket.id}`);
//     connectedUsers.delete(socket.id);

//     if (userData) {
//       try {
//         // Update user's isOnline status in the database
//         await User.findOneAndUpdate(
//           { email: userData.email },
//           { isOnline: false },
//           { new: true }
//         );
//         // Emit updated user list
//         const users = await User.find({}, 'name email isOnline').lean();
//         io.emit('updateUserList', users);
//       } catch (error) {
//         console.error('Error updating user offline status:', error);
//       }
//     }
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const cors = require('cors');
const socketIO = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
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

// Example Express route for marking messages as read
app.post('/api/messages/mark-read', async (req, res) => {
  const { messageIds, userEmail } = req.body;
  try {
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: userEmail } }
    );
    const updatedMessages = await Message.find({ _id: { $in: messageIds } });
    res.json({ success: true, messages: updatedMessages });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Store connected users in Map { socketId => userData }
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('userJoined', async (userData) => {
    connectedUsers.set(socket.id, userData);
    console.log(`👤 ${userData.name} joined the chat`);
    console.log('Connected users:', Array.from(connectedUsers.entries()).map(([id, data]) => ({ id, email: data.email })));

    try {
      await User.findOneAndUpdate(
        { email: userData.email },
        { isOnline: true },
        { new: true }
      );
      const users = await User.find({}, 'name email isOnline').lean();
      io.emit('updateUserList', users);
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  });

  socket.on('sendMessage', (messageData) => {
    console.log('Message received on server:', messageData);
    io.emit('receiveMessage', messageData);
  });

  socket.on('typing', ({ from, to, senderEmail }) => {
    console.log(`📝 ${from} is typing to ${to}`);
    const recipientSocket = Array.from(connectedUsers.entries())
      .find(([_, userData]) => userData.email === to);
    if (recipientSocket) {
      io.to(recipientSocket[0]).emit('typing', { from, senderEmail: from });
      console.log(`✅ Typing event sent to ${to}`);
    } else {
      console.log(`❌ Recipient ${to} not found online`);
    }
  });

  socket.on('stopTyping', ({ from, to, senderEmail }) => {
    console.log(`⏹️ ${from} stopped typing to ${to}`);
    const recipientSocket = Array.from(connectedUsers.entries())
      .find(([_, userData]) => userData.email === to);
    if (recipientSocket) {
      io.to(recipientSocket[0]).emit('stopTyping', { from, senderEmail: from });
      console.log(`✅ Stop typing event sent to ${to}`);
    } else {
      console.log(`❌ Recipient ${to} not found online`);
    }
  });

  socket.on('markMessagesRead', async ({ messageIds, userEmail }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { readBy: userEmail } }
      );
      const updatedMessages = await Message.find({ _id: { $in: messageIds } });
      updatedMessages.forEach((message) => {
        io.emit('messageRead', {
          messageId: message._id,
          readBy: message.readBy,
        });
      });
      console.log(`📖 Messages marked as read by ${userEmail}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', async () => {
    const userData = connectedUsers.get(socket.id);
    console.log(`❌ User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.id);

    if (userData) {
      try {
        await User.findOneAndUpdate(
          { email: userData.email },
          { isOnline: false },
          { new: true }
        );
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