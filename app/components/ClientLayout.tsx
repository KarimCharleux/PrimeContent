'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useIOSDetection } from '../hooks/useSafeStorage';

import SimpleSplashScreen from './SimpleSplashScreen';
import SplashScreen from './SplashScreen';

interface ClientLayoutProps {
    children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
    const pathname = usePathname();
    const [showSplashScreen, setShowSplashScreen] = useState(false);
    const [splashComplete, setSplashComplete] = useState(false);
    const { isIOS } = useIOSDetection();

    // Déterminer si on doit afficher le SplashScreen
    useEffect(() => {
        const isAdminPage = pathname?.startsWith('/backoffice');
        const isHomePage = pathname === '/';

        // Afficher le SplashScreen seulement sur la page d'accueil et pas en mode admin
        if (isHomePage && !isAdminPage) {
            // Sur iOS, on simplifie encore plus
            if (isIOS) {
                const timer = setTimeout(() => {
                    setSplashComplete(true);
                }, 2000); // Délai fixe sur iOS

                setShowSplashScreen(true);
                return () => clearTimeout(timer);
            } else {
                setShowSplashScreen(true);
            }
        } else {
            setSplashComplete(true);
        }
    }, [pathname, isIOS]);

    const handleSplashComplete = () => {
        setSplashComplete(true);
        setShowSplashScreen(false);
    };

    // Google Analytics (seulement si pas en mode admin)
    const isAdminPage = pathname?.startsWith('/backoffice');

    useEffect(() => {
        if (isAdminPage) return;

        // Google Analytics setup
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-XYZ123456';
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XYZ123456');
        `;
        document.head.appendChild(script2);

        return () => {
            document.head.removeChild(script1);
            document.head.removeChild(script2);
        };
    }, [isAdminPage]);

    // Afficher le contenu approprié
    if (showSplashScreen && !splashComplete) {
        // Utiliser le SplashScreen simplifié sur iOS
        if (isIOS) {
            return <SimpleSplashScreen onLoadingComplete={handleSplashComplete} />;
        }
        return <SplashScreen onLoadingComplete={handleSplashComplete} />;
    }

    return <>{children}</>;
}
