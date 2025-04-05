import { constants } from 'fs';
import { writeFile, mkdir, unlink, access } from 'fs/promises';
import { join, resolve } from 'path';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Définir le chemin racine pour les médias selon l'environnement
const MEDIA_ROOT = process.env.NODE_ENV === 'production' 
  ? '/home/aymo1441/PrimeContentMedia' 
  : join(process.cwd(), 'public');

// Fonction pour vérifier si un fichier existe
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Fonction pour déterminer le chemin d'enregistrement
function getStoragePath(basePath: string): string {
  return join(MEDIA_ROOT, basePath);
}

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
    const file = formData.get('file') as File;
    const basePath = formData.get('path') as string || 'uploads';
    const customFileName = formData.get('fileName') as string;
    let oldFilePath = formData.get('oldFilePath') as string;
    const useUuid = formData.get('useUuid') === 'true';
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier n\'a été fourni' },
        { status: 400 }
      );
    }

    // Vérification des formats autorisés
    const allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedFormats.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format de fichier non supporté. Utilisez JPEG, PNG, GIF, WEBP, MP4, WEBM ou OGG.' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique si aucun nom fourni
    const fileName = customFileName || (useUuid ? `${uuidv4()}.${file.name.split('.').pop()}` : file.name);
    
    // Créer le chemin complet du dossier de stockage
    const storageFolderPath = getStoragePath(basePath);
    
    // Créer le dossier s'il n'existe pas
    try {
      await mkdir(storageFolderPath, { recursive: true });
      console.log(`Dossier créé ou vérifié: ${storageFolderPath}`);
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      return NextResponse.json(
        { error: `Impossible de créer le dossier de destination: ${(error as Error).message}` },
        { status: 500 }
      );
    }
    
    // Supprimer l'ancien fichier si spécifié
    if (oldFilePath) {
      try {
        let oldFileName, oldFileFolderPath;
        
        // Gérer les URLs absolues et relatives
        if (oldFilePath.includes('media.primecontent.fr')) {
          // URL absolue du sous-domaine
          const urlParts = oldFilePath.split('media.primecontent.fr/')[1].split('/');
          oldFileName = urlParts.pop();
          oldFileFolderPath = urlParts.join('/');
        } else {
          // Chemin relatif
          if (oldFilePath.startsWith('/')) {
            oldFilePath = oldFilePath.substring(1);
          }
          const pathParts = oldFilePath.split('/');
          oldFileName = pathParts.pop();
          oldFileFolderPath = pathParts.join('/');
        }
        
        if (oldFileName) {
          // Construire le chemin complet vers l'ancien fichier
          const fullOldPath = join(MEDIA_ROOT, oldFileFolderPath, oldFileName);
          
          // Vérifier si le fichier existe avant de le supprimer
          const fileExistsResult = await fileExists(fullOldPath);
          
          if (fileExistsResult) {
            await unlink(fullOldPath);
            console.log(`Ancien fichier supprimé: ${fullOldPath}`);
          } else {
            console.log(`Fichier non trouvé: ${fullOldPath}`);
          }
        }
      } catch (deleteError) {
        console.error('Erreur lors de la suppression de l\'ancien fichier:', deleteError);
      }
    }
    
    // Chemin complet du fichier
    const filePath = join(storageFolderPath, fileName);
    
    // Convertir le fichier en buffer et l'écrire
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    try {
      await writeFile(filePath, buffer);
      console.log(`Fichier écrit avec succès: ${filePath}`);
    } catch (writeError) {
      console.error('Erreur lors de l\'écriture du fichier:', writeError);
      return NextResponse.json(
        { error: `Impossible d'écrire le fichier: ${(writeError as Error).message}` },
        { status: 500 }
      );
    }
    
    // Générer l'URL publique
    const fileUrl = getPublicUrl(basePath, fileName);
    
    return NextResponse.json({ 
      success: true, 
      fileUrl,
      storagePath: filePath
    });
  } catch (error: any) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    return NextResponse.json(
      { error: `Erreur lors du téléchargement: ${error.message}` },
      { status: 500 }
    );
  }
} 