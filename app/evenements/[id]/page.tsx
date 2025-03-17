import { Suspense } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import evenementsData, { Evenement } from '../../data/evenementsData';
import EventPage from './EventPage';

// Importation des styles
import '../../styles/evenements/evenements.scss';

// Fonction pour générer les paramètres statiques
export async function generateStaticParams() {
  return evenementsData.map((evenement) => ({
    id: evenement.id,
  }));
}

// Types pour les props de la page
type Props = {
  params: {
    id: string;
  };
};

// Fonction pour obtenir l'événement
function getEvenement(id: string): Evenement | undefined {
  return evenementsData.find(e => e.id === id);
}

export default function EvenementDetailPage({ params }: Props) {
  const evenement = getEvenement(params.id);

  if (!evenement) {
    return (
      <main className="evenements-page">
        <Header />
        <section className="evenements-hero">
          <div className="container">
            <div className="loading-container">
              <div>Événement non trouvé</div>
            </div>
          </div>
        </section>
        <Footer hideCTA={true} />
      </main>
    );
  }

  return (
    <main className="event-photos-page">
      <Header />
      <Suspense fallback={
        <div className="container">
          <div className="photos-loader">
            <div className="loader-spinner"></div>
          </div>
        </div>
      }>
        <EventPage evenement={evenement} />
      </Suspense>
      <Footer hideCTA={true} />
    </main>
  );
} 