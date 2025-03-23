import { constants } from 'fs';
import { writeFile, mkdir, unlink, access } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Fonction pour vérifier si un fichier existe
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Fonction pour supprimer un fichier existant
async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const exists = await fileExists(filePath);
    if (exists) {
      await unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier ${filePath}:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const basePath = formData.get('path') as string || 'uploads';
    const customFileName = formData.get('fileName') as string;
    const oldFilePath = formData.get('oldFilePath') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier n\'a été fourni' },
        { status: 400 }
      );
    }

    // Vérification des formats autorisés
    const allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedFormats.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format de fichier non supporté. Utilisez JPEG, PNG, GIF ou WEBP.' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique si aucun nom fourni
    const fileName = customFileName || `${uuidv4()}.${file.name.split('.').pop()}`;
    
    // Créer le chemin complet du dossier public
    const publicFolderPath = join(process.cwd(), 'public', basePath);
    
    // Créer le dossier s'il n'existe pas
    try {
      await mkdir(publicFolderPath, { recursive: true });
    } catch (error) {
      console.log('Le dossier existe déjà ou erreur lors de sa création');
    }
    
    // Supprimer l'ancien fichier si spécifié
    if (oldFilePath) {
      try {
        // Extraire le nom du fichier depuis le chemin
        const oldFileName = oldFilePath.split('/').pop();
        
        if (oldFileName) {
          // Déterminer le chemin du dossier parent
          let oldFileFolderPath;
          
          if (oldFilePath.startsWith('/')) {
            // Si le chemin commence par un slash, supprimer le premier caractère
            oldFileFolderPath = oldFilePath.substring(1, oldFilePath.lastIndexOf('/'));
          } else {
            // Sinon, prendre le chemin tel quel
            oldFileFolderPath = oldFilePath.substring(0, oldFilePath.lastIndexOf('/'));
          }
          
          // Construire le chemin complet vers l'ancien fichier
          const fullOldPath = join(process.cwd(), 'public', oldFileFolderPath, oldFileName);
          
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
        // Simplement logguer l'erreur et continuer
        console.error('Erreur lors de la suppression de l\'ancien fichier:', deleteError);
      }
    }
    
    // Chemin complet du fichier
    const filePath = join(publicFolderPath, fileName);
    
    // Convertir le fichier en buffer et l'écrire
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await writeFile(filePath, buffer);
    
    // Retourner le chemin du fichier
    const fileUrl = `/${basePath}/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      fileUrl 
    });
  } catch (error: any) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    return NextResponse.json(
      { error: `Erreur lors du téléchargement: ${error.message}` },
      { status: 500 }
    );
  }
} 