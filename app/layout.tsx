'use client';

import { Sora, Manrope } from 'next/font/google';
import './globals.css';
import { useState } from 'react';

import SplashScreen from './components/SplashScreen';

// Configuration de la police Sora pour tout le site
const sora = Sora({ 
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-sora',
});

// Configuration de la police Manrope pour le titre "Primecontent"
export const manrope = Manrope({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-manrope',
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <html lang="fr" suppressHydrationWarning={true} className={`${sora.variable} ${manrope.variable}`}>
            <body className={sora.className}>
                <SplashScreen onLoadingComplete={() => setIsLoading(false)} />
                <div style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}>
                    {children}
                </div>
            </body>
        </html>
    );
}
