import fs from 'fs';
import path from 'path';

import { NextResponse } from 'next/server';

// Définir le chemin racine pour les médias selon l'environnement
const MEDIA_ROOT = process.env.NODE_ENV === 'production' 
  ? '/home/aymo1441/PrimeContentMedia' 
  : path.join(process.cwd(), 'public');

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

export async function GET() {
  try {
    // Chemin vers le dossier des images de la galerie
    const galleryDir = path.join(MEDIA_ROOT, 'home', 'gallery');
    
    // Lire le contenu du dossier
    const files = fs.readdirSync(galleryDir);
    
    // Filtrer pour ne garder que les fichiers d'images (jpg, jpeg, png)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });

    // Transformer les noms de fichiers en URLs
    const imageUrls = imageFiles.map(file => getPublicUrl('home/gallery', file));
    
    // Retourner la liste des images
    return NextResponse.json({ 
      images: imageFiles,
      imageUrls: imageUrls,
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