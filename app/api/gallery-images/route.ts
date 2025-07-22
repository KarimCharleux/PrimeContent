import fs from 'fs';
import path from 'path';

import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Définir le chemin racine pour les médias selon l'environnement
const MEDIA_ROOT =
    process.env.NODE_ENV === 'production'
        ? '/var/www/PrimeContentMedia'
        : path.join(process.cwd(), 'public');

// Fonction pour générer l'URL publique
function getPublicUrl(basePath: string, fileName: string): string {
    // Toujours retourner le chemin relatif, même en production
    return `/${basePath}/${fileName}`;
}

// Fonction pour détecter le type de fichier
function getFileType(fileName: string): 'image' | 'video' {
    const ext = path.extname(fileName).toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    return 'image'; // Par défaut
}

export async function GET(request: Request) {
    try {
        // 🚀 Proxy vers l'API de production en mode développement
        if (process.env.NODE_ENV === 'development') {
            const { searchParams } = new URL(request.url);
            const queryString = searchParams.toString();

            console.log("🔄 Mode développement : Proxy vers l'API de production");

            const productionApiUrl = `https://dalifilms.fr/api/gallery-images${queryString ? `?${queryString}` : ''}`;

            try {
                const response = await fetch(productionApiUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': request.headers.get('user-agent') || '',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Erreur API production: ${response.status}`);
                }

                const data = await response.json();

                console.log(
                    `✅ Données récupérées depuis la production: ${data.count || 0} éléments`,
                );

                // Retourner les données de production avec les mêmes headers
                const proxyResponse = NextResponse.json(data);
                proxyResponse.headers.set(
                    'Cache-Control',
                    'public, max-age=3600, stale-while-revalidate=86400',
                );
                proxyResponse.headers.set('X-Proxy-Source', 'production');

                return proxyResponse;
            } catch (error) {
                console.error('❌ Erreur lors du proxy vers la production:', error);
                // En cas d'erreur, continuer avec la logique locale
                console.log('🔄 Fallback vers les données locales');
            }
        }

        const { searchParams } = new URL(request.url);
        const requestedPath = searchParams.get('path');
        const limitParam = searchParams.get('limit');

        // Si aucun chemin n'est spécifié, utiliser le chemin par défaut
        const targetPath = requestedPath || 'home/gallery';

        // Limite pour iOS (détection via User-Agent)
        const userAgent = request.headers.get('user-agent') || '';
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
        const defaultLimit = isIOSDevice ? 15 : 50; // Limite drastique sur iOS
        const limit = limitParam ? parseInt(limitParam, 10) : defaultLimit;

        // Sécurité : vérifier que le chemin ne contient pas de traversée de répertoire
        if (targetPath.includes('..') || targetPath.startsWith('/')) {
            return NextResponse.json({ error: 'Chemin non autorisé' }, { status: 400 });
        }

        // Chemin vers le dossier demandé
        const targetDir = path.join(MEDIA_ROOT, targetPath);

        // Vérifier si le dossier existe
        if (!fs.existsSync(targetDir)) {
            console.warn(`📁 Dossier non trouvé: ${targetDir}`);
            const response = NextResponse.json({
                images: [],
                media: [],
                count: 0,
                message: 'Dossier non trouvé',
            });

            // Headers de cache même pour les erreurs (évite les appels répétés)
            response.headers.set('Cache-Control', 'public, max-age=300'); // 5 min
            return response;
        }

        // Lire le contenu du dossier
        const files = fs.readdirSync(targetDir);

        // Filtrer pour ne garder que les fichiers médias (images et vidéos)
        const mediaFiles = files.filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return [
                // Images
                '.jpg',
                '.jpeg',
                '.png',
                '.webp',
                '.gif',
                '.bmp',
                '.svg',
                // Vidéos
                '.mp4',
                '.avi',
                '.mov',
                '.wmv',
                '.flv',
                '.webm',
                '.mkv',
            ].includes(ext);
        });

        // Transformer les fichiers en objets avec métadonnées
        const mediaObjects = mediaFiles.map((file) => {
            const filePath = path.join(targetDir, file);
            const stats = fs.statSync(filePath);

            return {
                name: file,
                path: targetPath,
                type: getFileType(file),
                size: stats.size,
                lastModified: stats.mtime,
                url: getPublicUrl(targetPath, file),
            };
        });

        // Trier par date de modification (plus récent en premier)
        mediaObjects.sort(
            (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
        );

        // Appliquer la limite (important pour iOS)
        const limitedMediaObjects = mediaObjects.slice(0, limit);

        // Retourner la liste des médias avec headers optimisés
        const response = NextResponse.json({
            images: limitedMediaObjects, // Gardé pour compatibilité
            media: limitedMediaObjects,
            count: limitedMediaObjects.length,
            totalCount: mediaObjects.length,
            path: targetPath,
            isLimited: limitedMediaObjects.length < mediaObjects.length,
        });

        // Headers de cache optimisés pour iOS
        response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        response.headers.set('ETag', `"${targetPath}-${mediaObjects.length}-${limit}"`);

        // Headers pour iOS Safari
        response.headers.set('Vary', 'User-Agent');
        response.headers.set('X-Content-Type-Options', 'nosniff');

        return response;
    } catch (error) {
        console.error('❌ Erreur lors de la lecture du dossier:', error);
        const response = NextResponse.json(
            {
                error: 'Erreur lors de la récupération des médias',
                images: [], // Fallback pour éviter les erreurs côté client
                media: [],
                count: 0,
            },
            { status: 500 },
        );

        // Headers pour éviter les appels répétés en cas d'erreur
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Retry-After', '30'); // Retry dans 30 secondes

        return response;
    }
}
