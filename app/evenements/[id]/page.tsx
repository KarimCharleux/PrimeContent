import { collection, getDocs } from 'firebase/firestore';
import { Suspense } from 'react';

import { db } from '@/app/backoffice/lib/firebase-client';

import Footer from '../../components/Footer';
import Header from '../../components/Header';

import EventDetailClient from './EventDetailClient';

// Importation des styles
import '../evenements.scss';
import './eventDetail.scss';

// Fonction pour générer les paramètres statiques
export async function generateStaticParams() {
  try {
    // Récupérer tous les IDs d'événements visibles pour la génération statique
    const eventsSnapshot = await getDocs(collection(db, 'evenements'));
    return eventsSnapshot.docs.map(doc => ({ 
      id: doc.id 
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des événements pour generateStaticParams:", error);
    return [];
  }
}

// Types pour les props de la page
type Props = {
  readonly params: {
    id: string;
  };
};

export default function EvenementDetailPage({ params }: Props) {
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