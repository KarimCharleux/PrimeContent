export interface Evenement {
  id: string;
  titre: string;
  imageSrc: string;
  categorie?: string;
  dossierImages: string;
  description?: string;
  type: 'payant' | 'gratuit' | 'selection';
  prixParPhoto?: number;
  images: string[];
}

const evenementsData: Evenement[] = [
  {
    id: 'bal-des-fous-1',
    titre: 'Le Bal Des Fous',
    imageSrc: '/images/portfolio/9a3506ee4d1e113be30139812503ba81.jpg',
    categorie: 'Festival',
    dossierImages: '/events/bal-des-fous/',
    description: 'Le Bal des Fous est un événement emblématique qui rassemble des personnes de tous horizons pour célébrer la créativité et la liberté d\'expression. Dans une ambiance festive et colorée, les participants profitent d\'une programmation musicale variée, d\'installations artistiques surprenantes et d\'une atmosphère unique.',
    type: 'selection',
    prixParPhoto: 4,
    images: ["1.jpg", "2.jpg"]
  }
];

export default evenementsData; 