'use client';

import { useState, useEffect } from 'react';

export const useAnimationControl = () => {
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        // Vérifier si l'animation a déjà été activée dans cette session
        const animationActivated = sessionStorage.getItem('headerAnimationActivated');

        if (animationActivated === 'true') {
            // Si l'animation a déjà été activée dans cette session, l'activer immédiatement
            setShouldAnimate(true);
            return;
        }

        // Vérifier si nous sommes sur la page d'accueil
        const isHomePage = typeof window !== 'undefined' && window.location.pathname === '/';

        // Si nous ne sommes pas sur la page d'accueil, animer immédiatement
        if (!isHomePage) {
            setShouldAnimate(true);
            // Mémoriser que l'animation a été activée
            sessionStorage.setItem('headerAnimationActivated', 'true');
            return;
        }

        // Sur la page d'accueil, vérifier le statut du splash screen
        const checkSplashScreen = () => {
            const splashScreenComplete = localStorage.getItem('splashScreenComplete');
            if (splashScreenComplete === 'true') {
                setShouldAnimate(true);
                // Mémoriser que l'animation a été activée
                sessionStorage.setItem('headerAnimationActivated', 'true');
            }
        };

        // Vérifie immédiatement au montage du composant
        checkSplashScreen();

        // Continue de vérifier périodiquement
        const interval = setInterval(checkSplashScreen, 100);

        return () => clearInterval(interval);
    }, []);

    return shouldAnimate;
};
