import { Timestamp } from 'firebase/firestore';

// Type de statut de message
export type MessageStatus = 'nouveau' | 'lu' | 'répondu' | 'archivé';

// Interface pour un message de contact
export interface ContactMessage {
    id?: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    message: string;
    status: MessageStatus;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    notes?: string; // Notes internes sur le message
}

// Interface pour les informations de contact affichées sur le site
export interface ContactInfo {
    id?: string;
    telephone: string;
    email: string;
    adresse: string;
    reseauxSociaux?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        linkedin?: string;
        tiktok?: string;
    };
    calendlyUrl?: string;
    texteBienvenue?: string;
    texteFormulaire?: string;
}

// Interface pour les statistiques de contact
export interface ContactStats {
    totalMessages: number;
    nouveauxMessages: number;
    messagesRepondus: number;
    messagesArchives: number;
}

// Interface pour filtrer les messages
export interface ContactFilter {
    searchTerm?: string;
    status?: MessageStatus;
    dateDebut?: string;
    dateFin?: string;
}
