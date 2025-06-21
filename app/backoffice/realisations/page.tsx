'use client';

import React, { useState } from 'react';

import RealisationsMediaManager from './components/RealisationsMediaManager';

export default function RealisationsPage() {
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [stats, setStats] = useState<any>(null);

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Réalisations</h1>
                <p className="mt-2 text-gray-600">
                    Gérez vos photos et vidéos de réalisations dans une interface unifiée
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

            {/* Statistiques */}
            {stats && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.totalCount}
                            </div>
                            <div className="text-sm text-blue-600">Total médias</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {stats.imageCount}
                            </div>
                            <div className="text-sm text-green-600">Photos</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.videoCount}
                            </div>
                            <div className="text-sm text-purple-600">Vidéos</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                                {(stats.totalSize / (1024 * 1024)).toFixed(1)} Mo
                            </div>
                            <div className="text-sm text-orange-600">Taille totale</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Gestionnaire de médias unifié */}
            <RealisationsMediaManager onStatusChange={setStatusMessage} onStatsChange={setStats} />
        </div>
    );
}
