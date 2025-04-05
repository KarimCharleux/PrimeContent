import { createReadStream, constants } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

import { NextResponse } from 'next/server';
import sharp from 'sharp';

// Définir le chemin racine pour les médias selon l'environnement
const MEDIA_ROOT = process.env.NODE_ENV === 'production' 
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

// Vitesse de connexion moyenne en France en bits par seconde (15 Mbps)
const AVERAGE_CONNECTION_SPEED = 15 * 1024 * 1024 / 8; // Convertir en octets par seconde

// Fonction pour obtenir les dimensions d'une image
async function getImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(filePath).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des dimensions de ${filePath}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const galleryPath = join(MEDIA_ROOT, 'home', 'gallery');
    
    // Lire tous les fichiers du dossier
    const files = await readdir(galleryPath);
    
    // Filtrer pour ne garder que les images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.substring(file.lastIndexOf('.')).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // Récupérer les informations détaillées de chaque image
    const imagesPromises = imageFiles.map(async (fileName) => {
      const filePath = join(galleryPath, fileName);
      const fileStats = await stat(filePath);
      const dimensions = await getImageDimensions(filePath);
      
      return {
        name: fileName,
        url: getPublicUrl('home/gallery', fileName),
        size: fileStats.size,
        dimensions,
        lastModified: fileStats.mtime
      };
    });
    
    const images = await Promise.all(imagesPromises);
    
    // Calculer les statistiques
    const totalImages = images.length;
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    
    // Calculer le temps de chargement moyen (en ms) pour toutes les images
    // basé sur la vitesse moyenne de connexion en France
    const averageLoadTime = totalSize / AVERAGE_CONNECTION_SPEED * 1000;
    
    return NextResponse.json({
      images,
      stats: {
        totalImages,
        totalSize,
        averageLoadTime
      }
    });
  } catch (error) {
    console.error('Erreur lors de la lecture des images de la galerie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des images' },
      { status: 500 }
    );
  }
} 