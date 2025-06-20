'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import ClientMediaManager from './components/ClientMediaManager';

export default function ClientMediaPageClient() {
    const searchParams = useSearchParams();
    const clientType = searchParams?.get('type') || '';
    const clientName = searchParams?.get('name') || '';
    const clientId = searchParams?.get('id') || '';

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (clientType && clientName && clientId) {
            setIsLoading(false);
        }
    }, [clientType, clientName, clientId]);

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
                                        présents dans l'URL.
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
                        Gérez les photos et vidéos pour {typeDisplay.toLowerCase()} {displayName}
                    </p>
                </div>

                {/* Media Manager */}
                <ClientMediaManager
                    clientType={clientType}
                    clientName={clientName}
                    clientId={clientId}
                />
            </div>
        </div>
    );
}
