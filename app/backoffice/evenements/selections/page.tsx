'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import SelectionsClient from './SelectionsClient';

function SelectionsPage() {
    const searchParams = useSearchParams();
    const eventId = searchParams.get('id');

    if (!eventId) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="text-lg font-medium text-red-800">Événement non trouvé</h3>
                    <p className="text-red-600 mt-1">
                        L&apos;ID de l&apos;événement est manquant dans l&apos;URL.
                    </p>
                </div>
            </div>
        );
    }

    return <SelectionsClient eventId={eventId} />;
}

export default function SelectionsPageWrapper() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SelectionsPage />
        </Suspense>
    );
}
