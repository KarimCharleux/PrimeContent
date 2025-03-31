'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useState, useEffect } from 'react';
import TagManager from 'react-gtm-module';
import './globals.css';
import './styles/fonts.css';

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

    // Initialisation de Google Tag Manager
    useEffect(() => {
        TagManager.initialize({
            gtmId: 'GTM-55WMPSG8'
        });
    }, []);

    return (
        <html lang="fr" suppressHydrationWarning={true} className="font-sora">
            <head>
                {/* Google Analytics */}
                <Script async src="https://www.googletagmanager.com/gtag/js?id=G-N9S47LLDZZ" />
                <Script id="google-analytics">
                    {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-N9S47LLDZZ');
                    `}
                </Script>
            </head>
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
