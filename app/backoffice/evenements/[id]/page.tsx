'use client';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Redirection - Gestion des médias',
  description: 'Redirection vers la page de gestion des médias'
};

// Fonction nécessaire pour le mode statique (output: export)
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

// Page qui redirige vers la version statique avec paramètre d'URL
export default function EventDetailPage({ params }: { params: { id: string } }) {
  if (params.id !== 'placeholder') {
    redirect(`/backoffice/evenements/media?id=${params.id}`);
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-center">Redirection en cours...</p>
    </div>
  );
}