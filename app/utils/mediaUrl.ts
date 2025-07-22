export function getMediaUrl(path: string | null | undefined): string {
    // Vérification défensive pour les valeurs nulles/undefined
    if (!path || typeof path !== 'string') {
        return 'https://media.dalifilms.fr/placeholder-image.png'; // Image de placeholder par défaut
    }

    // Si c'est un blob ou une URL complète (http/https), la retourner directement
    if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const baseUrl = 'https://media.dalifilms.fr';

    // Assurez-vous que le chemin commence par '/'
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
}

/**
 * Obtenir l'URL d'une image avec watermark pour les pages publiques
 * @param path Chemin vers l'image
 * @param options Options de watermark
 * @returns URL vers l'image avec ou sans watermark selon le contexte
 */
interface WatermarkOptions {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    quality?: number;
    forceWatermark?: boolean;
    skipWatermark?: boolean;
}

export function getProtectedMediaUrl(
    path: string | null | undefined,
    options: WatermarkOptions = {},
): string {
    // Vérification défensive
    if (!path || typeof path !== 'string') {
        return 'https://media.dalifilms.fr/placeholder-image.png';
    }

    // Si c'est un blob, le retourner directement
    if (path.startsWith('blob:')) {
        return path;
    }

    // Extraire le chemin relatif si c'est une URL complète de media.dalifilms.fr
    let cleanPath = path;
    if (path.startsWith('https://media.dalifilms.fr/')) {
        cleanPath = path.replace('https://media.dalifilms.fr/', '');
    } else if (path.startsWith('http://') || path.startsWith('https://')) {
        // Si c'est une autre URL complète (non media.dalifilms.fr), la retourner directement
        return path;
    } else {
        // Nettoyer le chemin relatif
        cleanPath = path.startsWith('/') ? path.slice(1) : path;
    }

    // Déterminer si on est côté client et sur quelle page
    const isClient = typeof window !== 'undefined';
    const isAdminPage = isClient ? window.location.pathname.startsWith('/backoffice') : false;
    const isDevelopment =
        process.env.NODE_ENV === 'development' ||
        (isClient && window.location.hostname === 'localhost');

    // Si on force le skip du watermark, qu'on est sur une page admin, ou en développement
    if (options.skipWatermark || (!options.forceWatermark && isAdminPage) || isDevelopment) {
        return getMediaUrl(cleanPath);
    }

    // Vérifier si c'est une image (éviter le watermark sur les vidéos)
    const ext = cleanPath.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];

    if (!ext || !imageExtensions.includes(ext)) {
        // Ce n'est pas une image, retourner l'URL normale
        return getMediaUrl(cleanPath);
    }

    // Construire l'URL de l'API watermark
    const params = new URLSearchParams({
        path: cleanPath,
        position: options.position || 'bottom-right',
        quality: (options.quality || 90).toString(),
    });

    // En développement, utiliser localhost
    const apiBase =
        isClient && window.location.hostname === 'localhost'
            ? `${window.location.protocol}//${window.location.host}`
            : 'https://dalifilms.fr';

    const watermarkUrl = `${apiBase}/api/watermark?${params.toString()}`;
    return watermarkUrl;
}

/**
 * Version automatique qui détermine s'il faut un watermark selon le contexte
 */
export function getSmartMediaUrl(
    path: string | null | undefined,
    watermarkOptions?: Omit<WatermarkOptions, 'forceWatermark'>,
): string {
    return getProtectedMediaUrl(path, watermarkOptions);
}

/**
 * Force le watermark sur toutes les images media.dalifilms.fr sur les pages publiques
 * @param path Chemin vers l'image ou URL complète
 * @param options Options de watermark
 * @returns URL avec watermark forcé si c'est une image et page publique
 */
export function getAutoWatermarkUrl(
    path: string | null | undefined,
    options: Omit<WatermarkOptions, 'forceWatermark'> = {},
): string {
    // Vérification défensive
    if (!path || typeof path !== 'string') {
        return 'https://media.dalifilms.fr/placeholder-image.png';
    }

    // Si c'est une URL media.dalifilms.fr ou un chemin relatif, forcer le watermark
    if (
        path.startsWith('https://media.dalifilms.fr/') ||
        (!path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('blob:'))
    ) {
        return getProtectedMediaUrl(path, {
            ...options,
            forceWatermark: false, // Laisser la détection automatique admin/public
        });
    }

    // Pour les autres URLs, retourner directement
    return path;
}
