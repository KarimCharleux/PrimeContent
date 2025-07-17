'use client';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { Spinner } from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase-client';
import { ContactInfo } from '../models/contactTypes';

import ContactInfoForm from './components/ContactInfoForm';

export default function ContactPage() {
    const { loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

    // Récupérer les informations de contact
    const fetchContactInfo = async () => {
        try {
            setLoading(true);
            const contactInfoDoc = await getDoc(doc(db, 'configuration', 'contact'));

            if (contactInfoDoc.exists()) {
                setContactInfo(contactInfoDoc.data() as ContactInfo);
            } else {
                // Créer un document par défaut si inexistant
                const defaultContactInfo: ContactInfo = {
                    telephone: '+33 6 49 09 57 95',
                    email: 'contact@primecontent.fr',
                    adresse: 'Paris, France',
                    reseauxSociaux: [],
                    legacyReseauxSociaux: {
                        instagram: '',
                        facebook: '',
                        twitter: '',
                        linkedin: '',
                        tiktok: '',
                    },
                    calendlyUrl: 'https://calendly.com',
                    texteBienvenue: "Boostez Votre Présence Aujourd'hui !",
                    texteFormulaire:
                        "Votre image mérite d'être vue, entendue, ressentie. Rejoignez DaliFilms pour propulser votre présence visuelle et numérique au niveau supérieur.",
                };

                await setDoc(doc(db, 'configuration', 'contact'), defaultContactInfo);
                setContactInfo(defaultContactInfo);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des informations de contact:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchContactInfo();
        }
    }, [authLoading]);

    const handleSaveContactInfo = async (info: ContactInfo) => {
        try {
            await setDoc(doc(db, 'configuration', 'contact'), info);
            setContactInfo(info);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement des informations de contact:", error);
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
            <h1 className="text-2xl font-bold mb-4">Informations de Contact</h1>

            {/* Main content */}
            {loading ? (
                <div className="flex justify-center my-12">
                    <Spinner />
                </div>
            ) : (
                contactInfo && (
                    <ContactInfoForm initialInfo={contactInfo} onSave={handleSaveContactInfo} />
                )
            )}
        </div>
    );
}
