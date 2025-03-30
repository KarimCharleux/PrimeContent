'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import EventDetailClient from '../[id]';

export default function MediaPageClient(): JSX.Element {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Récupérer l'ID depuis l'URL côté client
  const eventId = searchParams.get('id') || 'invalid';
  
  // Rendre le composant avec l'ID récupéré
  return <EventDetailClient eventId={eventId} />;
} 