'use client';

import Link from 'next/link';
import { useState } from 'react';

import EventCard from '../../../components/EventCard';
import { Evenement } from '../../models/eventTypes';

interface EventListProps {
    readonly evenements: Evenement[];
    readonly handleEdit: (event: Evenement) => void;
    readonly handleDelete: (id: string) => void;
}

export default function EventList({ evenements, handleEdit, handleDelete }: EventListProps) {
    // Formater la date pour l'affichage
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';

        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        } catch (error) {
            return dateString;
        }
    };

    // Type d'événement en français
    const getEventTypeName = (type: string) => {
        switch (type) {
            case 'visionner':
                return 'Visionnage';
            case 'selection':
                return 'Sélection';
            case 'paye':
                return 'Déjà payé';
            case 'non_paye':
                return 'Non payé';
            default:
                return type;
        }
    };

    // Badge pour le type d'événement
    const getEventTypeBadge = (type: string) => {
        let colorClass = '';

        switch (type) {
            case 'visionner':
                colorClass = 'bg-indigo-100 text-indigo-800';
                break;
            case 'selection':
                colorClass = 'bg-pink-100 text-pink-800';
                break;
            case 'paye':
                colorClass = 'bg-amber-100 text-amber-800';
                break;
            case 'non_paye':
                colorClass = 'bg-teal-100 text-teal-800';
                break;
            default:
                colorClass = 'bg-gray-100 text-gray-800';
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                {getEventTypeName(type)}
            </span>
        );
    };

    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Fonction pour copier le lien public de l'événement
    const handleShare = (eventId: string) => {
        const publicUrl = `${window.location.origin}/evenements/${eventId}`;
        navigator.clipboard.writeText(publicUrl).then(() => {
            setCopiedId(eventId);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    if (evenements.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Aucun événement trouvé</p>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                </svg>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {evenements.map((evenement, index) => (
                    <div key={evenement.id} className="relative group">
                        {/* Badge de visibilité */}
                        {!evenement.visible && (
                            <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-md">
                                Masqué
                            </div>
                        )}

                        {/* Badge de protection */}
                        {evenement.protectionMotDePasse?.actif && (
                            <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white text-xs px-2 py-1 rounded-md">
                                Protégé
                            </div>
                        )}

                        {/* Overlay d'actions */}
                        <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 rounded-lg">
                            <div className="flex flex-col gap-3 items-center">
                                <button
                                    onClick={() => handleEdit(evenement)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-40 flex items-center justify-center gap-2"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
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
                                    Modifier
                                </button>
                                <Link
                                    href={`/backoffice/evenements/media?id=${evenement.id}`}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-40 flex items-center justify-center gap-2"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m3 0H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 8h6v6H9V8z"
                                        />
                                    </svg>
                                    Médias
                                </Link>
                                {/* Bouton Sélections pour les événements de type selection */}
                                {evenement.type === 'selection' && (
                                    <Link
                                        href={`/backoffice/evenements/selections?id=${evenement.id}`}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors w-40 flex items-center justify-center gap-2"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                            />
                                        </svg>
                                        Sélections
                                    </Link>
                                )}
                                <button
                                    onClick={() => handleDelete(evenement.id!)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-40 flex items-center justify-center gap-2"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Supprimer
                                </button>
                                {/* Bouton copier/feedback */}
                                {copiedId === evenement.id ? (
                                    <span className="w-40 flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 rounded-md shadow-md font-semibold text-sm transition-all duration-300">
                                        Lien copié !
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleShare(evenement.id!)}
                                        className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors w-40 flex items-center justify-center gap-2 shadow-md"
                                        type="button"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <rect
                                                x="9"
                                                y="9"
                                                width="13"
                                                height="13"
                                                rx="2"
                                                ry="2"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="white"
                                            />
                                            <rect
                                                x="3"
                                                y="3"
                                                width="13"
                                                height="13"
                                                rx="2"
                                                ry="2"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="none"
                                            />
                                        </svg>
                                        Partager
                                    </button>
                                )}
                            </div>

                            {/* Type d'événement */}
                            <div className="absolute bottom-4">
                                {getEventTypeBadge(evenement.type)}
                            </div>
                        </div>

                        {/* Utilisation du composant EventCard */}
                        <EventCard
                            href={`/evenements/${evenement.id}`}
                            imageSrc={evenement.imageSrc}
                            title={evenement.titre}
                            date={formatDate(evenement.date)}
                            location={evenement.lieu}
                            category={evenement.categorie}
                            index={index}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
