/**
 * Utilitaires pour gérer la compatibilité iOS Safari
 */

// Détecter iOS
export const isIOS = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
};

// Détecter iOS Safari spécifiquement
export const isIOSSafari = (): boolean => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent;
    return (
        /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
    );
};

// Vérifier si localStorage est disponible
export const isLocalStorageAvailable = (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
        const testKey = '__localStorage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
};

// Wrapper sécurisé pour localStorage
export const safeLocalStorage = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },

    setItem: (key: string, value: string): boolean => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch {
            // Fallback vers sessionStorage sur iOS
            try {
                sessionStorage.setItem(key, value);
                return true;
            } catch {
                return false;
            }
        }
    },

    removeItem: (key: string): boolean => {
        try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key); // Nettoyer aussi sessionStorage
            return true;
        } catch {
            return false;
        }
    },
};

// Wrapper sécurisé pour window.scrollTo sur iOS
export const safeScrollTo = (x: number, y: number): void => {
    if (typeof window === 'undefined') return;

    try {
        window.scrollTo(x, y);
    } catch (error) {
        // Fallback pour iOS qui peut avoir des problèmes avec scrollTo
        try {
            window.scrollTo({ top: y, left: x, behavior: 'auto' });
        } catch {
            // Dernier fallback
            document.documentElement.scrollTop = y;
            document.documentElement.scrollLeft = x;
        }
    }
};

// Limiter le nombre d'images préchargées sur iOS pour éviter les erreurs de mémoire
export const getMaxPreloadImages = (): number => {
    return isIOS() ? 10 : 50;
};

// Délais optimisés pour iOS
export const getOptimizedDelay = (defaultDelay: number): number => {
    return isIOS() ? Math.min(defaultDelay * 0.8, 1000) : defaultDelay;
};
