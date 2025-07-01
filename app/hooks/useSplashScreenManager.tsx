'use client';

import { useState, useEffect, useCallback } from 'react';

import { useSafeStorage } from './useSafeStorage';

// EventEmitter simple pour la gestion des événements SplashScreen
class SplashScreenEventEmitter {
    private listeners: Set<() => void> = new Set();

    subscribe(callback: () => void) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    emit() {
        this.listeners.forEach((callback) => {
            try {
                callback();
            } catch (error) {
                console.warn('Erreur dans le callback SplashScreen:', error);
            }
        });
    }
}

// Instance globale de l'EventEmitter
const splashScreenEmitter = new SplashScreenEventEmitter();

export const useSplashScreenManager = () => {
    const [splashScreenState, setSplashScreenState, removeSplashScreenState] = useSafeStorage(
        'splashScreenComplete',
        { fallback: '' },
    );
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);

    // Méthode pour marquer le SplashScreen comme en attente
    const setSplashScreenWaiting = useCallback(() => {
        setSplashScreenState('waiting');
    }, [setSplashScreenState]);

    // Méthode pour marquer le SplashScreen comme terminé
    const setSplashScreenComplete = useCallback(() => {
        setSplashScreenState('true');
        // Activer immédiatement les animations sans attendre l'événement
        setShouldStartAnimations(true);
        splashScreenEmitter.emit();
    }, [setSplashScreenState]);

    // Méthode pour nettoyer l'état du SplashScreen
    const clearSplashScreenState = useCallback(() => {
        removeSplashScreenState();
    }, [removeSplashScreenState]);

    // Logique simplifiée pour iOS
    useEffect(() => {
        // Si on n'est pas en attente et qu'on n'a pas d'état, activer directement
        if (
            splashScreenState !== 'waiting' &&
            splashScreenState !== 'true' &&
            splashScreenState !== ''
        ) {
            const timer = setTimeout(() => {
                setShouldStartAnimations(true);
            }, 100);

            return () => clearTimeout(timer);
        }

        // Si le splash screen est marqué comme terminé, activer les animations
        if (splashScreenState === 'true') {
            setShouldStartAnimations(true);
            // Nettoyer après un délai pour éviter les conflits
            const cleanupTimer = setTimeout(() => {
                clearSplashScreenState();
            }, 500);

            return () => clearTimeout(cleanupTimer);
        }
    }, [splashScreenState, clearSplashScreenState]);

    return {
        splashScreenState,
        shouldStartAnimations,
        setSplashScreenWaiting,
        setSplashScreenComplete,
        clearSplashScreenState,
    };
};

// Hook spécialisé pour les pages qui ont besoin de vérifier le statut du SplashScreen
export const usePageAnimations = () => {
    const { shouldStartAnimations } = useSplashScreenManager();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simuler un chargement avec timeout sécurisé
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    return {
        shouldStartAnimations,
        isLoading,
    };
};
