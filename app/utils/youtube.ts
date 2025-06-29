/**
 * Utilitaires pour la gestion des vidéos YouTube
 */

// Types pour les vidéos YouTube
export interface YouTubeVideo {
    id: string;
    url: string;
    thumbnail?: string;
    title?: string;
    duration?: string;
}

/**
 * Extrait l'ID YouTube depuis une URL
 */
export function extractYouTubeId(url: string): string | null {
    if (!url) return null;

    // Différents formats d'URL YouTube supportés
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // Si c'est déjà un ID (11 caractères)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
        return url.trim();
    }

    return null;
}

/**
 * Génère l'URL d'embed YouTube sans branding
 */
export function getYouTubeEmbedUrl(
    videoId: string,
    options: {
        autoplay?: boolean;
        controls?: boolean;
        modestBranding?: boolean;
        rel?: boolean;
        showInfo?: boolean;
        start?: number;
        end?: number;
    } = {},
): string {
    const {
        autoplay = false,
        controls = true,
        modestBranding = true,
        rel = false,
        showInfo = false,
        start,
        end,
    } = options;

    const params = new URLSearchParams({
        modestbranding: modestBranding ? '1' : '0',
        rel: rel ? '1' : '0',
        showinfo: showInfo ? '1' : '0',
        controls: controls ? '1' : '0',
        autoplay: autoplay ? '1' : '0',
        ...(start && { start: start.toString() }),
        ...(end && { end: end.toString() }),
    });

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Génère l'URL de la miniature YouTube
 */
export function getYouTubeThumbnail(
    videoId: string,
    quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'maxres',
): string {
    const qualityMap = {
        default: 'default',
        medium: 'mqdefault',
        high: 'hqdefault',
        standard: 'sddefault',
        maxres: 'maxresdefault',
    };

    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Valide si une URL YouTube est valide
 */
export function isValidYouTubeUrl(url: string): boolean {
    return extractYouTubeId(url) !== null;
}

/**
 * Génère l'URL de visionnage YouTube normale
 */
export function getYouTubeWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Vérifie si un media est une vidéo YouTube
 */
export function isYouTubeVideo(source: string): boolean {
    return (
        source.includes('youtube.com') ||
        source.includes('youtu.be') ||
        extractYouTubeId(source) !== null
    );
}

/**
 * Récupère les métadonnées d'une vidéo YouTube via l'API oEmbed
 */
export async function getYouTubeMetadata(videoId: string): Promise<{
    title?: string;
    thumbnail_url?: string;
    author_name?: string;
    provider_name?: string;
} | null> {
    try {
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        );

        if (!response.ok) {
            throw new Error('Vidéo non trouvée');
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des métadonnées YouTube:', error);
        return null;
    }
}

/**
 * Formate une URL YouTube pour l'affichage
 */
export function formatYouTubeSource(input: string): {
    youtubeId: string;
    embedUrl: string;
    thumbnailUrl: string;
    watchUrl: string;
} | null {
    const youtubeId = extractYouTubeId(input);

    if (!youtubeId) return null;

    return {
        youtubeId,
        embedUrl: getYouTubeEmbedUrl(youtubeId),
        thumbnailUrl: getYouTubeThumbnail(youtubeId),
        watchUrl: getYouTubeWatchUrl(youtubeId),
    };
}
