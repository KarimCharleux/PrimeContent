'use client';

import { useState } from 'react';

import MariagesGeneralMediaManager from './components/MariagesGeneralMediaManager';
import MariagesTab from './components/MariagesTab';

export default function MariagesPage() {
    const [activeTab, setActiveTab] = useState<'couples' | 'medias'>('couples');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-b border-gray-200 mb-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Gestion des Mariages
                            </h1>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('couples')}
                                    className={`px-4 py-2 rounded-md font-medium ${
                                        activeTab === 'couples'
                                            ? 'bg-black text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    } transition-colors`}
                                >
                                    Couples
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('medias')}
                                    className={`px-4 py-2 rounded-md font-medium ${
                                        activeTab === 'medias'
                                            ? 'bg-black text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    } transition-colors`}
                                >
                                    Médias généraux
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                            {activeTab === 'couples'
                                ? 'Gérez les couples, leurs photos et leurs médias pour la section mariages.'
                                : 'Gérez les médias généraux de mariage (non liés à des couples spécifiques).'}
                        </p>
                    </div>

                    {activeTab === 'couples' ? <MariagesTab /> : <MariagesGeneralMediaManager />}
                </div>
            </div>
        </div>
    );
}
