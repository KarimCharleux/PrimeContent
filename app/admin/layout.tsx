'use client';

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './hooks/useAuth';

const inter = Inter({ subsets: ['latin'] });

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/admin/login') || pathname?.includes('/admin/forgot-password');

  return (
    <div className={`${inter.className}`}>
      <AuthProvider>
        {isLoginPage ? (
          <div className="bg-gray-50 min-h-screen">
            {children}
          </div>
        ) : (
          <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {children}
              </main>
            </div>
          </div>
        )}
      </AuthProvider>
    </div>
  );
} 