'use client';

import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { db } from '../../lib/firebase-client';
import { Evenement, EventMediaItem } from '../../models/eventTypes';

interface SelectionData {
    userId: string;
    medias: string[];
    email?: string;
    instagram?: string;
    deviceInfo?: {
        userAgent: string;
        platform: string;
        language: string;
    };
    createdAt?: any;
    updatedAt?: any;
}

interface SelectionsClientProps {
    readonly eventId: string;
}

export default function SelectionsClient({ eventId }: SelectionsClientProps) {
    const [selections, setSelections] = useState<SelectionData[]>([]);
    const [evenement, setEvenement] = useState<Evenement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Récupérer l'événement
                const eventRef = doc(db, 'evenements', eventId);
                const eventSnap = await getDoc(eventRef);

                if (!eventSnap.exists()) {
                    setError('Événement non trouvé');
                    return;
                }

                const eventData = {
                    id: eventSnap.id,
                    ...eventSnap.data(),
                } as Evenement;
                setEvenement(eventData);

                // Récupérer les sélections
                const selectionsRef = collection(db, 'evenements', eventId, 'selections');
                const selectionsSnap = await getDocs(selectionsRef);

                const selectionsData: SelectionData[] = [];
                selectionsSnap.forEach((doc) => {
                    selectionsData.push(doc.data() as SelectionData);
                });

                setSelections(selectionsData);
            } catch (err) {
                console.error('Erreur lors du chargement des sélections:', err);
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    // Fonction pour obtenir le nom original d'un média par son ID
    const getMediaOriginalName = (mediaPath: string): string => {
        if (!evenement?.images) return mediaPath;

        const media = evenement.images.find((img) => img.path === mediaPath);
        return media?.originalName || mediaPath.split('/').pop() || mediaPath;
    };

    // Fonction pour formater les informations de l'appareil
    const formatDeviceInfo = (deviceInfo?: SelectionData['deviceInfo']): string => {
        if (!deviceInfo) return 'Non disponible';

        const userAgent = deviceInfo.userAgent;
        let device = 'Inconnu';

        if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
            device = 'Mobile';
        } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
            device = 'Tablette';
        } else {
            device = 'Ordinateur';
        }

        const language = deviceInfo.language || 'Non définie';
        return `${device} (${language})`;
    };

    // Fonction pour formater la date
    const formatDate = (timestamp: any): string => {
        if (!timestamp || !timestamp.toDate) return 'Non définie';

        try {
            const date = timestamp.toDate();
            return new Intl.DateTimeFormat('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch {
            return 'Non définie';
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (error || !evenement) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="text-lg font-medium text-red-800">Erreur</h3>
                    <p className="text-red-600 mt-1">{error || 'Événement non trouvé'}</p>
                    <Link
                        href="/backoffice/evenements"
                        className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Retour aux événements
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link href="/backoffice/evenements" className="hover:text-gray-700">
                        Événements
                    </Link>
                    <span className="mx-2">/</span>
                    <span>Sélections de &quot;{evenement.titre}&quot;</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">
                    Sélections utilisateurs - {evenement.titre}
                </h1>
                <p className="text-gray-600 mt-1">
                    {selections.length} sélection(s) enregistrée(s)
                </p>
            </div>

            {selections.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune sélection</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Aucun utilisateur n&apos;a encore sélectionné de médias pour cet événement.
                    </p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {selections.map((selection, index) => (
                            <li key={selection.userId} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                Utilisateur #{index + 1}
                                            </h3>
                                            <div className="flex space-x-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {selection.medias.length} média(s)
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {formatDeviceInfo(selection.deviceInfo)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">
                                                    ID utilisateur :
                                                </span>
                                                <br />
                                                <span className="font-mono text-xs">
                                                    {selection.userId}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Email :</span>
                                                <br />
                                                {selection.email || 'Non renseigné'}
                                            </div>
                                            <div>
                                                <span className="font-medium">Instagram :</span>
                                                <br />
                                                {selection.instagram || 'Non renseigné'}
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <span className="font-medium text-sm text-gray-900">
                                                Médias sélectionnés :
                                            </span>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {selection.medias.map((mediaPath, mediaIndex) => (
                                                    <span
                                                        key={mediaIndex}
                                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                    >
                                                        {getMediaOriginalName(mediaPath)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-3 text-xs text-gray-500">
                                            <span className="font-medium">Créé le :</span>{' '}
                                            {formatDate(selection.createdAt)} |{' '}
                                            <span className="font-medium">Modifié le :</span>{' '}
                                            {formatDate(selection.updatedAt)}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-6">
                <Link
                    href="/backoffice/evenements"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Retour aux événements
                </Link>
            </div>
        </div>
    );
}
