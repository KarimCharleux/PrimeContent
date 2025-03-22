'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

import Footer from '../components/Footer';
import Header from '../components/Header';
import evenementsData, { Evenement } from '../data/evenementsData';

// Importation des styles
import './evenements.scss';

// Variants pour les animations
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: custom * 0.1,
      ease: [0.25, 0.1, 0.25, 1]
    }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3
    }
  }
};

export default function EvenementsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  // État pour contrôler le démarrage des animations
  const [shouldStartAnimations, setShouldStartAnimations] = useState(false);

  useEffect(() => {
    // Simuler un chargement
    setTimeout(() => {
      setEvenements(evenementsData);
      setIsLoading(false);
    }, 500);

    // Vérifier si le SplashScreen est terminé ou si on vient d'une autre page
    const checkSplashScreen = () => {
      const splashScreenComplete = localStorage.getItem('splashScreenComplete');
      
      // Si on vient du SplashScreen
      if (splashScreenComplete === 'true') {
        setShouldStartAnimations(true);
        localStorage.removeItem('splashScreenComplete');
        // Réinitialiser la position de défilement à 0
        window.scrollTo(0, 0);
      } 
      // Si on vient d'une autre page (pas de SplashScreen)
      else if (splashScreenComplete !== 'waiting') {
        // On active les animations après un petit délai pour laisser la page se charger
        setTimeout(() => {
          setShouldStartAnimations(true);
        }, 100);
      }
    };

    // Vérifie immédiatement et toutes les 100ms si le splash screen est terminé
    checkSplashScreen();
    const interval = setInterval(checkSplashScreen, 100);

    return () => clearInterval(interval);
  }, []);

  const EventCard = ({ evenement, index }: { evenement: Evenement, index: number }) => {
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
        <motion.div 
          ref={cardRef}
          className="evenement-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          variants={fadeInUp}
          custom={index}
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
        </motion.div>
      </Link>
    );
  };

  return (
    <main className="global-main-page">
      <Header />

      <section className="px-4 py-12 min-h-screen">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="title-container relative overflow-hidden"
          >
            <motion.h1
              className="page-title underline-title"
              initial={{ opacity: 0 }}
              animate={shouldStartAnimations ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              ÉVÉNEMENTS
            </motion.h1>
          </motion.div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <motion.div 
              className="evenements-grid"
              initial="hidden"
              animate={shouldStartAnimations ? "visible" : "hidden"}
              variants={staggerContainer}
            >
              {evenements.map((evenement, index) => (
                <EventCard key={evenement.id} evenement={evenement} index={index} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
} 