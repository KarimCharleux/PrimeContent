'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import EventDetailClient from '../[id]'; // Import depuis le fichier barrel

export default function MediaPageClient() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  
  // Vérifier si le composant est monté côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Attendre que le composant soit monté côté client pour éviter les erreurs d'hydratation
  if (!isMounted) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
    </div>;
  }
  
  // Récupérer l'ID depuis l'URL côté client
  const eventId = searchParams.get('id') || 'invalid';
  
  // Rendre le composant avec l'ID récupéré
  return <EventDetailClient eventId={eventId} />;
} 