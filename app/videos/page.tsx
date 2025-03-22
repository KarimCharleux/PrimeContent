'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid from '../components/PortfolioGrid';
import videosData from '../data/videosData';

// Importation des styles
import './videos.scss';

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

export default function VideosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldStartAnimations, setShouldStartAnimations] = useState(false);

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
    <main className="global-main-page">
      <Header />

      <section className="px-4 py-16 min-h-screen">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="title-container"
          >
            <h1 className="page-title underline-title">
              VIDÉOS
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            className="page-subtitle"
          >
            Réalisation / écriture, Tournage, Montage / VFX, Étalonnage
          </motion.p>

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
              <PortfolioGrid projects={videosData} showFilter={true} />
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
} 