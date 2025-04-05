'use client';

import Link from 'next/link';

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
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleEdit(evenement)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-32"
                                >
                                    Modifier
                                </button>
                                <Link
                                    href={`/backoffice/evenements/media?id=${evenement.id}`}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-32 text-center"
                                >
                                    Médias
                                </Link>
                                <button
                                    onClick={() => handleDelete(evenement.id!)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-32"
                                >
                                    Supprimer
                                </button>
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
