import fs from 'fs';
import path from 'path';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Chemin vers le dossier des images de la galerie
    const galleryDir = path.join(process.cwd(), 'public', 'gallery');
    
    // Lire le contenu du dossier
    const files = fs.readdirSync(galleryDir);
    
    // Filtrer pour ne garder que les fichiers d'images (jpg, jpeg, png)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });
    
    // Retourner la liste des images
    return NextResponse.json({ 
      images: imageFiles,
      count: imageFiles.length 
    });
  } catch (error) {
    console.error('Erreur lors de la lecture du dossier gallery:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des images' },
      { status: 500 }
    );
  }
} 