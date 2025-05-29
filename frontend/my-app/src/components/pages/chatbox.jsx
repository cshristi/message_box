// components/MessageBox.js
'use client';
import React from 'react';
import { Send, X, Check, CheckCheck } from 'lucide-react';

const MessageBox = ({
  selectedUser,
  currentMessages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyPress,
  messagesEndRef,
  getReadStatusIcon,
  setSelectedUser,
}) => {
  return (
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
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className="text-[10px]">{msg.timestamp}</p>
                    {getReadStatusIcon(msg)}
                  </div>
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
  );
};

export default MessageBox;
