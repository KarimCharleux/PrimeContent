'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

import { Evenement, EventMediaItem } from '@/app/backoffice/models/eventTypes';

import ImageCarousel from '../../components/ImageCarousel/ImageCarousel';
import PortfolioGrid from '../../components/PortfolioGrid/PortfolioGrid';
import PrimaryButton from '../../components/PrimaryButton';

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
  const [loadedMedia, setLoadedMedia] = useState<EventMediaItem[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
  // Utiliser une ref pour suivre si le chargement initial a été fait
  const initialLoadDone = useRef(false);
  
  // État pour le carrousel
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Calculer le prix total en fonction des sélections et des remises
  const calculateTotalPrice = () => {
    if (evenement.type === 'selection' && evenement.prixParPhoto) {
      const selectedCount = selectedItems.size;
      let remisePercent = 0;
      
      // Vérifier si des remises par quantité existent
      if (evenement.tarifDegressif && evenement.tarifDegressif.length > 0) {
        // Trier les tarifs dégressifs par quantité décroissante
        const sortedTarifs = [...evenement.tarifDegressif].sort((a, b) => b.quantite - a.quantite);
        
        // Trouver la remise applicable
        for (const tarif of sortedTarifs) {
          if (selectedCount >= tarif.quantite) {
            remisePercent = tarif.pourcentageRemise;
            break;
          }
        }
      }
      
      const basePrice = selectedCount * evenement.prixParPhoto;
      const discount = basePrice * (remisePercent / 100);
      return basePrice - discount;
    }
    return 0;
  };

  useEffect(() => {
    // Réinitialiser l'état lors du changement d'événement
    setIsLoading(true);
    setLoadedMedia([]);
    setLoadingProgress(0);
    setSelectedItems(new Set());
    setErrorMessage(null);
    // Réinitialiser le flag de chargement initial
    initialLoadDone.current = false;

    // Activer les animations
    setTimeout(() => {
      setShouldStartAnimations(true);
    }, 100);

    // Vérifier si l'événement a des médias
    if (!evenement.images || evenement.images.length === 0) {
      setErrorMessage("Aucun média n'a été trouvé pour cet événement.");
      setIsLoading(false);
      return;
    }

    // Si le chargement initial a déjà été fait, ne pas continuer
    if (initialLoadDone.current) {
      setIsLoading(false);
      return;
    }

    // Précharger les médias pour suivre la progression
    const totalMedia = evenement.images?.length || 0;
    let loadedCount = 0;

    // Fonction pour précharger une image
    const preloadImage = (mediaItem: EventMediaItem) => {
      return new Promise<EventMediaItem>((resolve, reject) => {
        const img = new window.Image();
        img.src = mediaItem.path;
        img.onload = () => {
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / totalMedia) * 100));
          resolve(mediaItem);
        };
        img.onerror = () => reject(mediaItem);
      });
    };

    // Précharger tous les médias
    const preloadAllMedia = async () => {
      // S'assurer que le tableau de médias est vide avant de commencer
      setLoadedMedia([]);
      
      const validMedia: EventMediaItem[] = [];
      
      if (evenement.images && evenement.images.length > 0) {
        for (const media of evenement.images) {
          try {
            if (media.path) {
              if (media.isVideo) {
                // Pour les vidéos, nous ne préchargeons pas, nous les ajoutons directement
                validMedia.push(media);
                loadedCount++;
                setLoadingProgress(Math.round((loadedCount / totalMedia) * 100));
              } else {
                // Pour les images, nous les préchargeons
                const loadedMedia = await preloadImage(media);
                validMedia.push(loadedMedia);
              }
            }
          } catch (error) {
            console.error(`Impossible de charger le média: ${media.path}`);
          }
        }
      }

      if (validMedia.length === 0) {
        setErrorMessage("Aucun média n'a pu être chargé pour cet événement.");
      }
      
      // Mettre à jour les médias en une seule fois avec un tableau complet
      setLoadedMedia(validMedia);
      setIsLoading(false);
      // Assurons-nous que les animations sont activées une fois les médias chargés
      setShouldStartAnimations(true);
      // Marquer le chargement initial comme terminé
      initialLoadDone.current = true;
    };

    preloadAllMedia();
  }, [evenement]);

  // Gestion de la sélection d'items
  const handleSelectionChange = (newSelection: Set<string>) => {
    setSelectedItems(newSelection);
  };

  // Gérer le paiement des photos sélectionnées
  const handlePaySelectedPhotos = () => {
    // Vérifier si des photos sont sélectionnées
    if (selectedItems.size === 0) {
      alert('Veuillez sélectionner au moins une photo.');
      return;
    }
    alert(`Redirection vers la page de paiement pour ${selectedItems.size} photos (Total: ${calculateTotalPrice().toFixed(2)}€)...`);
  };

  // Gérer le téléchargement de toutes les photos
  const handleDownloadAllPhotos = () => {
    alert('Téléchargement de toutes les photos...');
  };

  // Gérer le paiement pour télécharger toutes les photos
  const handlePayForAllPhotos = () => {
    alert(`Redirection vers la page de paiement pour toutes les photos (${evenement.prixParPhoto}€)...`);
  };

  // Fonction pour rendre le bouton approprié selon le type d'événement
  const renderActionButton = () => {
    switch (evenement.type) {
      case 'selection':
        return selectedItems.size > 0 ? (
          <PrimaryButton 
            text={`Payer mes medias (${calculateTotalPrice().toFixed(2)}€)`}
            onClick={handlePaySelectedPhotos}
            animateOnMount={true}
            delay={0.5}
          />
        ) : null;
      case 'paye':
        return (
          <PrimaryButton 
            text="Télécharger toutes mes medias"
            onClick={handleDownloadAllPhotos}
            animateOnMount={true}
            delay={0.5}
          />
        );
      case 'non_paye':
        return (
          <PrimaryButton 
            text={`Payer toutes les medias (${evenement.prixParPhoto}€)`}
            onClick={handlePayForAllPhotos}
            animateOnMount={true}
            delay={0.5}
          />
        );
      default:
        return null;
    }
  };

  // Fonction pour afficher les infos sur les remises (pour le mode sélection)
  const renderDiscountInfo = () => {
    if (evenement.type !== 'selection' || !evenement.tarifDegressif || evenement.tarifDegressif.length === 0) {
      return null;
    }

    // Trier les tarifs par quantité croissante
    const sortedTarifs = [...evenement.tarifDegressif].sort((a, b) => a.quantite - b.quantite);
    
    return (
      <motion.div 
        className="discount-info"
        initial={{ opacity: 0, y: 20 }}
        animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        <div className="info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
          </svg>
        </div>
        <div className="info-text">
          <strong>Remises disponibles :</strong>
          <ul className="discount-list">
            {sortedTarifs.map((tarif, index) => (
              <li key={index}>{tarif.quantite}+ photos : {tarif.pourcentageRemise}% de remise</li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  };

  // Convertir les médias EventMediaItem en format Project pour PortfolioGrid
  const convertMediaToProjects = () => {
    return loadedMedia.map(media => ({
      title: media.title || '',
      category: media.category || 'Photo',
      source: media.path,
      isVideo: media.isVideo,
      format: media.format,
      thumbnail: media.thumbnail
    }));
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

        {/* Description de l'événement si elle existe */}
        {evenement.description && (
          <motion.div 
            className="w-full flex justify-center text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <p>{evenement.description}</p>
          </motion.div>
        )}
      </div>

      

      {/* Informations selon le type d'événement */}
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

      {/* Informations sur les remises (mode sélection uniquement) */}
      {renderDiscountInfo()}

      {/* Compteur de sélection et bouton d'action */}
      <motion.div 
        className="pb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {evenement.type === 'selection' && selectedItems.size > 0 && (
          <div className="counter-text">
            {selectedItems.size} photos sélectionnées
            {evenement.tarifDegressif && evenement.tarifDegressif.length > 0 && (
              <span className="price-text">
                Total: {calculateTotalPrice().toFixed(2)}€
              </span>
            )}
          </div>
        )}
        <div className='w-full flex justify-center'>
          {renderActionButton()}
        </div>
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
              Chargement des médias: {loadingProgress}% ({loadedMedia.length}/{evenement.images.length})
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <PortfolioGrid 
            projects={convertMediaToProjects()}
            showFilter={false}
            selectionEnabled={evenement.type === 'selection'}
            selectedItems={selectedItems}
            onSelectionChange={handleSelectionChange}
            selectionLabel="Sélectionner cette photo"
          />
        </motion.div>
      )}
    </div>
  );
} 