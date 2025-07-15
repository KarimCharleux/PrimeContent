/**
 * Gestionnaire unifié pour la gestion des vidéos (YouTube, Dailymotion, fichiers locaux)
 */

import {
    extractDailymotionId,
    getDailymotionEmbedUrl,
    getDailymotionThumbnail,
    getDailymotionThumbnailFromAPI,
    getDailymotionWatchUrl,
    isDailymotionVideo,
    getDailymotionMetadata,
    formatDailymotionSource,
} from './dailymotion';
import {
    extractYouTubeId,
    getYouTubeEmbedUrl,
    getYouTubeThumbnail,
    getYouTubeWatchUrl,
    isYouTubeVideo,
    getYouTubeMetadata,
    formatYouTubeSource,
} from './youtube';

// Types unifiés pour les vidéos
export type VideoProvider = 'youtube' | 'dailymotion' | 'local';

export interface VideoData {
    source: string;
    provider: VideoProvider;
    videoId?: string;
    thumbnail?: string;
    title?: string;
    file?: File;
    embedUrl?: string;
    watchUrl?: string;
    format?: 'portrait' | 'paysage';
}

export interface VideoMetadata {
    title?: string;
    thumbnail_url?: string;
    author_name?: string;
    provider_name?: string;
    width?: number;
    height?: number;
    format?: 'portrait' | 'paysage';
}

/**
 * Détermine le fournisseur de vidéo depuis une URL ou un fichier
 */
export function getVideoProvider(source: string): VideoProvider {
    if (isYouTubeVideo(source)) {
        return 'youtube';
    } else if (isDailymotionVideo(source)) {
        return 'dailymotion';
    } else {
        return 'local';
    }
}

/**
 * Extrait l'ID de la vidéo selon le fournisseur
 */
export function extractVideoId(source: string, provider?: VideoProvider): string | null {
    const videoProvider = provider || getVideoProvider(source);

    switch (videoProvider) {
        case 'youtube':
            return extractYouTubeId(source);
        case 'dailymotion':
            return extractDailymotionId(source);
        case 'local':
            return null;
        default:
            return null;
    }
}

/**
 * Génère l'URL d'embed selon le fournisseur
 */
export function getVideoEmbedUrl(
    videoId: string,
    provider: VideoProvider,
    options: Record<string, any> = {},
): string | null {
    switch (provider) {
        case 'youtube':
            return getYouTubeEmbedUrl(videoId, options);
        case 'dailymotion':
            return getDailymotionEmbedUrl(videoId, options);
        case 'local':
            return null;
        default:
            return null;
    }
}

/**
 * Génère l'URL de la miniature selon le fournisseur (synchrone)
 * Note: Pour Dailymotion, utilisez getVideoThumbnailAsync() pour de meilleurs résultats
 */
export function getVideoThumbnail(
    videoId: string,
    provider: VideoProvider,
    size: 'small' | 'medium' | 'large' = 'large',
): string | null {
    switch (provider) {
        case 'youtube':
            // Mapping des tailles pour YouTube
            const youtubeQualityMap = {
                small: 'medium' as const,
                medium: 'high' as const,
                large: 'maxres' as const,
            };
            return getYouTubeThumbnail(videoId, youtubeQualityMap[size]);
        case 'dailymotion':
            // Dailymotion utilise directement les mêmes noms (fallback)
            return getDailymotionThumbnail(videoId, size);
        case 'local':
            return null;
        default:
            return null;
    }
}

/**
 * Génère l'URL de la miniature selon le fournisseur (asynchrone)
 * Utilise l'API oEmbed pour Dailymotion pour de meilleurs résultats
 */
export async function getVideoThumbnailAsync(
    videoId: string,
    provider: VideoProvider,
    size: 'small' | 'medium' | 'large' = 'large',
): Promise<string | null> {
    switch (provider) {
        case 'youtube':
            // YouTube fonctionne de manière synchrone
            const youtubeQualityMap = {
                small: 'medium' as const,
                medium: 'high' as const,
                large: 'maxres' as const,
            };
            return getYouTubeThumbnail(videoId, youtubeQualityMap[size]);
        case 'dailymotion':
            // Utiliser l'API oEmbed pour Dailymotion
            const thumbnail = await getDailymotionThumbnailFromAPI(videoId, size);
            if (thumbnail) {
                return thumbnail;
            }
            // Fallback vers l'ancienne méthode
            return getDailymotionThumbnail(videoId, size);
        case 'local':
            return null;
        default:
            return null;
    }
}

/**
 * Génère l'URL de visionnage selon le fournisseur
 */
export function getVideoWatchUrl(videoId: string, provider: VideoProvider): string | null {
    switch (provider) {
        case 'youtube':
            return getYouTubeWatchUrl(videoId);
        case 'dailymotion':
            return getDailymotionWatchUrl(videoId);
        case 'local':
            return null;
        default:
            return null;
    }
}

/**
 * Récupère les métadonnées de la vidéo selon le fournisseur
 */
export async function getVideoMetadata(
    videoId: string,
    provider: VideoProvider,
): Promise<VideoMetadata | null> {
    switch (provider) {
        case 'youtube':
            return await getYouTubeMetadata(videoId);
        case 'dailymotion':
            return await getDailymotionMetadata(videoId);
        case 'local':
            return null;
        default:
            return null;
    }
}

/**
 * Valide si une URL est une vidéo valide
 */
export function isValidVideoUrl(url: string): boolean {
    const provider = getVideoProvider(url);
    const videoId = extractVideoId(url, provider);
    return videoId !== null;
}

/**
 * Formate une source vidéo pour l'affichage (unifié)
 */
export async function formatVideoSource(input: string): Promise<VideoData | null> {
    const provider = getVideoProvider(input);
    const videoId = extractVideoId(input, provider);

    if (!videoId && provider !== 'local') {
        return null;
    }

    const baseData: VideoData = {
        source: input,
        provider,
        videoId: videoId || undefined,
    };

    if (provider === 'local') {
        return baseData;
    }

    // Récupérer les URLs et métadonnées pour les fournisseurs externes
    try {
        const [metadata, embedUrl, thumbnailUrl, watchUrl] = await Promise.all([
            getVideoMetadata(videoId!, provider),
            Promise.resolve(getVideoEmbedUrl(videoId!, provider)),
            Promise.resolve(getVideoThumbnail(videoId!, provider)),
            Promise.resolve(getVideoWatchUrl(videoId!, provider)),
        ]);

        return {
            ...baseData,
            title: metadata?.title,
            thumbnail: metadata?.thumbnail_url || thumbnailUrl || undefined,
            embedUrl: embedUrl || undefined,
            watchUrl: watchUrl || undefined,
            format: metadata?.format,
        };
    } catch (error) {
        console.error(`Erreur lors de la récupération des métadonnées ${provider}:`, error);

        // Retourner les données de base même en cas d'erreur
        return {
            ...baseData,
            embedUrl: getVideoEmbedUrl(videoId!, provider) || undefined,
            thumbnail: getVideoThumbnail(videoId!, provider) || undefined,
            watchUrl: getVideoWatchUrl(videoId!, provider) || undefined,
        };
    }
}

/**
 * Vérifie si une source est une vidéo externe (YouTube ou Dailymotion)
 */
export function isExternalVideo(source: string): boolean {
    const provider = getVideoProvider(source);
    return provider === 'youtube' || provider === 'dailymotion';
}

/**
 * Vérifie si une source est un fichier local
 */
export function isLocalVideo(source: string): boolean {
    return getVideoProvider(source) === 'local';
}
