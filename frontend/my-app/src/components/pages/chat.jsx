'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Users, Settings, LogOut, X, Check, CheckCheck } from 'lucide-react';
import io from 'socket.io-client';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast'; // Import react-hot-toast

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
  const [isLoading, setIsLoading] = useState(true);
  const [lastViewedTimestamps, setLastViewedTimestamps] = useState({});
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [currentUserProfilePhoto, setCurrentUserProfilePhoto] = useState('');

  // Handle typing events
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!selectedUser) return;

    if (!isTyping) {
      setIsTyping(true);
      console.log('Emitting typing event:', { from: currentUserEmail, to: selectedUser.email });
      socketRef.current?.emit('typing', {
        from: currentUserEmail,
        to: selectedUser.email,
        senderEmail: currentUserEmail,
      });
    }

    if (typingTimeoutRef.current[currentUserEmail]) {
      clearTimeout(typingTimeoutRef.current[currentUserEmail]);
    }

    typingTimeoutRef.current[currentUserEmail] = setTimeout(() => {
      console.log('Emitting stopTyping event:', { from: currentUserEmail, to: selectedUser.email });
      socketRef.current?.emit('stopTyping', {
        from: currentUserEmail,
        to: selectedUser.email,
        senderEmail: currentUserEmail,
      });
      setIsTyping(false);
    }, 1500);
  };

  // Socket event listeners for typing
  useEffect(() => {
    if (!socketRef.current) return;

    const handleTypingEvent = (data) => {
      const email = data.from || data.senderEmail;
      console.log('Received typing event:', { email, data });
      if (!email) {
        console.error('Typing event missing email field:', data);
        return;
      }
      setTypingUsers((prev) => ({ ...prev, [email]: true }));
      
      if (typingTimeoutRef.current[email]) {
        clearTimeout(typingTimeoutRef.current[email]);
      }
      
      typingTimeoutRef.current[email] = setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[email];
          return updated;
        });
      }, 5000); // Increased timeout to 5 seconds
    };

    const handleStopTypingEvent = (data) => {
      const email = data.from || data.senderEmail;
      console.log('Received stopTyping event:', { email, data });
      if (!email) {
        console.error('StopTyping event missing email field:', data);
        return;
      }
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[email];
        return updated;
      });
      
      if (typingTimeoutRef.current[email]) {
        clearTimeout(typingTimeoutRef.current[email]);
        delete typingTimeoutRef.current[email];
      }
    };

    socketRef.current.on('typing', handleTypingEvent);
    socketRef.current.on('stopTyping', handleStopTypingEvent);

    return () => {
      socketRef.current.off('typing', handleTypingEvent);
      socketRef.current.off('stopTyping', handleStopTypingEvent);
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  // Log all socket events for debugging
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.onAny((event, ...args) => {
      console.log(`Socket event: ${event}`, args);
    });
  }, []);

  // Initialize user data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token') || '';
      const storedEmail = localStorage.getItem('email') || 'user@example.com';
      const storedName = localStorage.getItem('username') || 'You';
      setToken(storedToken);
      setCurrentUserEmail(storedEmail);
      setCurrentUserName(storedName);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserName(res.data.name);
        setCurrentUserProfilePhoto(res.data.profilePhoto); // Cloudinary URL
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    };

    fetchUser();
  }, []);

  // Socket connection and event handlers
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
      const { _id, senderEmail, receiverEmail, content, timestamp, readBy, sender } = messageData;
      if (senderEmail === currentUserEmail) return;

      // Show toast notification for new incoming message
      toast.success(`${sender || 'Someone'}: ${content}`, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#333',
          color: '#fff',
        },
      });

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
              timestamp,
              readBy: readBy || [],
              isOwn: false,
            },
          ],
        };
      });
    });

    socketRef.current.on('messageRead', ({ messageId, readBy }) => {
      setMessages((prev) => {
        const updatedMessages = { ...prev };
        Object.keys(updatedMessages).forEach((key) => {
          updatedMessages[key] = updatedMessages[key].map((msg) =>
            msg._id === messageId ? { ...msg, readBy: readBy || [] } : msg
          );
        });
        return updatedMessages;
      });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, currentUserEmail, currentUserName]);

  // Fetch users
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

  // Fetch messages
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
          if (!msg.receiverEmail) return;
          const key = [msg.senderEmail, msg.receiverEmail].sort().join('-');
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            _id: msg._id || generateMessageId(),
            sender: msg.sender,
            senderEmail: msg.senderEmail,
            receiverEmail: msg.receiverEmail,
            content: msg.content,
            timestamp: msg.timestamp,
            readBy: msg.readBy || [],
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

  // Update last viewed timestamp
  useEffect(() => {
    if (selectedUser && messages[getChatKey(selectedUser.email)]) {
      const chatKey = getChatKey(selectedUser.email);
      const currentMessages = messages[chatKey] || [];
      if (currentMessages.length > 0) {
        const latestTimestamp = currentMessages[currentMessages.length - 1].timestamp;
        setLastViewedTimestamps((prev) => ({
          ...prev,
          [chatKey]: latestTimestamp,
        }));
      }

      const unreadMessages = currentMessages.filter(
        (msg) => !msg.isOwn && !msg.readBy.includes(currentUserEmail)
      );

      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages);
      }
    }
  }, [selectedUser, messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser, typingUsers]);

  const markMessagesAsRead = async (messagesToMark) => {
    try {
      const messageIds = messagesToMark.map((msg) => msg._id);
      console.log('Marking messages as read:', { messageIds, userEmail: currentUserEmail });
      const response = await fetch('http://localhost:5000/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageIds,
          userEmail: currentUserEmail,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark messages as read: ${errorText}`);
      }

      const result = await response.json();
      console.log('Mark as read success:', result);

      socketRef.current?.emit('markMessagesRead', {
        messageIds,
        userEmail: currentUserEmail,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const messageContent = newMessage.trim();
    const messageId = generateMessageId();

    const newMsg = {
      _id: messageId,
      sender: currentUserName,
      senderEmail: currentUserEmail,
      receiverEmail: selectedUser.email,
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      readBy: [],
      isOwn: true,
    };

    setNewMessage('');

    if (isTyping) {
      socketRef.current?.emit('stopTyping', {
        from: currentUserEmail,
        to: selectedUser.email,
        senderEmail: currentUserEmail,
      });
      setIsTyping(false);
    }

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
          room: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const savedMessage = await response.json();
      socketRef.current?.emit('sendMessage', {
        _id: savedMessage._id,
        sender: currentUserName,
        senderEmail: currentUserEmail,
        receiverEmail: selectedUser.email,
        content: messageContent,
        timestamp: savedMessage.timestamp,
        readBy: savedMessage.readBy || [],
        room: null,
      });

      setMessages((prev) => ({
        ...prev,
        [key]: (prev[key] || []).map((msg) =>
          msg._id === messageId ? { ...msg, _id: savedMessage._id, readBy: savedMessage.readBy || [] } : msg
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

  const getReadStatusIcon = (message) => {
    if (!message.isOwn) return null;
    const isRead = message.readBy && message.readBy.includes(selectedUser?.email);
    return isRead ? (
      <CheckCheck className="w-3 h-3 text-blue-400" />
    ) : (
      <Check className="w-3 h-3 text-gray-400" />
    );
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col pb-4 bg-[#f2f2f2]">
      <Toaster /> {/* Add Toaster component for toast notifications */}
      {/* NAVBAR */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#854C52] text-white shadow">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-wide">ChatApp</h1>
          <p className="text-xs text-gray-300">Private Messaging</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/profilepage">
            <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80">
              {currentUserProfilePhoto ? (
                <img
                  src={currentUserProfilePhoto}
                  alt="Profile"
                  className="w-6 h-6 rounded-full object-cover border"
                />
              ) : (
                <User className="w-5 h-5 text-gray-500" />
              )}
              <span className="text-sm">{currentUserName}</span>
            </div>
          </Link>
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
              window.location.href = '/login';
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
                    onClick={() => {
                      console.log('Selected user:', user);
                      setSelectedUser(user);
                    }}
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
                    <div className="flex items-center">
                      {typingUsers[user.email] && (
                        <div className="flex mr-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce mr-1" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce mr-1" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
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
                    onClick={() => {
                      console.log('Selected user:', user);
                      setSelectedUser(user);
                    }}
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
                {currentMessages.map((msg, i) => {
                  const chatKey = getChatKey(selectedUser.email);
                  const lastViewedTimestamp = lastViewedTimestamps[chatKey] || '00:00';
                  const msgTimestamp = msg.timestamp;
                  const isNewMessage = i > 0 && currentMessages[i - 1].timestamp <= lastViewedTimestamp && msgTimestamp > lastViewedTimestamp;
                  const isAfterNewMessage = msgTimestamp > lastViewedTimestamp;

                  return (
                    <React.Fragment key={msg._id || `${msg.senderEmail}-${msg.timestamp}-${i}`}>
                      {isNewMessage && (
                        <div className="relative my-2">
                          <hr className="border-t border-gray-300" />
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#FAFAFA] px-2 text-xs text-gray-500">
                            New Message
                          </span>
                        </div>
                      )}
                      <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`px-4 py-2 rounded-lg text-sm max-w-xs transition-all duration-300 ${
                            msg.isOwn
                              ? 'bg-[#A1887F] text-white'
                              : isAfterNewMessage
                              ? 'bg-gray-300 text-black animate-pulse'
                              : 'bg-gray-200 text-black'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <p className="text-[10px]">{msg.timestamp}</p>
                            {getReadStatusIcon(msg)}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                {selectedUser && typingUsers[selectedUser.email] && (
                  <div className="flex justify-start mb-2">
                    <div className="px-4 py-2 rounded-lg bg-gray-200 text-black text-sm">
                      <div className="flex items-center">
                        <span className="mr-2">✏️</span>
                        <span>{selectedUser.name} is typing</span>
                        <div className="ml-2 flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef}></div>
              </div>
              <div className="flex items-center p-4 border-t border-gray-200 bg-white">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring focus:border-blue-300"
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