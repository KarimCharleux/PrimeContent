import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Récupérer le paramètre eventFolder de la requête
    const { searchParams } = new URL(request.url);
    const eventFolder = searchParams.get('folder');

    if (!eventFolder) {
      return NextResponse.json(
        { error: 'Le paramètre folder est requis' },
        { status: 400 }
      );
    }

    // Chemin vers le dossier des images de l'événement
    const eventDir = path.join(process.cwd(), 'public', eventFolder);
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(eventDir)) {
      return NextResponse.json(
        { error: 'Dossier d\'événement non trouvé', folder: eventFolder },
        { status: 404 }
      );
    }
    
    // Lire le contenu du dossier
    const files = fs.readdirSync(eventDir);
    
    // Filtrer pour ne garder que les fichiers d'images (jpg, jpeg, png, webp)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });
    
    // Construire les chemins complets des images
    const imagePaths = imageFiles.map(file => `/${eventFolder}/${file}`);
    
    // Retourner la liste des images
    return NextResponse.json({ 
      images: imagePaths,
      count: imagePaths.length 
    });
  } catch (error) {
    console.error('Erreur lors de la lecture du dossier d\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des images' },
      { status: 500 }
    );
  }
} 