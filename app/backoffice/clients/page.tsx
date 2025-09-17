'use client';

import { useState } from 'react';

import ClientsTab from './components/ClientsTab';

export default function ClientsPage() {
    const [activeTab, setActiveTab] = useState<'brands' | 'clients'>('brands');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">
                            Gestion des Marques & Talents
                        </h1>

                        {/* Grands onglets qui prennent toute la largeur */}
                        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-2 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setActiveTab('brands')}
                                className={`px-8 py-2 rounded-lg font-semibold text-lg transition-all duration-300 ${
                                    activeTab === 'brands'
                                        ? 'bg-black text-white shadow-lg transform scale-[1.02]'
                                        : 'bg-transparent text-gray-700 hover:bg-white hover:shadow-md'
                                }`}
                            >
                                Marques
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('clients')}
                                className={`px-8 py-2 rounded-lg font-semibold text-lg transition-all duration-300 ${
                                    activeTab === 'clients'
                                        ? 'bg-black text-white shadow-lg transform scale-[1.02]'
                                        : 'bg-transparent text-gray-700 hover:bg-white hover:shadow-md'
                                }`}
                            >
                                Talents
                            </button>
                        </div>
                    </div>

                    <ClientsTab activeTab={activeTab} />
                </div>
            </div>
        </div>
    );
}
