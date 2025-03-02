'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import evenementsData, { Evenement } from '../data/evenementsData';

// Importation des styles
import '../styles/evenements/evenements.scss';

export default function EvenementsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [evenements, setEvenements] = useState<Evenement[]>([]);

  useEffect(() => {
    // Simuler un chargement
    setTimeout(() => {
      setEvenements(evenementsData);
      setIsLoading(false);
    }, 500);

    // Animation du titre
    const titleElement = document.querySelector('.evenements-title');
    if (titleElement) {
      setTimeout(() => {
        titleElement.classList.add('visible');
      }, 300);
    }
  }, []);

  return (
    <main className="evenements-page">
      <Header />

      <section className="evenements-hero">
        <div className="container">
          <h1 className="evenements-title">ÉVÉNEMENTS</h1>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="evenements-grid">
              {evenements.map((evenement) => (
                <Link href={`/evenements/${evenement.id}`} key={evenement.id}>
                  <div className="evenement-card">
                    <img 
                      src={evenement.imageSrc} 
                      alt={evenement.titre} 
                      className="evenement-image"
                    />
                    <div className="evenement-overlay">
                      <h3 className="evenement-title">{evenement.titre}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
} 