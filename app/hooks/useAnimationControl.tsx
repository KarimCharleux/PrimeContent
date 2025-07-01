'use client';

import { useState, useEffect } from 'react';

import { useSafeStorage } from './useSafeStorage';
import { useSplashScreenManager } from './useSplashScreenManager';

export const useAnimationControl = () => {
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        // Vérifier si nous sommes sur la page d'accueil
        const isHomePage = typeof window !== 'undefined' && window.location.pathname === '/';

        if (!isHomePage) {
            // Pas sur la page d'accueil, animer immédiatement
            setShouldAnimate(true);
        } else {
            // Sur la page d'accueil, synchroniser avec les animations de la page
            const timer = setTimeout(() => {
                setShouldAnimate(true);
            }, 100); // Délai court pour que le Header s'anime avec les autres éléments

            return () => clearTimeout(timer);
        }
    }, []);

    return shouldAnimate;
};
