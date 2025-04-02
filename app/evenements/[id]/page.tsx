import { Suspense } from 'react';

import { getEventById, getAllEvents } from '../../backoffice/lib/eventService';
import Footer from '../../components/Footer';
import Header from '../../components/Header';

import EventDetailClient from './EventDetailClient';


// Importation des styles
import '../evenements.scss';
import './eventDetail.scss';

// Cette fonction est maintenant pour la génération initiale seulement
export async function generateStaticParams() {
  const events = await getAllEvents();
  return events.map(event => ({
    id: event.id,
  }));
}

// Configuration ISR - revalidation toutes les 60 secondes
export const dynamic = 'force-dynamic'; // Force le rendu dynamique
export const revalidate = 60;
export const dynamicParams = true;

// Types pour les props de la page
type Props = {
  readonly params: {
    id: string;
  };
};

async function EventPage({ params }: Props) {
  const event = await getEventById(params.id);
  
  if (!event) {
    return <div>Événement non trouvé</div>;
  }
  
  return (
    <main className="global-main-page">
      <section className="min-h-screen">
        <Header />
        <Suspense fallback={
          <div className="container">
            <div className="photos-loader">
              <div className="loader-spinner"></div>
              <div className="loading-text">Chargement de l&apos;événement...</div>
            </div>
          </div>
        }>
          <EventDetailClient eventId={params.id} />
        </Suspense>
      </section>
      <Footer hideCTA={true} />
    </main>
  );
}

export default EventPage; 