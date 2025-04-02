'use client';

import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { db } from '../../backoffice/lib/firebase-client';
import { Evenement } from '../../backoffice/models/eventTypes';

import EventPage from './EventPage';

interface EventDetailClientProps {
  readonly eventId: string;
}

export default function EventDetailClient({ eventId }: EventDetailClientProps) {
  const router = useRouter();
  const [evenement, setEvenement] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEvenement = async () => {
      try {
        setLoading(true);
        
        const eventRef = doc(db, 'evenements', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const eventData = { 
            id: eventDoc.id,
            ...eventDoc.data() 
          } as Evenement;
          
          // Vérifier si l'événement est visible
          if (!eventData.visible) {
            setError("Cet événement n'est pas disponible.");
            setLoading(false);
            return;
          }
          
          setEvenement(eventData);
          
          // Vérifier si l'événement est protégé par mot de passe
          if (eventData.protectionMotDePasse?.actif) {
            setShowPasswordModal(true);
          }
        } else {
          setError("Événement non trouvé");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'événement:", error);
        setError("Une erreur est survenue lors du chargement de l'événement");
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvenement();
  }, [eventId]);
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!evenement || !evenement.protectionMotDePasse) return;
    
    if (password === evenement.protectionMotDePasse.motDePasse) {
      setShowPasswordModal(false);
      setPasswordError(null);
    } else {
      setPasswordError("Mot de passe incorrect");
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="photos-loader">
          <div className="loader-spinner"></div>
          <div className="loading-text">Chargement de l&apos;événement...</div>
        </div>
      </div>
    );
  }

  if (error || !evenement) {
    return (
      <section className="px-4 py-12">
        <div className="container">
          <div className="error-container">
            <div className="error-message">{error || "Événement non trouvé"}</div>
            <button onClick={() => router.push('/evenements')} className="back-button">
              Retour aux événements
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {showPasswordModal ? (
        <div className="password-modal-container">
          <div className="password-modal">
            <h2 className="modal-title">Événement protégé</h2>
            <p className="modal-description">
              Cet événement est protégé par un mot de passe. Veuillez saisir le mot de passe pour continuer.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="password-input"
              />
              
              {passwordError && (
                <div className="password-error">{passwordError}</div>
              )}
              
              <button type="submit" className="password-submit">
                Accéder aux photos
              </button>
            </form>
          </div>
        </div>
      ) : (
        <EventPage evenement={evenement} key={`event-${evenement.id}`} />
      )}
    </>
  );
} 