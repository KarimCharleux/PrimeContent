'use client';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { ContactInfo } from '../../models/contactTypes';

import ContactInfoForm from './ContactInfoForm';

import { db } from '@/firebase/firebaseConfig';

export default function ContactInfoManager() {
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                const docRef = doc(db, 'contactConfig', 'contactInfo');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setContactInfo(docSnap.data() as ContactInfo);
                } else {
                    // Initialize with default values if no data exists
                    const defaultContactInfo: ContactInfo = {
                        telephone: '',
                        email: '',
                        adresse: '',
                        reseauxSociaux: {
                            instagram: '',
                            facebook: '',
                            twitter: '',
                            linkedin: '',
                            tiktok: '',
                        },
                        calendlyUrl: '',
                        texteBienvenue: "Boostez Votre Présence Aujourd'hui !",
                        texteFormulaire:
                            "Votre image mérite d'être vue, entendue, ressentie. Rejoignez Primecontent pour propulser votre présence visuelle et numérique au niveau supérieur.",
                    };
                    setContactInfo(defaultContactInfo);
                }
            } catch (err) {
                console.error('Error fetching contact info:', err);
                setError(
                    'Une erreur est survenue lors de la récupération des informations de contact',
                );
            } finally {
                setLoading(false);
            }
        };

        fetchContactInfo();
    }, []);

    const handleSaveContactInfo = async (updatedInfo: ContactInfo) => {
        try {
            await setDoc(doc(db, 'contactConfig', 'contactInfo'), updatedInfo);
            setContactInfo(updatedInfo);
            setStatusMessage({
                type: 'success',
                message: 'Informations de contact mises à jour avec succès',
            });

            // Effacer le message après 5 secondes
            setTimeout(() => {
                setStatusMessage(null);
            }, 5000);

            return Promise.resolve();
        } catch (err) {
            console.error('Error saving contact info:', err);
            setStatusMessage({
                type: 'error',
                message:
                    "Une erreur est survenue lors de l'enregistrement des informations de contact",
            });
            return Promise.reject(err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Informations de contact</h2>

                {statusMessage && (
                    <div
                        className={`p-4 rounded-md mb-6 ${
                            statusMessage.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                    >
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {statusMessage.type === 'success' ? (
                                    <svg
                                        className="h-5 w-5 text-green-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="h-5 w-5 text-red-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm">{statusMessage.message}</p>
                            </div>
                        </div>
                    </div>
                )}

                <p className="text-gray-600 mb-6">
                    Ces informations sont affichées sur la page de contact publique.
                </p>

                {contactInfo && (
                    <ContactInfoForm initialInfo={contactInfo} onSave={handleSaveContactInfo} />
                )}
            </div>
        </div>
    );
}
