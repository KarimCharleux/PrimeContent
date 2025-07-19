'use client';

import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Spinner } from '../../components/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase-client';
import { Evenement } from '../../models/eventTypes';
import EventsMediaManager, { MediaStats } from '../components/EventsMediaManager';

export default function MediaPageClient(): JSX.Element {
    const searchParams = useSearchParams();
    const { loading: authLoading } = useAuth();
    const [evenement, setEvenement] = useState<Evenement | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [mediaStats, setMediaStats] = useState({
        totalCount: 0,
        imageCount: 0,
        videoCount: 0,
        totalSize: 0,
        imagesSize: 0,
        videosSize: 0,
        averageLoadTime: 0,
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Récupérer l'ID depuis l'URL côté client
    const eventId = searchParams.get('id') || 'invalid';

    // Charger les données de l'événement
    useEffect(() => {
        if (!isMounted || !eventId || eventId === 'invalid') {
            setLoading(false);
            return;
        }

        const fetchEvenement = async () => {
            try {
                setLoading(true);
                const docRef = doc(db, 'evenements', eventId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setEvenement({
                        id: docSnap.id,
                        titre: data.titre || '',
                        description: data.description || '',
                        date: data.date || '',
                        lieu: data.lieu || '',
                        imageSrc: data.imageSrc || data.couverture || '',
                        dossierImages: data.dossierImages || `evenements/${docSnap.id}`,
                        type: data.type || 'visionner',
                        visible: data.visible ?? true,
                        images: data.images || [],
                        motDePasse: data.motDePasse || '',
                        active: data.active || false,
                        ordre: data.ordre || 0,
                    } as Evenement);
                } else {
                    console.error('Événement non trouvé');
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvenement();
    }, [eventId, isMounted]);

    const handleStatusChange = (status: { type: 'success' | 'error'; message: string } | null) => {
        setStatusMessage(status);
        if (status) {
            setTimeout(() => setStatusMessage(null), 5000);
        }
    };

    const handleMediaStatsChange = (stats: MediaStats) => {
        setMediaStats(stats);
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) {
            return bytes + ' octets';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' Ko';
        } else if (bytes < 1024 * 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
        } else {
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
        }
    };

    const formatLoadTime = (milliseconds: number): string => {
        if (milliseconds < 1000) {
            return milliseconds.toFixed(0) + ' ms';
        } else {
            return (milliseconds / 1000).toFixed(1) + ' s';
        }
    };

    if (!isMounted) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (authLoading || loading) {
        return (
            <div className="space-y-4">
                {statusMessage && (
                    <div
                        className={`mb-4 p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
                    >
                        {statusMessage.message}
                    </div>
                )}
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (!evenement) {
        return (
            <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="text-lg font-medium text-red-800">Événement non trouvé</h3>
                    <p className="text-red-600 mt-1">
                        L&apos;événement avec l&apos;ID &quot;{eventId}&quot; n&apos;existe pas ou
                        n&apos;est plus disponible.
                    </p>
                </div>
                <Link
                    href="/backoffice/evenements"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    Retour à la liste des événements
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {statusMessage && (
                <div
                    className={`p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
                >
                    {statusMessage.message}
                </div>
            )}

            {/* En-tête de l'événement */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <Link
                            href="/backoffice/evenements"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-3"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            Retour à la liste
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{evenement.titre}</h1>
                        <p className="text-gray-600">
                            {evenement.date}
                            {evenement.date && evenement.lieu && ' - '}
                            {evenement.lieu}
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Link
                            href={`/evenements/${eventId}`}
                            target="_blank"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                            </svg>
                            Voir l&apos;événement
                        </Link>
                        <Link
                            href="/backoffice/evenements"
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                            Modifier l&apos;événement
                        </Link>
                    </div>
                </div>

                {/* Statistiques des médias */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total médias</p>
                        <p className="text-2xl font-bold text-blue-900">{mediaStats.totalCount}</p>
                        <p className="text-xs text-blue-700">
                            {mediaStats.imageCount} images • {mediaStats.videoCount} vidéos
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-600 font-medium">Images</p>
                        <p className="text-2xl font-bold text-yellow-900">
                            {mediaStats.imageCount}
                        </p>
                        <p className="text-xs text-yellow-700">
                            {formatSize(mediaStats.imagesSize)}
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Vidéos</p>
                        <p className="text-2xl font-bold text-green-900">{mediaStats.videoCount}</p>
                        <p className="text-xs text-green-700">
                            {formatSize(mediaStats.videosSize)}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Taille totale</p>
                        <p className="text-2xl font-bold text-purple-900">
                            {formatSize(mediaStats.totalSize)}
                        </p>
                        <p className="text-xs text-purple-700">
                            Temps: {formatLoadTime(mediaStats.averageLoadTime)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Gestionnaire de médias */}
            <EventsMediaManager
                evenement={evenement}
                onStatusChange={handleStatusChange}
                onStatsChange={handleMediaStatsChange}
            />
        </div>
    );
}
