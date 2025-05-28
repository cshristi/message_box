'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Users, Settings, LogOut, X } from 'lucide-react';

const ChatApp = () => {
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('You');
  const [token, setToken] = useState('');
  const messagesEndRef = useRef(null);

  // Read from localStorage only on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUserEmail(localStorage.getItem('email') || '');
      setCurrentUserName(localStorage.getItem('username') || 'You');
      setToken(localStorage.getItem('token') || '');
    }
  }, []);

  useEffect(() => {
    if (!token || !currentUserEmail) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const otherUsers = data.filter((user) => user.email !== currentUserEmail);
        setAllUsers(otherUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [token, currentUserEmail]);

  useEffect(() => {
    if (!currentUserEmail) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/messages');
        const data = await res.json();
        const grouped = {};

        data.forEach((msg) => {
          const key = [msg.senderEmail, msg.receiverEmail].sort().join('-');
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            ...msg,
            isOwn: msg.senderEmail === currentUserEmail,
          });
        });

        setMessages(grouped);
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    };
    fetchMessages();
  }, [currentUserEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const newMsg = {
      sender: currentUserName,
      senderEmail: currentUserEmail,
      receiverEmail: selectedUser.email,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    const key = [currentUserEmail, selectedUser.email].sort().join('-');
    setMessages((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newMsg],
    }));

    try {
      await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: currentUserName,
          senderEmail: currentUserEmail,
          receiverEmail: selectedUser.email,
          content: newMessage,
        }),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setNewMessage('');
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
              localStorage.clear();
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
              USERS ({onlineUsers.length + offlineUsers.length})
            </h3>

            {/* Online Users */}
            {onlineUsers.length > 0 && (
              <>
                <p className="text-xs text-green-700 mb-1">🟢 Online</p>
                {onlineUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer mb-1 gap-2 ${
                      selectedUser?.email === user.email
                        ? 'bg-[#A1887F] text-white'
                        : 'hover:bg-gray-100'
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

            {/* Offline Users */}
            {offlineUsers.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mt-4 mb-1">⚪ Offline</p>
                {offlineUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer mb-1 gap-2 ${
                      selectedUser?.email === user.email
                        ? 'bg-[#A1887F] text-white'
                        : 'hover:bg-gray-100'
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
              {/* Chat Header */}
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

              {/* Messages */}
              <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                {currentMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`p-2 rounded-lg max-w-xs ${
                        msg.isOwn ? 'bg-[#4E342E] text-white' : 'bg-[#E0E0E0] text-gray-800'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1">
                        {msg.isOwn ? currentUserName : selectedUser?.name}
                      </p>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-1 text-right">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef}></div>
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="flex p-4 pr-6 border-t text-black bg-white rounded-b-lg"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg mr-2"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-[#4E342E] text-white p-2 px-4 rounded-lg hover:bg-[#3E2723] flex items-center"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
              Select a user to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
