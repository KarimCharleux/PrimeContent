'use client';

import { useState, useEffect, useRef } from 'react';
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

  const EventCard = ({ evenement }: { evenement: Evenement }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      
      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      
      // Calculer la position relative du curseur par rapport à la carte
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculer la rotation en fonction de la position du curseur
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 15;
      const rotateY = (centerX - x) / 15;
      
      // Appliquer la transformation
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
      
      // Effet d'éclairage pour la bordure
      const shine = card.querySelector('.card-shine') as HTMLElement;
      if (shine) {
        const percentX = x / rect.width * 100;
        const percentY = y / rect.height * 100;
        shine.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%)`;
      }
    };

    const handleMouseLeave = () => {
      if (!cardRef.current) return;
      
      // Réinitialiser la transformation
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      
      // Réinitialiser l'effet d'éclairage
      const shine = cardRef.current.querySelector('.card-shine') as HTMLElement;
      if (shine) {
        shine.style.background = 'none';
      }
    };

    return (
      <Link href={`/evenements/${evenement.id}`}>
        <div 
          ref={cardRef}
          className="evenement-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-inner">
            <div className="card-shine"></div>
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
              <div className="meta-info">
                <div className="meta-item">
                  <svg className="meta-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{evenement.date}</span>
                </div>
                <div className="meta-item">
                  <svg className="meta-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{evenement.lieu}</span>
                </div>
              </div>
              <h3 className="event-title">{evenement.titre}</h3>
              <div className="event-category">{evenement.categorie || 'Événement'}</div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <main className="evenements-page">
      <Header />

      <section className="evenements-hero">
        <div className="container">
          <h1 className="page-title underline-title">ÉVÉNEMENTS</h1>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="evenements-grid">
              {evenements.map((evenement) => (
                <EventCard key={evenement.id} evenement={evenement} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
} 