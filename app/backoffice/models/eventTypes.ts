import { Timestamp } from 'firebase/firestore';

// Types d'événements disponibles
export type EventType = 'visionner' | 'selection' | 'paye' | 'non_paye';

// Structure pour les tarifs dégressifs
export interface TarifDegressif {
    quantite: number;
    pourcentageRemise: number;
}

// Structure pour la protection par mot de passe
export interface ProtectionMotDePasse {
    actif: boolean;
    motDePasse: string;
}

// Structure pour une image ou vidéo d'événement
export interface EventMediaItem {
    id: string;
    path: string;
    selected?: boolean;
    title?: string; // Titre optionnel
    category?: string; // Catégorie optionnelle
    source?: string; // Chemin source (peut être différent de path)
    isVideo?: boolean; // Indique si c'est une vidéo
    format?: 'portrait' | 'paysage'; // Format du média
    order?: number; // Ordre d'affichage
    thumbnail?: string; // Miniature optionnelle pour les vidéos
    size?: number; // Taille en octets
    // Support des vidéos externes
    provider?: 'youtube' | 'dailymotion' | 'local'; // Fournisseur de la vidéo
    videoId?: string; // ID de la vidéo externe
    embedUrl?: string; // URL d'embed
    watchUrl?: string; // URL de visionnage
    // Propriétés de rétrocompatibilité
    isYouTube?: boolean;
    youtubeId?: string;
}

// Interface principale pour un événement
export interface Evenement {
    id?: string;
    titre: string;
    imageSrc: string;
    // Champs optionnels
    categorie?: string;
    dossierImages: string;
    date?: string; // Date optionnelle au format YYYY-MM-DD
    lieu?: string; // Lieu optionnel
    type: EventType;
    description?: string;
    prixParPhoto?: number;
    tarifDegressif?: TarifDegressif[];
    protectionMotDePasse?: ProtectionMotDePasse;
    visible: boolean;
    images: EventMediaItem[];
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface pour les statistiques d'événements
export interface EventStats {
    totalEvents: number;
    totalImages: number;
    totalProtected: number;
    totalVisible: number;
    byType: Record<EventType, number>;
}

// Interface pour filtrer les événements
export interface EventFilter {
    searchTerm?: string;
}
