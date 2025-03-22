interface Review {
  id: string;
  name: string;
  role: string;
  company: string;
  text: string;
  imageSrc?: string;
}

const customerReviewsData: Review[] = [
  {
    id: 'review-1',
    name: 'Sophie Martin',
    role: 'Directrice Marketing',
    company: 'Mode Élégance',
    text: 'L\'équipe de PrimeContent a transformé notre image de marque avec des visuels exceptionnels. Leur créativité et leur professionnalisme ont dépassé toutes nos attentes.',
    imageSrc: '/home/reviews/review-1.jpeg'
  },
  {
    id: 'review-2',
    name: 'Thomas Dubois',
    role: 'CEO',
    company: 'TechInnovate',
    text: 'Collaborer avec PrimeContent a été une expérience incroyable. Leur équipe a su capturer l\'essence de notre entreprise et la traduire en contenu visuel percutant.',
    imageSrc: '/home/reviews/review-2.jpeg'
  },
  {
    id: 'review-3',
    name: 'Léa Moreau',
    role: 'Responsable Communication',
    company: 'Événements Prestige',
    text: 'Les vidéos réalisées par PrimeContent pour nos événements sont d\'une qualité exceptionnelle. Ils ont su capturer l\'ambiance et l\'émotion de chaque moment.',
    imageSrc: '/home/reviews/review-3.jpeg'
  },
  {
    id: 'review-4',
    name: 'Alexandre Petit',
    role: 'Directeur Artistique',
    company: 'Studio Créatif',
    text: 'En tant que professionnels de la création, nous sommes exigeants sur la qualité. PrimeContent a non seulement répondu à nos attentes, mais les a largement dépassées.',
    imageSrc: '/home/reviews/review-4.jpeg'
  },
  {
    id: 'review-5',
    name: 'Julie Leroy',
    role: 'Influenceuse',
    company: 'Mode & Lifestyle',
    text: 'Travailler avec PrimeContent a transformé ma présence sur les réseaux sociaux. Leurs photos et vidéos ont apporté une dimension professionnelle à mon contenu.',
    imageSrc: '/home/reviews/review-5.jpeg'
  },
  {
    id: 'review-6',
    name: 'Marc Dupont',
    role: 'Directeur Général',
    company: 'Luxe International',
    text: 'La qualité des productions de PrimeContent est incomparable. Leur équipe comprend parfaitement nos besoins et livre toujours un travail qui dépasse nos attentes.',
    imageSrc: '/home/reviews/review-6.jpeg'
  }
];

export default customerReviewsData; 