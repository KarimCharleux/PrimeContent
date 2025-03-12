'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
                    <div className="image-container">
                      <Image 
                        src={evenement.imageSrc} 
                        alt={evenement.titre} 
                        className="evenement-image"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="evenement-overlay">
                      <h3 className="text-center text-3xl md:text-4xl font-bold mb-4">{evenement.titre}</h3>
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