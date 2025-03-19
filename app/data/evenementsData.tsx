export interface Evenement {
  id: string;
  titre: string;
  imageSrc: string;
  categorie?: string;
  dossierImages: string;
  date: string;
  lieu: string;
  type: 'payant' | 'gratuit' | 'selection';
  prixParPhoto?: number;
  images: string[];
}

const evenementsData: Evenement[] = [
  {
    id: 'bal-des-fous-1',
    titre: 'Le Bal Des Fous',
    imageSrc: '/events/bal-des-fous.jpg',
    categorie: 'Festival',
    dossierImages: '/events/bal-des-fous/',
    date: '10 janvier 2025',
    lieu: 'Paris, France',
    type: 'selection',
    prixParPhoto: 4,
    images: ["1.jpg", "2.jpg"]
  },
  {
    id: 'birthday-event',
    titre: 'Birthday Event',
    imageSrc: '/events/birthday-event.jpg',
    categorie: 'Anniversaire',
    dossierImages: '/events/birthday-event/',
    date: '28 février 2025',
    lieu: 'Paris, France',
    type: 'selection',
    prixParPhoto: 4,
    images: ["10.jpg", "11.jpg", "12.jpg"]
  },
  {
    id: 'mouratoglou',
    titre: 'Mouratoglou',
    imageSrc: '/events/mouratoglou.jpg',
    categorie: 'Soirée',
    dossierImages: '/events/mouratoglou/',
    date: '1 mars 2025',
    lieu: 'Paris, France',
    type: 'selection',
    prixParPhoto: 4,
    images: ["3.jpg", "4.jpg"]
  }
];

export default evenementsData; 