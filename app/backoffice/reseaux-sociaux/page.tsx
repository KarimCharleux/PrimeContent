'use client';

import React, { useState } from 'react';

import { useAuth } from '../hooks/useAuth';

import ContentTab from './components/ContentTab';
import KeyFiguresTab from './components/KeyFiguresTab';
import ProcessTab from './components/ProcessTab';
import RealisationsTab from './components/RealisationsTab';

export default function ReseauxSociauxBackofficePage() {
    const { loading } = useAuth();
    const [activeTab, setActiveTab] = useState('content');
    const [isLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const handleStatusChange = (status: { type: 'success' | 'error'; message: string } | null) => {
        setStatusMessage(status);
    };

    if (loading || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Gestion des Réseaux Sociaux</h1>

            {statusMessage && (
                <div
                    className={`mb-4 p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
                >
                    {statusMessage.message}
                </div>
            )}

            {/* Onglets */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'content' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Contenu Principal
                    </button>
                    <button
                        onClick={() => setActiveTab('process')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'process' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Processus
                    </button>
                    <button
                        onClick={() => setActiveTab('keyFigures')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'keyFigures' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Chiffres Clés
                    </button>
                    <button
                        onClick={() => setActiveTab('realisations')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'realisations' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Réalisations
                    </button>
                </nav>
            </div>

            {/* Contenu des onglets */}
            <div className="mt-6">
                {activeTab === 'content' && <ContentTab onStatusChange={handleStatusChange} />}
                {activeTab === 'process' && <ProcessTab onStatusChange={handleStatusChange} />}
                {activeTab === 'keyFigures' && (
                    <KeyFiguresTab onStatusChange={handleStatusChange} />
                )}
                {activeTab === 'realisations' && (
                    <RealisationsTab onStatusChange={handleStatusChange} />
                )}
            </div>
        </div>
    );
}
