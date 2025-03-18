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
    date: '10 août 2023',
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
    date: '10 août 2023',
    lieu: 'Paris, France',
    type: 'selection',
    prixParPhoto: 4,
    images: ["1.jpg", "2.jpg"]
  }
];

export default evenementsData; 