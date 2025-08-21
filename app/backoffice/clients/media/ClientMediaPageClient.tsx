'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import ClientVideosManager from '../components/ClientVideosManager';

import ClientMediaManager from './components/ClientMediaManager';

export default function ClientMediaPageClient() {
    const searchParams = useSearchParams();
    const clientType = searchParams?.get('type') || '';
    const clientName = searchParams?.get('name') || '';
    const clientId = searchParams?.get('id') || '';

    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'media' | 'videos'>('media');
    const [refreshKey, setRefreshKey] = useState(0);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    useEffect(() => {
        if (clientType && clientName && clientId) {
            setIsLoading(false);
        }
    }, [clientType, clientName, clientId]);

    // Fonction pour forcer le refresh des composants enfants après suppression
    const handleMediaDeleted = () => {
        setRefreshKey((prev) => prev + 1);
        // Optionnel : afficher un message de confirmation
        setStatusMessage({
            type: 'success',
            message: 'Média supprimé avec succès',
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!clientType || !clientName || !clientId) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Paramètres manquants
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>
                                        Les paramètres nécessaires (type, nom, ID) ne sont pas
                                        présents dans l&apos;URL.
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <Link
                                        href="/backoffice/clients"
                                        className="text-sm bg-red-100 text-red-800 rounded-md px-2 py-1 hover:bg-red-200"
                                    >
                                        Retour aux clients
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const displayName = clientName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const typeDisplay = clientType === 'marques' ? 'Marque' : 'Célébrité';

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                {/* Header */}
                <div className="mb-6">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-4">
                            <li>
                                <Link
                                    href="/backoffice/clients"
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    Clients
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg
                                        className="flex-shrink-0 h-5 w-5 text-gray-300"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        aria-hidden="true"
                                    >
                                        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                                    </svg>
                                    <span className="ml-4 text-sm font-medium text-gray-500">
                                        {typeDisplay}: {displayName}
                                    </span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div>

                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Gestion des médias - {typeDisplay}: {displayName}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Gérez les photos, vidéos et contenus YouTube pour{' '}
                        {typeDisplay.toLowerCase()} {displayName}
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

                {/* Onglets */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('media')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'media'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <svg
                                        className="mr-2 h-5 w-5"
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
                                    Photos & Vidéos
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('videos')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'videos'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <svg
                                        className="mr-2 h-5 w-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                    Vidéos YouTube & Dailymotion
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Contenu des onglets */}
                {activeTab === 'media' ? (
                    <ClientMediaManager
                        key={`media-${refreshKey}`}
                        clientType={clientType}
                        clientName={clientName}
                        clientId={clientId}
                        onMediaDeleted={handleMediaDeleted}
                    />
                ) : (
                    <ClientVideosManager
                        key={`videos-${refreshKey}`}
                        clientType={clientType === 'marques' ? 'brand' : 'celebrity'}
                        clientId={clientId}
                        clientName={displayName}
                        onStatusChange={setStatusMessage}
                        onVideoDeleted={handleMediaDeleted}
                    />
                )}
            </div>
        </div>
    );
}
