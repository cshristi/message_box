'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Users, Settings, LogOut, X } from 'lucide-react';
import io from 'socket.io-client';

// Generate unique message ID (fallback if backend doesn't provide _id)
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ChatApp = () => {
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [token, setToken] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token') || '';
      const storedEmail = localStorage.getItem('email') || 'user@example.com';
      const storedName = localStorage.getItem('username') || 'You';
      setToken(storedToken);
      setCurrentUserEmail(storedEmail);
      setCurrentUserName(storedName);
    }
  }, []);

  useEffect(() => {
    if (!token || !currentUserEmail || !currentUserName) return;

    socketRef.current = io('http://localhost:5000', {
      auth: { token },
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketRef.current.emit('userJoined', {
      email: currentUserEmail,
      name: currentUserName,
    });

    socketRef.current.on('updateUserList', (users) => {
      const otherUsers = users.filter((user) => user.email !== currentUserEmail);
      setAllUsers(otherUsers);
    });

    socketRef.current.on('receiveMessage', (messageData) => {
      const { _id, senderEmail, receiverEmail, content, timestamp } = messageData;

      if (senderEmail === currentUserEmail) return;

      const key = [senderEmail, receiverEmail].sort().join('-');

      setMessages((prev) => {
        const currentMessages = prev[key] || [];
        const messageExists = currentMessages.some(
          (msg) =>
            (_id && msg._id === _id) ||
            (msg.senderEmail === senderEmail &&
              msg.content === content &&
              Math.abs(new Date(msg.timestamp) - new Date(timestamp)) < 5000)
        );

        if (messageExists) return prev;

        return {
          ...prev,
          [key]: [
            ...currentMessages,
            {
              _id: _id || generateMessageId(),
              sender: messageData.sender,
              senderEmail,
              receiverEmail,
              content,
              timestamp, // Use backend-provided timestamp string
              isOwn: false,
            },
          ],
        };
      });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, currentUserEmail, currentUserName]);

  useEffect(() => {
    if (!token || !currentUserEmail) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        const otherUsers = data.filter((user) => user.email !== currentUserEmail);
        setAllUsers(otherUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        alert('Failed to load users. Please try again.');
      }
    };
    fetchUsers();
  }, [token, currentUserEmail]);

  useEffect(() => {
    if (!token || !currentUserEmail) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/messages', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        const grouped = {};
        data.forEach((msg) => {
          // Only process private messages (receiverEmail exists)
          if (!msg.receiverEmail) return;
          const key = [msg.senderEmail, msg.receiverEmail].sort().join('-');
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            _id: msg._id || generateMessageId(),
            sender: msg.sender,
            senderEmail: msg.senderEmail,
            receiverEmail: msg.receiverEmail,
            content: msg.content,
            timestamp: msg.timestamp, // Use backend string timestamp
            isOwn: msg.senderEmail === currentUserEmail,
          });
        });
        setMessages(grouped);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        alert('Failed to load messages. Please try again.');
      }
    };
    fetchMessages();
  }, [token, currentUserEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const messageContent = newMessage.trim();
    const messageId = generateMessageId(); // Fallback ID, backend will override with _id

    const newMsg = {
      _id: messageId,
      sender: currentUserName,
      senderEmail: currentUserEmail,
      receiverEmail: selectedUser.email,
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    setNewMessage('');

    const key = [currentUserEmail, selectedUser.email].sort().join('-');
    setMessages((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newMsg],
    }));

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sender: currentUserName,
          senderEmail: currentUserEmail,
          receiverEmail: selectedUser.email,
          content: messageContent,
          room: null, // Explicitly set to null for private messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const savedMessage = await response.json(); // Get saved message with _id
      socketRef.current?.emit('sendMessage', {
        _id: savedMessage._id,
        sender: currentUserName,
        senderEmail: currentUserEmail,
        receiverEmail: selectedUser.email,
        content: messageContent,
        timestamp: savedMessage.timestamp,
        room: null,
      });

      // Update local message with backend _id
      setMessages((prev) => ({
        ...prev,
        [key]: (prev[key] || []).map((msg) =>
          msg._id === messageId ? { ...msg, _id: savedMessage._id } : msg
        ),
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => ({
        ...prev,
        [key]: (prev[key] || []).filter((msg) => msg._id !== messageId),
      }));
      alert('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getChatKey = (email) => [currentUserEmail, email].sort().join('-');
  const currentMessages = selectedUser ? messages[getChatKey(selectedUser.email)] || [] : [];
  const onlineUsers = allUsers.filter((user) => user.isOnline);
  const offlineUsers = allUsers.filter((user) => !user.isOnline);

  return (
    <div className="h-screen flex flex-col pb-4 bg-[#f2f2f2]">
      {/* NAVBAR */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#854C52] text-white shadow">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-wide">ChatApp</h1>
          <p className="text-xs text-gray-300">Private Messaging</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span className="text-sm">{currentUserName}</span>
          </div>
          <Settings className="w-5 h-5 cursor-pointer hover:text-gray-300" />
          <LogOut
            className="w-5 h-5 cursor-pointer hover:text-gray-300"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.clear();
              }
              if (socketRef.current) {
                socketRef.current.disconnect();
              }
             window.location.href = '/login'; // Replace with your actual login page path

            }}
          />
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="flex flex-1 mt-2 px-2 gap-2">
        {/* SIDEBAR */}
        <div className="w-64 text-black bg-[#F3E2E4] shadow-lg flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              USERS ({allUsers.length})
            </h3>
            {onlineUsers.length > 0 && (
              <>
                <p className="text-xs text-green-700 mb-1">🟢 Online</p>
                {onlineUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer mb-1 gap-2 ${
                      selectedUser?.email === user.email ? 'bg-[#A1887F] text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#A1887F] text-white flex items-center justify-center text-sm font-semibold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </>
            )}
            {offlineUsers.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mt-4 mb-1">⚪ Offline</p>
                {offlineUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer mb-1 gap-2 ${
                      selectedUser?.email === user.email ? 'bg-[#A1887F] text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#BDBDBD] text-white flex items-center justify-center text-sm font-semibold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                    </div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-[#FAFAFA] rounded-lg shadow pb-4">
          {selectedUser ? (
            <>
              <div className="bg-[#F3E2E4] shadow-sm p-4 border-b border-gray-300 rounded-t-lg flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-500">{currentMessages.length} messages</p>
                </div>
                <X
                  className="w-5 h-5 text-gray-700 cursor-pointer hover:text-gray-900"
                  onClick={() => setSelectedUser(null)}
                />
              </div>

              <div className="flex-1 p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                {currentMessages.map((msg, i) => (
                  <div
                    key={msg._id || `${msg.senderEmail}-${msg.timestamp}-${i}`}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg text-sm max-w-xs ${
                        msg.isOwn ? 'bg-[#A1887F] text-white' : 'bg-gray-200 text-black'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-[10px] text-right mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef}></div>
              </div>

              <div className="flex items-center p-4 border-t border-gray-200 bg-white">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300   text-black rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="ml-2 p-2 rounded-full bg-[#A1887F] text-white hover:bg-[#8D6E63] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg">Select a user to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatApp;