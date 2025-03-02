export interface Evenement {
  id: string;
  titre: string;
  imageSrc: string;
  categorie?: string;
}

const evenementsData: Evenement[] = [
  {
    id: 'bal-des-fous-1',
    titre: 'Le Bal Des Fous',
    imageSrc: '/images/portfolio/9a3506ee4d1e113be30139812503ba81.jpg',
    categorie: 'Festival'
  },
  {
    id: 'bal-des-fous-2',
    titre: 'Le Bal Des Fous',
    imageSrc: '/images/portfolio/PATRICK MOURATOGLOU - AMBIANCE - 2 - © bastian huber.jpg',
    categorie: 'Festival'
  },
  {
    id: 'bal-des-fous-3',
    titre: 'Le Bal Des Fous',
    imageSrc: '/images/portfolio/96d697f275c1e8452a5d386629888723_avatar.jpg',
    categorie: 'Festival'
  },
  {
    id: 'bal-des-fous-4',
    titre: 'Le Bal Des Fous',
    imageSrc: '/images/portfolio/00.mp4',
    categorie: 'Festival'
  },
  {
    id: 'bal-des-fous-5',
    titre: 'Le Bal Des Fous',
    imageSrc: '/images/portfolio/-25.jpg',
    categorie: 'Festival'
  },
  {
    id: 'bal-des-fous-6',
    titre: 'Le Bal Des Fous',
    imageSrc: '/images/portfolio/GRAND PRIX MONACO (8).jpg',
    categorie: 'Festival'
  }
];

export default evenementsData; 