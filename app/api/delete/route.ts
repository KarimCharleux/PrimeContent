import { constants } from 'fs';
import { unlink, access } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';

// Définir le chemin racine pour les médias selon l'environnement
const MEDIA_ROOT = process.env.NODE_ENV === 'production' 
  ? '/home/aymo1441/PrimeContentMedia' 
  : join(process.cwd(), 'public');

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Récupérer les paramètres de la requête
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');
    const fileName = searchParams.get('name');
    
    if (!filePath || !fileName) {
      return NextResponse.json(
        { error: 'Chemin ou nom de fichier manquant' },
        { status: 400 }
      );
    }
    
    // Vérifier que le fichier ne contient pas de chemin relatif qui pourrait être dangereux
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json(
        { error: 'Nom de fichier invalide' },
        { status: 400 }
      );
    }
    
    // Construire le chemin complet du fichier
    const fullPath = join(MEDIA_ROOT, filePath, fileName);
    
    // Vérifier si le fichier existe
    const exists = await fileExists(fullPath);
    if (!exists) {
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }
    
    // Supprimer le fichier
    await unlink(fullPath);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fichier supprimé avec succès',
      fileName,
      filePath
    });
  } catch (error: any) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return NextResponse.json(
      { error: `Erreur lors de la suppression: ${error.message}` },
      { status: 500 }
    );
  }
} 