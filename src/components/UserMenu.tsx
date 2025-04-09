'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function UserMenu() {
  const { currentUser, login, logout } = useAuth();

  return (
    <div className="flex items-center">
      {currentUser ? (
        <div className="flex items-center space-x-3">
          <Link href="/history" className="text-sm text-gray-600 hover:text-blue-600">
            My History
          </Link>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Sign Out
          </button>
          {currentUser.photoURL && (
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={login}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          Sign In
        </button>
      )}
    </div>
  );
} 