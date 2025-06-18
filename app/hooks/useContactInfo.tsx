'use client';

import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import { ContactInfo } from '../backoffice/models/contactTypes';

export const useContactInfo = () => {
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                setLoading(true);
                const contactInfoDoc = await getDoc(doc(db, 'configuration', 'contact'));

                if (contactInfoDoc.exists()) {
                    const rawData = contactInfoDoc.data();

                    // Normalisation des données
                    const data: ContactInfo = {
                        ...rawData,
                        reseauxSociaux: Array.isArray(rawData.reseauxSociaux)
                            ? rawData.reseauxSociaux
                            : [],
                        legacyReseauxSociaux: rawData.legacyReseauxSociaux || {
                            instagram: '',
                            facebook: '',
                            twitter: '',
                            linkedin: '',
                            tiktok: '',
                        },
                    } as ContactInfo;

                    setContactInfo(data);
                } else {
                    setContactInfo(null);
                }
            } catch (err) {
                console.error('Erreur lors de la récupération des informations de contact:', err);
                setError('Erreur lors du chargement des informations de contact');
            } finally {
                setLoading(false);
            }
        };

        fetchContactInfo();
    }, []);

    return { contactInfo, loading, error };
};
