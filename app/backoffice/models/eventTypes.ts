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

// Structure pour une image d'événement
export interface EventImage {
  id: string;
  path: string;
  selected?: boolean;
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
  images: EventImage[];
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