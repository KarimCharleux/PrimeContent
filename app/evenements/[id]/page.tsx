import { Suspense } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import evenementsData, { Evenement } from '../../data/evenementsData';
import EventPage from './EventPage';

// Importation des styles
import '../evenements.scss';

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
        <section className="px-4 py-12">
          <div className="container">
            <div className="loading-container">
              <div>Événement non trouvé</div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="global-main-page">
      <Header />
      <Suspense fallback={
        <div className="container">
          <div className="photos-loader">
            <div className="loader-spinner"></div>
          </div>
        </div>
      }>
        <EventPage evenement={evenement} key={`event-${evenement.id}`} />
      </Suspense>
      <Footer hideCTA={true} />
    </main>
  );
} 