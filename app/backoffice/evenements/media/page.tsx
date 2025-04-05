import { Metadata } from 'next';

import ClientLoader from './client-loader';

export const metadata: Metadata = {
    title: "Gestion des médias de l'événement",
    description: 'Gestion des médias pour un événement spécifique',
};

// Page statique pour le mode export static de Next.js
export default function MediaPage() {
    return <ClientLoader />;
}
