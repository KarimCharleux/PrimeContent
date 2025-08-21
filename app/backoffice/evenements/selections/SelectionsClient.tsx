'use client';

import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { db } from '../../lib/firebase-client';
import { Evenement, EventMediaItem } from '../../models/eventTypes';

interface SelectionData {
    id?: string; // Ajout de l'ID du document
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
    const [deletingSelections, setDeletingSelections] = useState<Set<string>>(new Set());
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [hoveredMedia, setHoveredMedia] = useState<string | null>(null);
    const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });
    const [hoveredDeviceInfo, setHoveredDeviceInfo] = useState<SelectionData['deviceInfo'] | null>(
        null,
    );
    const [deviceTooltipPosition, setDeviceTooltipPosition] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });

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
                selectionsSnap.forEach((docSnap) => {
                    selectionsData.push({
                        id: docSnap.id,
                        ...docSnap.data(),
                    } as SelectionData);
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

    // Fonction pour supprimer une sélection
    const handleDeleteSelection = async (selection: SelectionData) => {
        if (!selection.id) {
            setStatusMessage({
                type: 'error',
                message: 'Impossible de supprimer la sélection : ID manquant',
            });
            return;
        }

        const confirmDelete = window.confirm(
            `Êtes-vous sûr de vouloir supprimer la sélection de l'utilisateur #${
                selections.findIndex((s) => s.id === selection.id) + 1
            } ?\n\nCette action supprimera définitivement ${selection.medias.length} média(s) sélectionné(s).`,
        );

        if (!confirmDelete) return;

        try {
            setDeletingSelections((prev) => new Set(prev).add(selection.id!));

            // Supprimer le document de Firestore
            await deleteDoc(doc(db, 'evenements', eventId, 'selections', selection.id));

            // Mettre à jour la liste locale
            setSelections((prev) => prev.filter((s) => s.id !== selection.id));

            setStatusMessage({
                type: 'success',
                message: 'Sélection supprimée avec succès',
            });

            // Masquer le message après 3 secondes
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (error) {
            console.error('Erreur lors de la suppression de la sélection:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la suppression de la sélection',
            });
        } finally {
            setDeletingSelections((prev) => {
                const newSet = new Set(prev);
                newSet.delete(selection.id!);
                return newSet;
            });
        }
    };

    // Fonction pour obtenir le nom original d'un média par son ID
    const getMediaOriginalName = (mediaPath: string): string => {
        if (!evenement?.images) return mediaPath;

        const media = evenement.images.find((img) => img.path === mediaPath);
        return media?.originalName || mediaPath.split('/').pop() || mediaPath;
    };

    // Fonctions pour gérer le survol
    const handleMouseEnter = (mediaPath: string, event: React.MouseEvent) => {
        setHoveredMedia(mediaPath);
        setPreviewPosition({ x: event.clientX + 10, y: event.clientY + 10 });
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        setPreviewPosition({ x: event.clientX + 10, y: event.clientY + 10 });
    };

    const handleMouseLeave = () => {
        setHoveredMedia(null);
    };

    // Fonctions pour gérer le survol des informations d'appareil
    const handleDeviceMouseEnter = (
        deviceInfo: SelectionData['deviceInfo'],
        event: React.MouseEvent,
    ) => {
        setHoveredDeviceInfo(deviceInfo);
        setDeviceTooltipPosition({ x: event.clientX + 10, y: event.clientY + 10 });
    };

    const handleDeviceMouseMove = (event: React.MouseEvent) => {
        setDeviceTooltipPosition({ x: event.clientX + 10, y: event.clientY + 10 });
    };

    const handleDeviceMouseLeave = () => {
        setHoveredDeviceInfo(null);
    };

    // Fonction pour vérifier si un média est une image
    const isImage = (mediaPath: string): boolean => {
        if (!evenement?.images) return true; // Par défaut, on assume que c'est une image

        const media = evenement.images.find((img) => img.path === mediaPath);

        // Si le média n'est pas trouvé, vérifier par extension de fichier
        if (!media) {
            console.warn(`Média non trouvé pour le path: ${mediaPath}`);
            // Vérifier par extension de fichier comme fallback
            const extension = mediaPath.toLowerCase().split('.').pop();
            const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv'];
            return !videoExtensions.includes(extension || '');
        }

        return !media.isVideo;
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

            {/* Messages de statut */}
            {statusMessage && (
                <div
                    className={`mb-6 p-4 rounded-md ${
                        statusMessage.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                >
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {statusMessage.type === 'success' ? (
                                <svg
                                    className="h-5 w-5 text-green-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="h-5 w-5 text-red-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{statusMessage.message}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <div className="-mx-1.5 -my-1.5">
                                <button
                                    type="button"
                                    className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                    onClick={() => setStatusMessage(null)}
                                >
                                    <span className="sr-only">Fermer</span>
                                    <svg
                                        className="h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            <li key={selection.id || selection.userId} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                Utilisateur #{index + 1}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {selection.medias.length} média(s)
                                                </span>
                                                <span
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200 transition-colors"
                                                    onMouseEnter={(e) =>
                                                        handleDeviceMouseEnter(
                                                            selection.deviceInfo,
                                                            e,
                                                        )
                                                    }
                                                    onMouseMove={handleDeviceMouseMove}
                                                    onMouseLeave={handleDeviceMouseLeave}
                                                >
                                                    {formatDeviceInfo(selection.deviceInfo)}
                                                </span>
                                                {/* Bouton de suppression */}
                                                {selection.id && (
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteSelection(selection)
                                                        }
                                                        disabled={deletingSelections.has(
                                                            selection.id,
                                                        )}
                                                        className="inline-flex items-center p-1.5 border border-red-300 rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        title="Supprimer cette sélection"
                                                    >
                                                        {deletingSelections.has(selection.id) ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                        ) : (
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
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
                                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors relative"
                                                        onMouseEnter={(e) =>
                                                            isImage(mediaPath) &&
                                                            handleMouseEnter(mediaPath, e)
                                                        }
                                                        onMouseMove={handleMouseMove}
                                                        onMouseLeave={handleMouseLeave}
                                                    >
                                                        {isImage(mediaPath) ? (
                                                            <>
                                                                <svg
                                                                    className="w-3 h-3 mr-1 text-green-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                    />
                                                                </svg>
                                                                {getMediaOriginalName(mediaPath)}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg
                                                                    className="w-3 h-3 mr-1 text-green-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                                    />
                                                                </svg>
                                                                {getMediaOriginalName(mediaPath)}
                                                            </>
                                                        )}
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

            {/* Preview d'image au survol */}
            {hoveredMedia && isImage(hoveredMedia) && (
                <div
                    className="fixed z-50 pointer-events-none transition-opacity duration-200"
                    style={{
                        left: `${previewPosition.x}px`,
                        top: `${previewPosition.y}px`,
                        maxWidth: '300px',
                        maxHeight: '200px',
                    }}
                >
                    <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden">
                        <div className="relative w-[300px] h-[200px]">
                            <Image
                                src={getMediaUrl(hoveredMedia)}
                                alt="Preview"
                                fill
                                className="object-contain"
                                onError={(e) => {
                                    // En cas d'erreur, masquer la preview
                                    setHoveredMedia(null);
                                }}
                            />
                        </div>
                        <div className="p-2 bg-gray-50 text-xs text-gray-600 border-t">
                            {getMediaOriginalName(hoveredMedia)}
                        </div>
                    </div>
                </div>
            )}

            {/* Tooltip détaillé pour les informations d'appareil */}
            {hoveredDeviceInfo && (
                <div
                    className="fixed z-50 pointer-events-none transition-opacity duration-200"
                    style={{
                        left: `${deviceTooltipPosition.x}px`,
                        top: `${deviceTooltipPosition.y}px`,
                        maxWidth: '350px',
                    }}
                >
                    <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                            📱 Informations de l&apos;appareil
                        </h4>
                        <div className="space-y-2 text-xs">
                            <div>
                                <span className="font-medium text-gray-700">Plateforme :</span>
                                <br />
                                <span className="text-gray-600">
                                    {hoveredDeviceInfo.platform || 'Non définie'}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Langue :</span>
                                <br />
                                <span className="text-gray-600">
                                    {hoveredDeviceInfo.language || 'Non définie'}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">User Agent :</span>
                                <br />
                                <span
                                    className="text-gray-600 break-all font-mono"
                                    style={{ fontSize: '10px' }}
                                >
                                    {hoveredDeviceInfo.userAgent || 'Non défini'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
