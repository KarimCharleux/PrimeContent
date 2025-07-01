'use client';

import { useState, useEffect, useCallback } from 'react';

interface SafeStorageOptions {
    fallback?: string;
    prefix?: string;
}

export const useSafeStorage = (key: string, options: SafeStorageOptions = {}) => {
    const { fallback = '', prefix = '' } = options;
    const storageKey = prefix ? `${prefix}_${key}` : key;

    const [value, setValue] = useState<string>(() => {
        if (typeof window === 'undefined') return fallback;

        try {
            // Test si localStorage est disponible sur iOS
            const testKey = '__localStorage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);

            return localStorage.getItem(storageKey) || fallback;
        } catch (error) {
            console.warn('localStorage non disponible, utilisation du fallback:', error);
            return fallback;
        }
    });

    const setSafeValue = useCallback(
        (newValue: string) => {
            setValue(newValue);

            if (typeof window === 'undefined') return;

            try {
                localStorage.setItem(storageKey, newValue);
            } catch (error) {
                console.warn('Impossible de sauvegarder dans localStorage:', error);
                // Sur iOS, on peut utiliser sessionStorage en fallback
                try {
                    sessionStorage.setItem(storageKey, newValue);
                } catch (sessionError) {
                    console.warn('sessionStorage également indisponible:', sessionError);
                }
            }
        },
        [storageKey],
    );

    const removeSafeValue = useCallback(() => {
        setValue(fallback);

        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(storageKey);
            sessionStorage.removeItem(storageKey); // Nettoyer aussi sessionStorage
        } catch (error) {
            console.warn('Impossible de supprimer de localStorage:', error);
        }
    }, [storageKey, fallback]);

    return [value, setSafeValue, removeSafeValue] as const;
};

// Hook pour détecter iOS Safari
export const useIOSDetection = () => {
    const [isIOS, setIsIOS] = useState(false);
    const [isSafari, setIsSafari] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const userAgent = window.navigator.userAgent;
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
        const isSafariUser = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

        setIsIOS(isIOSDevice);
        setIsSafari(isSafariUser);
    }, []);

    return { isIOS, isSafari };
};

// Hook pour gérer les event listeners de manière sécurisée
export const useSafeEventListener = (
    event: string,
    handler: EventListener,
    element: EventTarget | null = null,
    options?: boolean | AddEventListenerOptions,
) => {
    useEffect(() => {
        const targetElement = element || (typeof window !== 'undefined' ? window : null);

        if (!targetElement) return;

        try {
            targetElement.addEventListener(event, handler, options);

            return () => {
                try {
                    targetElement.removeEventListener(event, handler, options);
                } catch (error) {
                    console.warn("Erreur lors de la suppression de l'event listener:", error);
                }
            };
        } catch (error) {
            console.warn("Erreur lors de l'ajout de l'event listener:", error);
        }
    }, [event, handler, element, options]);
};
