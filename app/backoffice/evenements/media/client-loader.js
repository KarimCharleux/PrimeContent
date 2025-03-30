'use client';

import dynamic from 'next/dynamic';

// Importer dynamiquement le composant client
const DynamicMediaPageClient = dynamic(() => import('./MediaPageClient'), {
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
    </div>
  ),
  ssr: false // Désactiver le SSR pour ce composant
});

export default function ClientLoader() {
  // Ne pas manipuler directement le DOM avec React
  return <DynamicMediaPageClient />;
}