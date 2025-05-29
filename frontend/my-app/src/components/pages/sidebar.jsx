'use client';
import React from 'react';
import { Users } from 'lucide-react';

const Sidebar = ({ allUsers = [], selectedUser, setSelectedUser }) => {
  const onlineUsers = allUsers.filter((user) => user.isOnline);
  const offlineUsers = allUsers.filter((user) => !user.isOnline);

  return (
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
  );
};

export default Sidebar;
