import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// ✅ Configuration pour autoriser les uploads 5GB de galerie
export const runtime = 'nodejs';
export const maxDuration = 3600; // 1 heure pour uploads 5GB

// Définir le chemin racine pour les médias selon l'environnement
const MEDIA_ROOT =
    process.env.NODE_ENV === 'production'
        ? '/var/www/PrimeContentMedia'
        : join(process.cwd(), 'public');

// Fonction pour générer l'URL publique
function getPublicUrl(basePath: string, fileName: string): string {
    // Toujours retourner le chemin relatif, même en production
    return `/${basePath}/${fileName}`;
}

// Fonction pour obtenir les dimensions d'une image
async function getImageDimensions(
    buffer: Uint8Array,
): Promise<{ width: number; height: number } | null> {
    try {
        const metadata = await sharp(buffer).metadata();
        if (metadata.width && metadata.height) {
            return { width: metadata.width, height: metadata.height };
        }
        return null;
    } catch (error) {
        console.error('Erreur lors de la récupération des dimensions:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "Aucun fichier n'a été fourni" }, { status: 400 });
        }

        // Vérification des formats autorisés
        const allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const invalidFiles = files.filter((file) => !allowedFormats.includes(file.type));

        if (invalidFiles.length > 0) {
            return NextResponse.json(
                {
                    error: 'Certains fichiers ont un format non supporté. Utilisez JPEG, PNG, GIF ou WEBP.',
                    invalidFiles: invalidFiles.map((f) => f.name),
                },
                { status: 400 },
            );
        }

        // ✅ Vérification de la taille des fichiers (5GB max par fichier)
        const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            return NextResponse.json(
                {
                    error: 'Certains fichiers sont trop volumineux. Taille maximum : 5GB par fichier.',
                    oversizedFiles: oversizedFiles.map(
                        (f) => `${f.name} (${(f.size / 1024 / 1024 / 1024).toFixed(2)}GB)`,
                    ),
                },
                { status: 413 },
            );
        }

        // Créer le chemin complet du dossier public
        const galleryPath = join(MEDIA_ROOT, 'home', 'gallery');

        // Créer le dossier s'il n'existe pas
        try {
            await mkdir(galleryPath, { recursive: true });
        } catch (error) {
            console.log('Le dossier existe déjà ou erreur lors de sa création');
        }

        // Traiter chaque fichier
        const uploadPromises = files.map(async (file) => {
            // Utiliser le nom original du fichier
            const fileName = file.name;
            const filePath = join(galleryPath, fileName);

            // Convertir le fichier en buffer et l'écrire
            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            // Obtenir les dimensions de l'image
            const dimensions = await getImageDimensions(buffer);

            // Écrire le fichier
            await writeFile(filePath, buffer);

            // Générer l'URL publique
            const fileUrl = getPublicUrl('home/gallery', fileName);

            return {
                originalName: file.name,
                savedName: fileName,
                size: file.size,
                type: file.type,
                dimensions,
                url: fileUrl,
            };
        });

        const results = await Promise.all(uploadPromises);

        return NextResponse.json({
            success: true,
            uploaded: results.length,
            files: results,
        });
    } catch (error: any) {
        console.error('Erreur lors du téléchargement des fichiers:', error);
        return NextResponse.json(
            { error: `Erreur lors du téléchargement: ${error.message}` },
            { status: 500 },
        );
    }
}
