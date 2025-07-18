'use client';

import { Suspense } from 'react';

import MariageMediaPageClient from './MariageMediaPageClient';

export default function MariageMediaPage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                </div>
            }
        >
            <MariageMediaPageClient />
        </Suspense>
    );
}
