'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import evenementsData, { Evenement } from '../../data/evenementsData';

// Importation des styles
import '../../styles/evenements/evenements.scss';

export default function EvenementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [evenement, setEvenement] = useState<Evenement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Récupérer l'événement correspondant à l'ID
    const id = params.id as string;
    const foundEvenement = evenementsData.find(e => e.id === id);
    
    if (foundEvenement) {
      setEvenement(foundEvenement);
      setIsLoading(false);
    } else {
      // Rediriger vers la page des événements si l'ID n'existe pas
      router.push('/evenements');
    }
  }, [params.id, router]);

  if (isLoading) {
    return (
      <main className="evenements-page">
        <Header />
        <section className="evenements-hero">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
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
          
          <h1 className="evenements-title">{evenement?.titre}</h1>

          <div className="evenement-detail">
            <div className="evenement-image-container">
              <img 
                src={evenement?.imageSrc} 
                alt={evenement?.titre} 
                className="evenement-detail-image"
              />
            </div>
            
            <div className="evenement-info">
              <h2 className="evenement-subtitle">À propos de cet événement</h2>
              <p className="evenement-description">
                Le Bal des Fous est un événement emblématique qui rassemble des personnes de tous horizons pour célébrer la créativité et la liberté d'expression. Dans une ambiance festive et colorée, les participants profitent d'une programmation musicale variée, d'installations artistiques surprenantes et d'une atmosphère unique.
              </p>
              
              <div className="evenement-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">Catégorie:</span>
                  <span className="metadata-value">{evenement?.categorie || 'Festival'}</span>
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