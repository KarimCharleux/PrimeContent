'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

import AuthGuard from './components/AuthGuard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './hooks/useAuth';

interface AdminLayoutProps {
    readonly children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const isLoginPage =
        pathname?.includes('/backoffice/login') ||
        pathname?.includes('/backoffice/forgot-password');

    return (
        <div className="font-sora">
            <AuthProvider>
                <AuthGuard>
                    {isLoginPage ? (
                        <div className="bg-gray-50 min-h-screen">{children}</div>
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
                </AuthGuard>
            </AuthProvider>
        </div>
    );
}
