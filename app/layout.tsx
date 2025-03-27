'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import './styles/fonts.css';
import { useState, useEffect } from 'react';

import SplashScreen from './components/SplashScreen';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith('/backoffice');
    
    // Si nous sommes sur une page admin, désactiver immédiatement le chargement
    useEffect(() => {
        if (isAdminPage) {
            setIsLoading(false);
        }
    }, [isAdminPage]);

    return (
        <html lang="fr" suppressHydrationWarning={true} className="font-sora">
            <body className="font-sora">
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
