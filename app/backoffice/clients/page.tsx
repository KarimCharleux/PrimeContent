'use client';

import { useState } from 'react';

import ClientsTab from './components/ClientsTab';

export default function ClientsPage() {
    const [activeTab, setActiveTab] = useState<'brands' | 'clients'>('brands');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-b border-gray-200 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Gestion des Marques & Talents
                            </h1>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('brands')}
                                    className={`px-4 py-2 rounded-md font-medium ${
                                        activeTab === 'brands'
                                            ? 'bg-black text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    } transition-colors`}
                                >
                                    Marques
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('clients')}
                                    className={`px-4 py-2 rounded-md font-medium ${
                                        activeTab === 'clients'
                                            ? 'bg-black text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    } transition-colors`}
                                >
                                    Talents
                                </button>
                            </div>
                        </div>
                    </div>

                    <ClientsTab activeTab={activeTab} />
                </div>
            </div>
        </div>
    );
}
