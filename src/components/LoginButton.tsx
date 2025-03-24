'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

const LoginButton: React.FC = () => {
  const { currentUser, login, logout, loading } = useAuth();

  const handleAuth = async () => {
    if (currentUser) {
      await logout();
    } else {
      await login();
    }
  };

  if (loading) {
    return (
      <button 
        className="px-4 py-2 bg-gray-200 text-gray-400 rounded-md cursor-not-allowed"
        disabled
      >
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={handleAuth}
      className={`px-4 py-2 rounded-md transition-colors ${
        currentUser 
          ? 'bg-red-600 text-white hover:bg-red-700' 
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {currentUser ? 'Sign Out' : 'Sign In with Google'}
    </button>
  );
};

export default LoginButton; 