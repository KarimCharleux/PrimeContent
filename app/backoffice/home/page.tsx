'use client';

import React, { useState } from 'react';

import { useAuth } from '../hooks/useAuth';

import HomeTabExpertises from './components/HomeTabExpertises';
import HomeTabGallery from './components/HomeTabGallery';
import HomeTabKeyFigures from './components/HomeTabKeyFigures';
import HomeTabProjects from './components/HomeTabProjects';
import HomeTabReviews from './components/HomeTabReviews';
import HomeTabTeam from './components/HomeTabTeam';

export default function HomeEditPage() {
    const { loading } = useAuth();
    const [activeTab, setActiveTab] = useState('gallery');
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
            <h1 className="text-2xl font-bold mb-6">
                Édition des sections de la Page d&apos;Accueil
            </h1>

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
                        onClick={() => setActiveTab('gallery')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'gallery' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Galerie Photos
                    </button>
                    <button
                        onClick={() => setActiveTab('expertises')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'expertises' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Expertises
                    </button>
                    <button
                        onClick={() => setActiveTab('keyFigures')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'keyFigures' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Chiffres Clés
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'projects' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Réalisations
                    </button>
                    <button
                        onClick={() => setActiveTab('testimonials')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'testimonials' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Témoignages
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Équipe
                    </button>
                </nav>
            </div>

            {/* Contenu des onglets */}
            <div className="mt-6">
                {activeTab === 'gallery' && <HomeTabGallery onStatusChange={handleStatusChange} />}
                {activeTab === 'expertises' && <HomeTabExpertises />}
                {activeTab === 'keyFigures' && <HomeTabKeyFigures />}
                {activeTab === 'projects' && <HomeTabProjects />}
                {activeTab === 'testimonials' && <HomeTabReviews />}
                {activeTab === 'team' && <HomeTabTeam />}
            </div>
        </div>
    );
}
