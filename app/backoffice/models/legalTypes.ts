export interface LegalMentions {
    nomEntreprise: string;
    formeJuridique: string;
    adresseSiegeSocial: string;
    responsablePublication: string;
    coordonneesContact: {
        email: string;
        telephone: string;
    };
    numeroSIRET: string;
    rcsRm: string;
    tvaIntracommunautaire?: string;
    hebergeur: {
        nom: string;
        adresse: string;
        contact: string; // email ou téléphone
    };
    // Champs optionnels pour personnalisation
    textIntroduction?: string;
    updatedAt?: Date;
}
