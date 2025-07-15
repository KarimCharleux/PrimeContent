/**
 * Utilitaires pour la gestion des vidéos Dailymotion
 */

// Types pour les vidéos Dailymotion
export interface DailymotionVideo {
    id: string;
    url: string;
    thumbnail?: string;
    title?: string;
    duration?: string;
}

/**
 * Extrait l'ID Dailymotion depuis une URL
 */
export function extractDailymotionId(url: string): string | null {
    if (!url) return null;

    // Différents formats d'URL Dailymotion supportés
    const patterns = [
        /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/,
        /dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/,
        /dailymotion\.com\/hub\/[^\/]+#video=([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // Si c'est déjà un ID (7 caractères alphanumériques)
    if (/^[a-zA-Z0-9]{7}$/.test(url.trim())) {
        return url.trim();
    }

    return null;
}

/**
 * Génère l'URL d'embed Dailymotion
 */
export function getDailymotionEmbedUrl(
    videoId: string,
    options: {
        autoplay?: boolean;
        mute?: boolean;
        controls?: boolean;
        sharing?: boolean;
        logo?: boolean;
        quality?: 'auto' | '240' | '380' | '480' | '720' | '1080';
        start?: number;
    } = {},
): string {
    const {
        autoplay = false,
        mute = false,
        controls = true,
        sharing = false,
        logo = false,
        quality = 'auto',
        start,
    } = options;

    const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        mute: mute ? '1' : '0',
        controls: controls ? '1' : '0',
        'sharing-enable': sharing ? '1' : '0',
        'ui-logo': logo ? '1' : '0',
        quality: quality,
        ...(start && { start: start.toString() }),
    });

    return `https://www.dailymotion.com/embed/video/${videoId}?${params.toString()}`;
}

/**
 * Génère l'URL de la miniature Dailymotion
 * Note: Pour obtenir la vraie miniature, utilisez getDailymotionMetadata()
 */
export function getDailymotionThumbnail(
    videoId: string,
    size: 'small' | 'medium' | 'large' = 'large',
): string {
    // Format de fallback - peut ne pas toujours fonctionner
    // Il est recommandé d'utiliser getDailymotionMetadata() pour obtenir la vraie URL de miniature
    const sizeMap = {
        small: 'x120',
        medium: 'x240',
        large: 'x480',
    };

    return `https://s2.dmcdn.net/v/${videoId}/${sizeMap[size]}.jpg`;
}

/**
 * Génère l'URL de la miniature Dailymotion de manière plus fiable
 * en utilisant l'API oEmbed (async)
 */
export async function getDailymotionThumbnailFromAPI(
    videoId: string,
    size: 'small' | 'medium' | 'large' = 'large',
): Promise<string | null> {
    try {
        const metadata = await getDailymotionMetadata(videoId);
        if (metadata && metadata.thumbnail_url) {
            // Adapter la taille si nécessaire
            let thumbnailUrl = metadata.thumbnail_url;

            // Remplacer la taille dans l'URL si possible
            if (size === 'large') {
                thumbnailUrl = thumbnailUrl.replace('/x240', '/x480');
            } else if (size === 'small') {
                thumbnailUrl = thumbnailUrl.replace('/x240', '/x120');
            }

            return thumbnailUrl;
        }
        return null;
    } catch (error) {
        console.error('Erreur lors de la récupération de la miniature Dailymotion:', error);
        return null;
    }
}

/**
 * Valide si une URL Dailymotion est valide
 */
export function isValidDailymotionUrl(url: string): boolean {
    return extractDailymotionId(url) !== null;
}

/**
 * Génère l'URL de visionnage Dailymotion normale
 */
export function getDailymotionWatchUrl(videoId: string): string {
    return `https://www.dailymotion.com/video/${videoId}`;
}

/**
 * Vérifie si un media est une vidéo Dailymotion
 */
export function isDailymotionVideo(source: string): boolean {
    return (
        source.includes('dailymotion.com') ||
        source.includes('dai.ly') ||
        extractDailymotionId(source) !== null
    );
}

/**
 * Récupère les métadonnées d'une vidéo Dailymotion via notre API interne (contourne CORS)
 */
export async function getDailymotionMetadata(videoId: string): Promise<{
    title?: string;
    thumbnail_url?: string;
    author_name?: string;
    provider_name?: string;
    width?: number;
    height?: number;
    format?: 'portrait' | 'paysage';
} | null> {
    try {
        const videoUrl = `https://www.dailymotion.com/video/${videoId}`;
        const response = await fetch(
            `/api/video-metadata?url=${encodeURIComponent(videoUrl)}&provider=dailymotion`,
        );

        if (!response.ok) {
            throw new Error('Vidéo non trouvée');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Erreur lors de la récupération des métadonnées');
        }

        // Adapter la réponse au format attendu
        return {
            title: data.metadata.title,
            thumbnail_url: data.metadata.thumbnail,
            author_name: data.metadata.author,
            provider_name: 'Dailymotion',
            width: data.metadata.width,
            height: data.metadata.height,
            format: data.metadata.format,
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des métadonnées Dailymotion:', error);
        return null;
    }
}

/**
 * Formate une URL Dailymotion pour l'affichage
 */
export function formatDailymotionSource(input: string): {
    dailymotionId: string;
    embedUrl: string;
    thumbnailUrl: string;
    watchUrl: string;
} | null {
    const dailymotionId = extractDailymotionId(input);

    if (!dailymotionId) return null;

    return {
        dailymotionId,
        embedUrl: getDailymotionEmbedUrl(dailymotionId),
        thumbnailUrl: getDailymotionThumbnail(dailymotionId),
        watchUrl: getDailymotionWatchUrl(dailymotionId),
    };
}
