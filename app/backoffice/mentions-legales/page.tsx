'use client';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { Spinner } from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase-client';
import { LegalMentions } from '../models/legalTypes';

import LegalMentionsForm from './components/LegalMentionsForm';

// Structure vide pour initialisation
const emptyLegalMentions: LegalMentions = {
    nomEntreprise: '',
    formeJuridique: '',
    adresseSiegeSocial: '',
    responsablePublication: '',
    coordonneesContact: {
        email: '',
        telephone: '',
    },
    numeroSIRET: '',
    rcsRm: '',
    tvaIntracommunautaire: '',
    hebergeur: {
        nom: '',
        adresse: '',
        contact: '',
    },
    textIntroduction: '',
};

export default function MentionsLegalesPage() {
    const { loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [legalMentions, setLegalMentions] = useState<LegalMentions | null>(null);

    // Récupérer les mentions légales
    const fetchLegalMentions = async () => {
        try {
            setLoading(true);
            const legalDoc = await getDoc(doc(db, 'configuration', 'legal-mentions'));

            if (legalDoc.exists()) {
                setLegalMentions(legalDoc.data() as LegalMentions);
            } else {
                // Si aucun document n'existe, utiliser la structure vide
                setLegalMentions(emptyLegalMentions);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des mentions légales:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchLegalMentions();
        }
    }, [authLoading]);

    const handleSaveLegalMentions = async (mentions: LegalMentions) => {
        try {
            const dataToSave = {
                ...mentions,
                updatedAt: new Date(),
            };
            await setDoc(doc(db, 'configuration', 'legal-mentions'), dataToSave);
            setLegalMentions(dataToSave);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement des mentions légales:", error);
            throw error;
        }
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Mentions Légales</h1>
                <p className="text-gray-600">
                    Gérez les informations légales obligatoires affichées sur le site public.
                </p>
            </div>

            {/* Main content */}
            {loading ? (
                <div className="flex justify-center my-12">
                    <Spinner />
                </div>
            ) : (
                legalMentions && (
                    <LegalMentionsForm
                        initialMentions={legalMentions}
                        onSave={handleSaveLegalMentions}
                    />
                )
            )}
        </div>
    );
}
