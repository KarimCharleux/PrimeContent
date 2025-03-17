'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Evenement } from '../../data/evenementsData';

interface EventPageProps {
  readonly evenement: Evenement;
}

export default function EventPage({ evenement }: EventPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Réinitialiser l'état lors du changement d'événement
    setIsLoading(true);
    setLoadedImages([]);
    setLoadingProgress(0);
    setSelectedImages(new Set());
    setErrorMessage(null);

    // Vérifier si l'événement a des images
    if (!evenement.images || evenement.images.length === 0) {
      setErrorMessage("Aucune image n'a été trouvée pour cet événement.");
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
      const validImages: string[] = [];
      
      for (const imageSrc of evenement.images) {
        try {
          const loadedSrc = await preloadImage(imageSrc);
          validImages.push(loadedSrc);
          setLoadedImages(prev => [...prev, loadedSrc]);
        } catch (error) {
          console.error(`Impossible de charger l'image: ${imageSrc}`);
        }
      }

      if (validImages.length === 0) {
        setErrorMessage("Aucune image n'a pu être chargée pour cet événement.");
      }
      
      setIsLoading(false);
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
        <div className="event-breadcrumb">
          <Link href="/evenements">Événements</Link>
          <span className="separator">/</span>
          <span>{evenement.titre}</span>
        </div>
        <h1 className="event-title">{evenement.titre}</h1>
      </div>

      {evenement.type === 'selection' && (
        <div className="photo-selection-info">
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
        </div>
      )}

      <div className="selection-counter">
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
      </div>

      {isLoading ? (
        <div className="photos-loader">
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
        </div>
      ) : errorMessage ? (
        <div className="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{errorMessage}</p>
        </div>
      ) : (
        <div className="photos-grid">
          {loadedImages.map((imageSrc, index) => (
            <div 
              key={index} 
              className={`photo-item ${selectedImages.has(imageSrc) ? 'selected' : ''}`}
              onClick={() => toggleImageSelection(imageSrc)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 