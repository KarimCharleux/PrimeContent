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
    // Appel à notre API pour récupérer les images
    const response = await fetch(`/api/event-images?folder=${dossierImages}`);
    
    if (!response.ok) {
      console.error('Erreur lors de la récupération des images:', await response.text());
      return [];
    }
    
    const data = await response.json();
    return data.images;
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    return [];
  }
};

export default evenementsData; 