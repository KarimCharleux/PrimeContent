'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PortfolioGrid from '../components/PortfolioGrid/PortfolioGrid';
import photosData from '../data/photosData';

// Importation des styles
import '../styles/photos/photos.scss';

// Variants pour les animations
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export default function PhotosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Simuler un chargement
    setTimeout(() => {
      setIsLoading(false);
    }, 600);

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

  return (
    <main className="photos-page bg-black">
      <Header />

      <section className="px-4 py-16 min-h-screen">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="title-container"
          >
            <h1 ref={titleRef} className="page-title underline-title">
              PHOTOS
            </h1>
          </motion.div>

          <p ref={descriptionRef} className="description">
            Découvrez nos services : mariages, portraits, événements, commerce, mode et projets artistiques,
            adaptés à vos besoins.
          </p>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate={shouldStartAnimations ? "visible" : "hidden"}
              variants={fadeIn}
              className="portfolio-container"
            >
              <PortfolioGrid projects={photosData} showFilter={true} />
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
} 