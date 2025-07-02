/**
 * Utilitaires de détection d'appareils et navigateurs
 * Optimisations spécifiques pour iOS Safari
 */

// Détection iOS Safari pour optimisations spécifiques
export const isIOSSafari = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    return iOS && webkit && !/(CriOS|FxiOS|OPiOS|mercury)/.test(ua);
};

// Détection iOS générale (tous navigateurs)
export const isIOS = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
};

// Détection mobile générale
export const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent,
    );
};

// Obtenir les limites optimisées selon l'appareil
export const getOptimizedLimits = () => {
    const isIOSDevice = isIOSSafari();

    return {
        // Limites pour le préchargement d'images
        maxImages: isIOSDevice ? 15 : 50,
        maxConcurrentRequests: isIOSDevice ? 3 : 6,
        timeoutDuration: isIOSDevice ? 8000 : 10000,

        // Délais pour les animations
        animationDelay: isIOSDevice ? 800 : 1500,

        // Intervalles pour les vérifications
        checkInterval: isIOSDevice ? 200 : 100,

        // Timeouts de sécurité
        safetyTimeout: 12000,
    };
};

// Log avec préfixe device-specific
export const deviceLog = (message: string, ...args: any[]) => {
    const device = isIOSSafari() ? '📱 iOS' : isMobile() ? '📱 Mobile' : '💻 Desktop';
    console.log(`${device} - ${message}`, ...args);
};

// Nettoyage mémoire pour iOS
export const cleanupImages = (images: HTMLImageElement[]) => {
    if (isIOSSafari()) {
        images.forEach((img) => {
            if (img && img.src) {
                img.src = '';
            }
        });
    }
};
