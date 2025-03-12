'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Evenement, getImagesForEvent } from '../../data/evenementsData';

interface ClientEventPageProps {
  evenement: Evenement;
}

export default function ClientEventPage({ evenement }: ClientEventPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [eventImages, setEventImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadImages() {
      try {
        setIsLoading(true);
        // Utiliser la fonction asynchrone pour récupérer les images
        const images = await getImagesForEvent(evenement.dossierImages);
        setEventImages(images);
      } catch (error) {
        console.error('Erreur lors du chargement des images:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadImages();
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
          {selectedImages.size} / {eventImages.length} Sélectionné(s)
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
        </div>
      ) : (
        <div className="photos-grid">
          {eventImages.map((imageSrc, index) => (
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