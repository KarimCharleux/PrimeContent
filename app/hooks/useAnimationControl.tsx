'use client';

import { useState, useEffect } from 'react';

export const useAnimationControl = () => {
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        const checkSplashScreen = () => {
            const splashScreenComplete = localStorage.getItem('splashScreenComplete');
            if (splashScreenComplete === 'true') {
                setShouldAnimate(true);
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