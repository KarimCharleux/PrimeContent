import { NextRequest, NextResponse } from 'next/server';

// Marquer cette route comme dynamique
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');
        const provider = searchParams.get('provider');

        if (!url) {
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
        }

        // Fonction pour récupérer les métadonnées Dailymotion
        const getDailymotionMetadata = async (videoUrl: string) => {
            try {
                const oembedUrl = `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

                const response = await fetch(oembedUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; VideoMetadataBot/1.0)',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }

                const data = await response.json();

                // Calculer le format basé sur les dimensions
                const width = data.width || 1920;
                const height = data.height || 1080;
                const format = height > width ? 'portrait' : 'paysage';

                return {
                    title: data.title || 'Vidéo sans titre',
                    thumbnail: data.thumbnail_url || '',
                    description: data.description || '',
                    duration: data.duration || 0,
                    author: data.author_name || '',
                    width,
                    height,
                    format,
                };
            } catch (error) {
                console.error('Erreur lors de la récupération des métadonnées Dailymotion:', error);
                throw error;
            }
        };

        // Fonction pour récupérer les métadonnées YouTube
        const getYouTubeMetadata = async (videoUrl: string) => {
            try {
                // Extraire l'ID de la vidéo YouTube
                const videoIdMatch = videoUrl.match(
                    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
                );

                if (!videoIdMatch) {
                    throw new Error('ID vidéo YouTube non trouvé');
                }

                const videoId = videoIdMatch[1];

                // Toujours utiliser le format /watch?v= pour l'API oEmbed (compatible avec tous les types de vidéos)
                const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

                const response = await fetch(oembedUrl);

                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }

                const data = await response.json();

                // Calculer le format basé sur les dimensions et l'URL d'origine
                const width = data.width || 1920;
                const height = data.height || 1080;

                // Pour YouTube, détecter les Shorts comme étant en format portrait
                let format;
                if (videoUrl.includes('/shorts/')) {
                    format = 'portrait';
                } else {
                    format = height > width ? 'portrait' : 'paysage';
                }

                return {
                    title: data.title || 'Vidéo sans titre',
                    thumbnail:
                        data.thumbnail_url ||
                        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    description: '',
                    duration: 0,
                    author: data.author_name || '',
                    width,
                    height,
                    format,
                };
            } catch (error) {
                console.error('Erreur lors de la récupération des métadonnées YouTube:', error);
                throw error;
            }
        };

        let metadata;

        if (
            provider === 'dailymotion' ||
            url.includes('dailymotion.com') ||
            url.includes('dai.ly')
        ) {
            metadata = await getDailymotionMetadata(url);
        } else if (
            provider === 'youtube' ||
            url.includes('youtube.com') ||
            url.includes('youtu.be')
        ) {
            metadata = await getYouTubeMetadata(url);
        } else {
            return NextResponse.json({ error: 'Provider non supporté' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            metadata,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des métadonnées:', error);

        return NextResponse.json(
            {
                error: 'Impossible de récupérer les métadonnées',
                details: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            { status: 500 },
        );
    }
}
