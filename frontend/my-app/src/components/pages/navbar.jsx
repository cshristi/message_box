// components/Navbar.js
'use client';
import React from 'react';
import { User, Settings, LogOut } from 'lucide-react';

const Navbar = ({ currentUserName, socketRef }) => {
  return (
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
            window.location.href = '/login';
          }}
        />
      </div>
    </div>
  );
};

export default Navbar;
