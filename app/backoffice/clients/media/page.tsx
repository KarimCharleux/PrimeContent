'use client';

import { Suspense } from 'react';

import ClientMediaPageClient from './ClientMediaPageClient';

export default function ClientMediaPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<div>Chargement...</div>}>
                <ClientMediaPageClient />
            </Suspense>
        </div>
    );
}
