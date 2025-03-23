'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, userProfile } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white shadow">
      <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Backoffice - Admin
          </h1>
        </div>
        
        <div className="flex items-center">
          {/* Notification Icon */}
          <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </button>
          
          {/* Divider */}
          <div className="border-l border-gray-200 h-6 mx-3"></div>
          
          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 rounded-full focus:outline-none"
            >
              <span className="text-sm font-medium text-gray-700">
                {userProfile?.displayName || user?.email || 'Utilisateur'}
              </span>
              <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                {userProfile?.photoURL ? (
                  <img 
                    src={userProfile.photoURL} 
                    alt={userProfile.displayName || 'User avatar'} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm text-gray-700 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userProfile?.role && `Rôle: ${userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}`}
                  </p>
                </div>
                <Link 
                  href="/admin/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profil
                </Link>
                <Link 
                  href="/admin/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Paramètres
                </Link>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Naviguer vers le frontend
                    window.open('/', '_blank');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Voir le site
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 