'use client';

import { useState } from 'react';

import MariagesTab from './components/MariagesTab';

export default function MariagesPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-b border-gray-200 mb-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Gestion des Mariages
                            </h1>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                            Gérez les couples, leurs photos et leurs médias pour la section
                            mariages.
                        </p>
                    </div>

                    <MariagesTab />
                </div>
            </div>
        </div>
    );
}
