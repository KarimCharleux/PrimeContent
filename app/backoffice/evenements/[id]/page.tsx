'use client';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Redirection - Gestion des médias',
  description: 'Redirection vers la page de gestion des médias'
};

// Fonction essentielle pour le mode statique (output: export)
export function generateStaticParams() {
  // Pour satisfaire Next.js static export, on utilise un ID générique
  return [{ id: 'placeholder' }];
}

// Page qui redirige vers la version non-dynamique
export default function EventDetailPage({ params }: { params: { id: string } }) {
  // Dans le cadre d'une génération statique, toute tentative d'accès
  // à cette page sera redirigée vers la version non-dynamique
  if (params.id !== 'placeholder') {
    redirect(`/backoffice/evenements/media?id=${params.id}`);
  }
  
  // Ceci ne devrait jamais s'afficher car la redirection aura lieu
  return (
    <div className="container mx-auto px-4 py-8">
      <p>Redirection en cours...</p>
    </div>
  );
}