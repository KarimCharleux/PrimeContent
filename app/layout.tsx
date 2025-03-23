'use client';

import { Sora, Manrope } from 'next/font/google';
import { usePathname } from 'next/navigation';
import './globals.css';
import { useState, useEffect } from 'react';

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
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith('/admin');
    
    // Si nous sommes sur une page admin, désactiver immédiatement le chargement
    useEffect(() => {
        if (isAdminPage) {
            setIsLoading(false);
        }
    }, [isAdminPage]);

    return (
        <html lang="fr" suppressHydrationWarning={true} className={`${sora.variable} ${manrope.variable}`}>
            <body className={sora.className}>
                {!isAdminPage && (
                    <SplashScreen onLoadingComplete={() => setIsLoading(false)} />
                )}
                <div style={{ opacity: isLoading && !isAdminPage ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}>
                    {children}
                </div>
            </body>
        </html>
    );
}
