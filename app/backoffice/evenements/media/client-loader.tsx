'use client';

import dynamic from 'next/dynamic';
import { FC } from 'react';

// Importation dynamique du composant client avec chargement différé
const DynamicMediaPageClient = dynamic(() => import('./MediaPageClient'), {
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
    </div>
  ),
  ssr: false
});

const ClientLoader: FC = () => <DynamicMediaPageClient />;

export default ClientLoader; 