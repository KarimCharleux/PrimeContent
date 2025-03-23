import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier n\'a été fourni' },
        { status: 400 }
      );
    }

    // Vérification des formats autorisés
    const allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedFormats.includes(file.type));
    
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { 
          error: 'Certains fichiers ont un format non supporté. Utilisez JPEG, PNG, GIF ou WEBP.',
          invalidFiles: invalidFiles.map(f => f.name)
        },
        { status: 400 }
      );
    }
    
    // Créer le chemin complet du dossier public
    const galleryPath = join(process.cwd(), 'public', 'home', 'gallery');
    
    // Créer le dossier s'il n'existe pas
    try {
      await mkdir(galleryPath, { recursive: true });
    } catch (error) {
      console.log('Le dossier existe déjà ou erreur lors de sa création');
    }
    
    // Traiter chaque fichier
    const uploadPromises = files.map(async (file) => {
      // Générer un nom de fichier unique
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = join(galleryPath, fileName);
      
      // Convertir le fichier en buffer et l'écrire
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      await writeFile(filePath, buffer);
      
      return {
        originalName: file.name,
        savedName: fileName,
        size: file.size,
        type: file.type
      };
    });
    
    const results = await Promise.all(uploadPromises);
    
    return NextResponse.json({ 
      success: true, 
      uploaded: results.length,
      files: results
    });
  } catch (error: any) {
    console.error('Erreur lors du téléchargement des fichiers:', error);
    return NextResponse.json(
      { error: `Erreur lors du téléchargement: ${error.message}` },
      { status: 500 }
    );
  }
} 