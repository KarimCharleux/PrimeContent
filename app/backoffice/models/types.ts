// Types généraux
export type MediaItem = {
    id: string;
    url: string;
    filename: string;
    alt?: string;
    title?: string;
    description?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    category?: string;
    order?: number;
};

export type VideoItem = MediaItem & {
    type: 'youtube' | 'dailymotion' | 'uploaded';
    videoId?: string; // ID de la vidéo pour YouTube/Dailymotion
    duration?: number;
    thumbnail?: string;
    provider?: 'youtube' | 'dailymotion' | 'local';
    embedUrl?: string;
    watchUrl?: string;
};

// Types pour la page d'accueil
export type GalleryItem = MediaItem & {
    isHighlighted?: boolean;
};

export type Expertise = {
    id: string;
    title: string;
    description: string;
    icon?: string;
    image?: MediaItem;
    order: number;
    createdAt: Date | string;
    updatedAt: Date | string;
};

export type Client = {
    id: string;
    name: string;
    description?: string;
    logo: MediaItem;
    isHighlighted?: boolean;
    order: number;
    createdAt: Date | string;
    updatedAt: Date | string;
};

export type KeyFigure = {
    id: string;
    value: string; // Pourrait être '100+', '1M', etc.
    label: string;
    description?: string;
    icon?: string;
    order: number;
    createdAt: Date | string;
    updatedAt: Date | string;
};

export type Testimonial = {
    id: string;
    name: string;
    firstName?: string;
    photo?: MediaItem;
    text: string;
    company?: string;
    position?: string;
    order: number;
    createdAt: Date | string;
    updatedAt: Date | string;
};

export type Project = {
    id: string;
    title: string;
    description: string;
    featuredImage: MediaItem;
    images: MediaItem[];
    videos?: VideoItem[];
    category: string;
    tags?: string[];
    isHighlighted: boolean;
    client?: Client;
    date: Date | string;
    order: number;
    createdAt: Date | string;
    updatedAt: Date | string;
};

// Types pour Mariages
export type Couple = {
    id?: string;
    person1Name: string;
    person2Name: string;
    person1Image: string;
    person2Image: string;
    coupleDisplayName?: string; // Calculé automatiquement à partir des prénoms
    order?: number;
    password?: string; // Mot de passe optionnel pour protéger l'accès aux photos
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

export type Wedding = {
    id: string;
    coupleNames: string;
    date: Date | string;
    location: string;
    description: string;
    images: MediaItem[];
    videos?: VideoItem[];
    category: string;
    isFeatured: boolean;
    testimonial?: Testimonial;
    createdAt: Date | string;
    updatedAt: Date | string;
};

// Types pour les statistiques des clients (marques et talents)
export type ClientStats = {
    totalBrands: number;
    totalClients: number;
    totalImages: number;
    totalVideos: number;
    totalVideosInternal: number;
    totalVideosExternal: number;
    totalSize: number;
    imagesSize: number;
    videosSize: number;
    averageLoadTime: number;
    byBrandType: {
        images: number;
        videos: number;
        size: number;
    };
    byClientType: {
        images: number;
        videos: number;
        size: number;
    };
};

// Types pour l'administration
export type User = {
    id?: string;
    uid?: string; // Utilisé par Firebase Auth
    email: string;
    displayName?: string;
    photoURL?: string;
    role: 'admin';
    lastLogin?: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
};
