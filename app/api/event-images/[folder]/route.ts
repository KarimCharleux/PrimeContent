import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { folder: string } }
) {
  try {
    // Récupérer le paramètre folder du chemin
    const folderPath = params.folder;
    
    console.log('Folder path requested:', folderPath);
    
    if (!folderPath) {
      return NextResponse.json(
        { error: 'Le paramètre folder est requis' },
        { status: 400 }
      );
    }

    // Décodage du chemin (peut contenir des slashes encodés)
    const decodedFolder = decodeURIComponent(folderPath);
    console.log('Decoded folder path:', decodedFolder);
    
    // Chemin vers le dossier des images de l'événement
    const eventDir = path.join(process.cwd(), 'public', decodedFolder);
    console.log('Full directory path:', eventDir);
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(eventDir)) {
      console.log('Directory does not exist:', eventDir);
      
      // Essayer avec le préfixe 'events/' si le dossier n'existe pas
      const alternativeDir = path.join(process.cwd(), 'public', 'events', decodedFolder);
      console.log('Trying alternative path:', alternativeDir);
      
      if (fs.existsSync(alternativeDir)) {
        console.log('Alternative directory exists, using it instead');
        
        // Lire le contenu du dossier alternatif
        const files = fs.readdirSync(alternativeDir);
        
        // Filtrer pour ne garder que les fichiers d'images
        const imageFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        });
        
        // Construire les chemins complets des images
        const imagePaths = imageFiles.map(file => `/events/${decodedFolder}/${file}`);
        
        return NextResponse.json({ 
          images: imagePaths,
          count: imagePaths.length 
        });
      }
      
      return NextResponse.json(
        { error: 'Dossier d\'événement non trouvé', folder: decodedFolder },
        { status: 404 }
      );
    }
    
    // Lire le contenu du dossier
    const files = fs.readdirSync(eventDir);
    console.log('Files found:', files.length);
    
    // Filtrer pour ne garder que les fichiers d'images (jpg, jpeg, png, webp)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });
    console.log('Image files found:', imageFiles.length);
    
    // Construire les chemins complets des images
    const imagePaths = imageFiles.map(file => `/${decodedFolder}/${file}`);
    
    // Retourner la liste des images
    return NextResponse.json({ 
      images: imagePaths,
      count: imagePaths.length 
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la lecture du dossier d\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des images', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 