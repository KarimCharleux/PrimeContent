import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import evenementsData, { Evenement } from '../../data/evenementsData';

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
    <main className="evenements-page">
      <Header />

      <section className="evenements-hero">
        <div className="container">
          <Link href="/evenements" className="back-link">
            &larr; Retour aux événements
          </Link>
          
          <h1 className="evenements-title">{evenement.titre}</h1>

          <div className="evenement-detail">
            <div className="evenement-image-container">
              <div className="detail-image-wrapper">
                <Image 
                  src={evenement.imageSrc} 
                  alt={evenement.titre} 
                  className="evenement-detail-image"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
            
            <div className="evenement-info">
              <h2 className="evenement-subtitle">À propos de cet événement</h2>
              <p className="evenement-description">
                Le Bal des Fous est un événement emblématique qui rassemble des personnes de tous horizons pour célébrer la créativité et la liberté d&apos;expression. Dans une ambiance festive et colorée, les participants profitent d&apos;une programmation musicale variée, d&apos;installations artistiques surprenantes et d&apos;une atmosphère unique.
              </p>
              
              <div className="evenement-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">Catégorie:</span>
                  <span className="metadata-value">{evenement.categorie || 'Festival'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
} 