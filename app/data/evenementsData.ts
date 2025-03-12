export interface Evenement {
  id: string;
  titre: string;
  imageSrc: string;
  categorie?: string;
  dossierImages: string;
  description?: string;
  type: 'payant' | 'gratuit' | 'selection';
  prixParPhoto?: number;
}

const evenementsData: Evenement[] = [
  {
    id: 'bal-des-fous-1',
    titre: 'Le Bal Des Fous',
    imageSrc: '/images/portfolio/9a3506ee4d1e113be30139812503ba81.jpg',
    categorie: 'Festival',
    dossierImages: 'events/bal-des-fous',
    description: 'Le Bal des Fous est un événement emblématique qui rassemble des personnes de tous horizons pour célébrer la créativité et la liberté d\'expression. Dans une ambiance festive et colorée, les participants profitent d\'une programmation musicale variée, d\'installations artistiques surprenantes et d\'une atmosphère unique.',
    type: 'selection',
    prixParPhoto: 4
  }
];

// Fonction pour récupérer les images d'un événement via l'API
export const getImagesForEvent = async (dossierImages: string): Promise<string[]> => {
  try {
    // Extraire le dernier segment du chemin pour l'API
    const folderSegment = dossierImages.split('/').pop() || dossierImages;
    console.log('Requesting images for folder:', folderSegment);
    
    // Appel à notre API pour récupérer les images avec le paramètre dans le chemin
    const encodedFolder = encodeURIComponent(folderSegment);
    const response = await fetch(`/api/event-images/${encodedFolder}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur lors de la récupération des images:', errorText);
      return getFallbackImages();
    }
    
    const data = await response.json();
    console.log('Images récupérées:', data.count);
    return data.images;
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    return getFallbackImages();
  }
};

// Images de secours en cas d'erreur
function getFallbackImages(): string[] {
  console.log('Utilisation des images de secours');
  return [
    '/images/portfolio/9a3506ee4d1e113be30139812503ba81.jpg',
    '/images/portfolio/PATRICK MOURATOGLOU - AMBIANCE - 2 - © bastian huber.jpg',
    '/images/portfolio/96d697f275c1e8452a5d386629888723_avatar.jpg',
    '/images/portfolio/-25.jpg',
    '/images/portfolio/GRAND PRIX MONACO (8).jpg',
    '/images/portfolio/9a3506ee4d1e113be30139812503ba81.jpg',
    '/images/portfolio/PATRICK MOURATOGLOU - AMBIANCE - 2 - © bastian huber.jpg',
    '/images/portfolio/96d697f275c1e8452a5d386629888723_avatar.jpg',
    '/images/portfolio/-25.jpg',
    '/images/portfolio/GRAND PRIX MONACO (8).jpg',
    '/images/portfolio/9a3506ee4d1e113be30139812503ba81.jpg',
    '/images/portfolio/PATRICK MOURATOGLOU - AMBIANCE - 2 - © bastian huber.jpg'
  ];
}

export default evenementsData; 