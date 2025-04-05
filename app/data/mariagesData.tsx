import { type Project } from '../components/PortfolioGrid';

// Données pour la galerie de mariage (format compatible avec PortfolioGrid)
export const mariagesPortfolioData: Project[] = [
    {
        category: 'Sébastien & Laure',
        source: '/mariages/mariage-photo-1.jpg',
        format: 'paysage',
        title: 'Château de Versailles, 2023',
    },
    {
        category: 'Sébastien & Laure',
        source: '/mariages/mariage-photo-2.jpg',
        format: 'portrait',
        title: 'Jardin du Luxembourg, 2022',
    },
    {
        category: 'Maxime & Emilie',
        source: '/mariages/mariage-photo-3.jpg',
        format: 'portrait',
        title: 'Plage de Nice, 2023',
    },
    {
        category: 'Hugo & Marie',
        source: '/mariages/mariage-photo-4.jpg',
        format: 'paysage',
        title: 'Domaine de Chantilly, 2021',
    },
    {
        category: 'Nicolas & Margaux',
        source: '/mariages/mariage-photo-5.jpg',
        format: 'paysage',
        title: 'Abbaye de Fontfroide, 2022',
    },
    {
        category: 'Arthur & Camille',
        source: '/mariages/mariage-photo-6.jpg',
        format: 'portrait',
        title: 'Alpes Françaises, 2023',
    },
    {
        category: 'Thomas & Julie',
        source: '/mariages/mariage-photo-7.jpg',
        format: 'portrait',
        title: 'Villa Ephrussi, 2022',
    },
    {
        category: 'Arthur & Camille',
        source: '/mariages/mariage-photo-8.jpg',
        format: 'paysage',
        title: 'Château de Chenonceau, 2023',
    },
    {
        category: 'Nicolas & Margaux',
        source: '/mariages/mariage-video-1.jpg',
        format: 'paysage',
        title: 'Domaine de Chantilly, 2021',
        isVideo: true,
    },
];

// Anciennes données (conservées pour compatibilité avec d'autres composants)
export const mariagesGalleryData = [
    {
        id: 1,
        type: 'video',
        src: '/mariages/mariage-video-1.jpg',
        alt: 'Vidéo de mariage de Sébastien et Laure',
        videoSrc: '/mariages/mariage-video-1.mp4',
    },
    {
        id: 2,
        type: 'image',
        src: '/mariages/mariage-photo-1.jpg',
        alt: 'Photo de mariage - couple élégant',
    },
    {
        id: 3,
        type: 'image',
        src: '/mariages/mariage-photo-2.jpg',
        alt: 'Photo de mariage - couple sous la pluie',
    },
    {
        id: 4,
        type: 'image',
        src: '/mariages/mariage-photo-3.jpg',
        alt: 'Photo de mariage - couple avec parapluie',
    },
    {
        id: 5,
        type: 'image',
        src: '/mariages/mariage-photo-4.jpg',
        alt: 'Photo de mariage - couple en extérieur',
    },
    {
        id: 6,
        type: 'image',
        src: '/mariages/mariage-photo-5.jpg',
        alt: 'Photo de mariage - couple dans un château',
    },
    {
        id: 7,
        type: 'image',
        src: '/mariages/mariage-photo-6.jpg',
        alt: 'Photo de mariage - couple sous parapluie',
    },
    {
        id: 8,
        type: 'image',
        src: '/mariages/mariage-photo-7.jpg',
        alt: 'Photo de mariage - couple en noir et blanc',
    },
    {
        id: 9,
        type: 'image',
        src: '/mariages/mariage-photo-8.jpg',
        alt: 'Photo de mariage - couple en automne',
    },
];

// Données pour les témoignages de couples mariés
export const mariagesTestimonialsData = [
    {
        id: 1,
        coupleName: 'Sébastien & Laure',
        coupleImages: {
            person1: '/mariages/testimonial-sebastien.jpeg',
            person2: '/mariages/testimonial-laure.png',
        },
    },
    {
        id: 2,
        coupleName: 'Maxime & Emilie',
        coupleImages: {
            person1: '/mariages/testimonial-maxime.jpeg',
            person2: '/mariages/testimonial-emilie.jpeg',
        },
    },
    {
        id: 3,
        coupleName: 'Hugo & Marie',
        coupleImages: {
            person1: '/mariages/testimonial-sebastien.jpeg',
            person2: '/mariages/testimonial-marie.jpeg',
        },
    },
    {
        id: 4,
        coupleName: 'Thomas & Julie',
        coupleImages: {
            person1: '/mariages/testimonial-maxime.jpeg',
            person2: '/mariages/testimonial-marie.jpeg',
        },
    },
    {
        id: 5,
        coupleName: 'Nicolas & Margaux',
        coupleImages: {
            person1: '/mariages/testimonial-hugo.jpeg',
            person2: '/mariages/testimonial-emilie.jpeg',
        },
    },
    {
        id: 6,
        coupleName: 'Arthur & Camille',
        coupleImages: {
            person1: '/mariages/testimonial-sebastien.jpeg',
            person2: '/mariages/testimonial-laure.png',
        },
    },
];
