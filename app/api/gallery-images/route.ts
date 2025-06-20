import fs from 'fs';
import path from 'path';

import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Définir le chemin racine pour les médias selon l'environnement
const MEDIA_ROOT =
    process.env.NODE_ENV === 'production'
        ? '/home/aymo1441/PrimeContentMedia'
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
        const { searchParams } = new URL(request.url);
        const requestedPath = searchParams.get('path');

        // Si aucun chemin n'est spécifié, utiliser le chemin par défaut
        const targetPath = requestedPath || 'home/gallery';

        // Sécurité : vérifier que le chemin ne contient pas de traversée de répertoire
        if (targetPath.includes('..') || targetPath.startsWith('/')) {
            return NextResponse.json({ error: 'Chemin non autorisé' }, { status: 400 });
        }

        // Chemin vers le dossier demandé
        const targetDir = path.join(MEDIA_ROOT, targetPath);

        // Vérifier si le dossier existe
        if (!fs.existsSync(targetDir)) {
            console.warn(`Dossier non trouvé: ${targetDir}`);
            return NextResponse.json({
                images: [],
                media: [],
                count: 0,
                message: 'Dossier non trouvé',
            });
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

        // Retourner la liste des médias
        return NextResponse.json({
            images: mediaObjects, // Gardé pour compatibilité
            media: mediaObjects,
            count: mediaObjects.length,
            path: targetPath,
        });
    } catch (error) {
        console.error('Erreur lors de la lecture du dossier:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des médias' },
            { status: 500 },
        );
    }
}
