'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Evenement } from '../../data/evenementsData';

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

interface EventPageProps {
  readonly evenement: Evenement;
}

export default function EventPage({ evenement }: EventPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
  // Utiliser une ref pour suivre si le chargement initial a été fait
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // Réinitialiser l'état lors du changement d'événement
    setIsLoading(true);
    setLoadedImages([]);
    setLoadingProgress(0);
    setSelectedImages(new Set());
    setErrorMessage(null);
    // Réinitialiser le flag de chargement initial
    initialLoadDone.current = false;

    // Activer les animations
    setTimeout(() => {
      setShouldStartAnimations(true);
    }, 100);

    // Vérifier si l'événement a des images
    if (!evenement.images || evenement.images.length === 0) {
      setErrorMessage("Aucune image n'a été trouvée pour cet événement.");
      setIsLoading(false);
      return;
    }

    // Si le chargement initial a déjà été fait, ne pas continuer
    if (initialLoadDone.current) {
      setIsLoading(false);
      return;
    }

    // Précharger les images pour suivre la progression
    const totalImages = evenement.images.length;
    let loadedCount = 0;

    // Fonction pour précharger une image
    const preloadImage = (src: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        // Construire le chemin complet de l'image
        const fullPath = evenement.dossierImages + src;
        img.src = fullPath;
        img.onload = () => {
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / totalImages) * 100));
          resolve(fullPath);
        };
        img.onerror = () => reject(src);
      });
    };

    // Précharger toutes les images avec un délai pour ne pas surcharger le navigateur
    const preloadAllImages = async () => {
      // S'assurer que le tableau d'images est vide avant de commencer
      setLoadedImages([]);
      
      const validImages: string[] = [];
      
      for (const imageSrc of evenement.images) {
        try {
          const loadedSrc = await preloadImage(imageSrc);
          validImages.push(loadedSrc);
          // Au lieu d'ajouter à l'état précédent, nous remplaçons complètement l'état à chaque fois
          // pour éviter les doublons lors des re-renders
        } catch (error) {
          console.error(`Impossible de charger l'image: ${imageSrc}`);
        }
      }

      if (validImages.length === 0) {
        setErrorMessage("Aucune image n'a pu être chargée pour cet événement.");
      }
      
      // Mettre à jour les images en une seule fois avec un tableau complet
      setLoadedImages(validImages);
      setIsLoading(false);
      // Assurons-nous que les animations sont activées une fois les images chargées
      setShouldStartAnimations(true);
      // Marquer le chargement initial comme terminé
      initialLoadDone.current = true;
    };

    preloadAllImages();
  }, [evenement]);

  const toggleImageSelection = (imageSrc: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageSrc)) {
      newSelection.delete(imageSrc);
    } else {
      newSelection.add(imageSrc);
    }
    setSelectedImages(newSelection);
  };

  return (
    <div className="container">
      <div className="event-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="title-container relative overflow-hidden"
        >
          <motion.h2
            className="evenement-page-title underline-title"
            initial={{ opacity: 0 }}
            animate={shouldStartAnimations ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link href="/evenements">Événements</Link> / {evenement.titre}
          </motion.h2>
        </motion.div>
      </div>

      {evenement.type === 'selection' && (
        <motion.div 
          className="photo-selection-info"
          initial={{ opacity: 0, y: 20 }}
          animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div className="info-text">
            Sélectionnez vos photos préférées ({evenement.prixParPhoto}€ par photo), puis procédez au paiement pour pouvoir les télécharger.
          </div>
        </motion.div>
      )}

      <motion.div 
        className="selection-counter"
        initial={{ opacity: 0, y: 20 }}
        animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="counter-text">
          {selectedImages.size} / {loadedImages.length} Sélectionné(s)
        </div>
        <button 
          className="payment-button" 
          disabled={selectedImages.size === 0}
          onClick={() => alert('Redirection vers la page de paiement...')}
        >
          procéder au paiement
        </button>
      </motion.div>

      {isLoading ? (
        <motion.div 
          className="photos-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="loader-spinner"></div>
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              Chargement des images: {loadingProgress}% ({loadedImages.length}/{evenement.images.length})
            </div>
          </div>
        </motion.div>
      ) : errorMessage ? (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{errorMessage}</p>
        </motion.div>
      ) : (
        <motion.div 
          className="photos-grid"
          initial={{ opacity: 1 }}
          animate={shouldStartAnimations ? "visible" : { opacity: 1 }}
          variants={staggerContainer}
        >
          {loadedImages.map((imageSrc, index) => (
            <motion.div 
              key={index} 
              className={`photo-item ${selectedImages.has(imageSrc) ? 'selected' : ''}`}
              onClick={() => toggleImageSelection(imageSrc)}
              variants={fadeInUp}
              initial={{ opacity: 1, y: 0 }}
              animate={shouldStartAnimations ? undefined : { opacity: 1, y: 0 }}
              custom={index}
            >
              <Image 
                src={imageSrc} 
                alt={`Photo ${index + 1} - ${evenement.titre}`} 
                className="photo-image"
                width={400}
                height={400}
              />
              <div className="photo-overlay">
                <div className={`selection-checkbox ${selectedImages.has(imageSrc) ? 'checked' : ''}`}></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
} 