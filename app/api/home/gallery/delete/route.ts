import { constants } from 'fs';
import { unlink, access } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';

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
    // Récupérer le nom du fichier à supprimer depuis les paramètres d'URL
    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get('name');
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'Nom de fichier manquant' },
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
    const galleryPath = join(process.cwd(), 'public', 'home', 'gallery');
    const filePath = join(galleryPath, fileName);
    
    // Vérifier si le fichier existe
    const exists = await fileExists(filePath);
    if (!exists) {
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }
    
    // Supprimer le fichier
    await unlink(filePath);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fichier supprimé avec succès',
      fileName
    });
  } catch (error: any) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return NextResponse.json(
      { error: `Erreur lors de la suppression: ${error.message}` },
      { status: 500 }
    );
  }
} 