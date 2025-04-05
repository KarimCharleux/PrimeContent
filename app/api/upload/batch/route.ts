import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Définir le chemin racine pour les médias selon l'environnement
const MEDIA_ROOT =
    process.env.NODE_ENV === 'production'
        ? '/home/aymo1441/PrimeContentMedia'
        : join(process.cwd(), 'public');

// Fonction pour générer l'URL publique
function getPublicUrl(basePath: string, fileName: string): string {
    if (process.env.NODE_ENV === 'production') {
        // URL absolue vers le sous-domaine média
        return `https://media.primecontent.fr/${basePath}/${fileName}`;
    } else {
        // URL relative pour le développement
        return `/${basePath}/${fileName}`;
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const basePath = (formData.get('path') as string) || 'uploads';
        const useUuid = formData.get('useUuid') === 'true';

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "Aucun fichier n'a été fourni" }, { status: 400 });
        }

        // Vérification des formats autorisés
        const allowedFormats = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/webm',
            'video/ogg',
        ];

        // Créer le chemin complet du dossier
        const storageFolderPath = join(MEDIA_ROOT, basePath);

        // Créer le dossier s'il n'existe pas
        try {
            await mkdir(storageFolderPath, { recursive: true });
        } catch (error) {
            console.log('Le dossier existe déjà ou erreur lors de sa création');
        }

        // Traiter tous les fichiers
        const fileUrls: string[] = [];
        const errorFiles: string[] = [];

        for (const file of files) {
            try {
                // Vérifier le format
                if (!allowedFormats.includes(file.type)) {
                    errorFiles.push(file.name);
                    continue;
                }

                // Générer un nom de fichier unique
                const fileName = useUuid ? `${uuidv4()}.${file.name.split('.').pop()}` : file.name;

                // Chemin complet du fichier
                const filePath = join(storageFolderPath, fileName);

                // Convertir le fichier en buffer et l'écrire
                const arrayBuffer = await file.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);
                await writeFile(filePath, buffer);

                // Ajouter l'URL du fichier à la liste
                const fileUrl = getPublicUrl(basePath, fileName);
                fileUrls.push(fileUrl);
            } catch (fileError) {
                errorFiles.push(file.name);
                console.error(`Erreur lors du traitement du fichier ${file.name}:`, fileError);
            }
        }

        return NextResponse.json({
            success: true,
            fileUrls,
            errors: errorFiles.length > 0 ? errorFiles : undefined,
        });
    } catch (error: any) {
        console.error('Erreur lors du téléchargement des fichiers:', error);
        return NextResponse.json(
            { error: `Erreur lors du téléchargement: ${error.message}` },
            { status: 500 },
        );
    }
}
