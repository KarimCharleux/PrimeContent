'use client';

import React, { useState } from 'react';

import { useAuth } from '../hooks/useAuth';

import VideosTab from './components/VideosTab';

export default function VideosEditPage() {
    const { loading } = useAuth();
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
            <h1 className="text-2xl font-bold mb-6">Édition de la Galerie Vidéos</h1>

            {statusMessage && (
                <div
                    className={`mb-4 p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
                >
                    {statusMessage.message}
                </div>
            )}

            <div className="mt-6">
                <VideosTab onStatusChange={handleStatusChange} />
            </div>
        </div>
    );
}
