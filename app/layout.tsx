'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { useState } from 'react';
import SplashScreen from './components/SplashScreen';

const inter = Inter({ subsets: ['latin'] });


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <html lang="en" data-oid="b5x4lok" suppressHydrationWarning={true}>
            <body className={inter.className} data-oid="sgp8axh">
                <SplashScreen onLoadingComplete={() => setIsLoading(false)} />
                <div style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}>
                    {children}
                </div>
            </body>
        </html>
    );
}
