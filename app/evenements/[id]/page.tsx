'use client';

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { db } from '../../backoffice/lib/firebase-client';
import { Evenement, EventImage } from '../../backoffice/models/eventTypes';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import PasswordProtection from '../../components/PasswordProtection';

import './eventDetail.scss';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [evenement, setEvenement] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
  const [selectedImages, setSelectedImages] = useState<EventImage[]>([]);
  const [allImages, setAllImages] = useState<EventImage[]>([]);

  useEffect(() => {
    const fetchEvenement = async () => {
      try {
        setLoading(true);
        setError(null);

        const eventRef = doc(db, 'evenements', params.id);
        const eventDoc = await getDoc(eventRef);

        if (eventDoc.exists()) {
          const eventData = {
            id: eventDoc.id,
            ...eventDoc.data()
          } as Evenement;
          
          setEvenement(eventData);
          
          // Si l'événement n'est pas protégé par mot de passe, authentifier automatiquement
          if (!eventData.protectionMotDePasse?.actif) {
            setIsAuthenticated(true);
          }
          
          // Filtrer les images sélectionnées si nécessaire
          if (eventData.images && eventData.images.length > 0) {
            const filteredImages = eventData.type === 'selection' 
              ? eventData.images.filter(img => img.selected)
              : eventData.images;
              
            setSelectedImages(filteredImages);
            setAllImages(eventData.images);
          }
        } else {
          setError("Cet événement n'existe pas ou a été supprimé.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'événement:", error);
        setError("Impossible de charger cet événement. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvenement();
    
    // Activer les animations après un court délai
    setTimeout(() => {
      setShouldStartAnimations(true);
    }, 100);
  }, [params.id]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (error) {
      return dateString;
    }
  };

  const handlePasswordVerified = () => {
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <main className="global-main-page">
        <Header />
        <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
        <Footer hideCTA={true} />
      </main>
    );
  }

  if (error || !evenement) {
    return (
      <main className="global-main-page">
        <Header />
        <div className="container mx-auto px-4 py-16 min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Événement non trouvé</h1>
            <p className="text-gray-600 mb-8">{error || "Cet événement n'existe pas ou a été supprimé."}</p>
            <button
              onClick={() => router.push('/evenements')}
              className="px-6 py-2 bg-black text-white rounded-md hover:bg-black/80"
            >
              Retour à la liste des événements
            </button>
          </div>
        </div>
        <Footer hideCTA={true} />
      </main>
    );
  }

  // Afficher la protection par mot de passe si nécessaire
  if (!isAuthenticated && evenement.protectionMotDePasse?.actif) {
    return (
      <main className="global-main-page">
        <Header />
        <div className="container mx-auto px-4 py-16 min-h-screen">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">{evenement.titre}</h1>
              <p className="text-gray-600">
                {formatDate(evenement.date)}
                {evenement.date && evenement.lieu && ' - '}
                {evenement.lieu}
              </p>
            </div>
            
            <PasswordProtection 
              correctPassword={evenement.protectionMotDePasse.motDePasse} 
              onPasswordVerified={handlePasswordVerified}
              eventTitle={evenement.titre}
            />
          </div>
        </div>
        <Footer hideCTA={true} />
      </main>
    );
  }

  return (
    <main className="global-main-page">
      <Header />

      <section className="py-12">
        <div className="container">
          {/* En-tête de l'événement */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="event-header mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{evenement.titre}</h1>
            <div className="flex flex-wrap items-center text-gray-600 mb-4">
              <div className="flex items-center mr-6 mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(evenement.date)}</span>
              </div>
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{evenement.lieu || 'Non spécifié'}</span>
              </div>
            </div>
            
            {evenement.categorie && (
              <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm mb-6">
                {evenement.categorie}
              </div>
            )}
            
            {evenement.description && (
              <div className="prose max-w-none mb-8">
                <p>{evenement.description}</p>
              </div>
            )}
          </motion.div>

          {/* Bannière d'information selon le type d'événement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            {evenement.type === 'selection' && (
              <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-pink-800">Mode sélection</h3>
                    <div className="mt-1 text-sm text-pink-700">
                      <p>Sélectionnez et achetez vos photos préférées. Prix: {evenement.prixParPhoto}€ par photo</p>
                      {evenement.tarifDegressif && evenement.tarifDegressif.length > 0 && (
                        <div className="mt-1">
                          <p className="font-medium">Tarifs dégressifs:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {evenement.tarifDegressif.map((tarif, index) => (
                              <li key={index}>À partir de {tarif.quantite} photos: {tarif.pourcentageRemise}% de remise</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {evenement.type === 'visionner' && (
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-indigo-800">Mode visionnage</h3>
                    <div className="mt-1 text-sm text-indigo-700">
                      <p>Vous pouvez visualiser toutes les photos de cet événement.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {evenement.type === 'paye' && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Photos déjà payées</h3>
                    <div className="mt-1 text-sm text-amber-700">
                      <p>Vous avez accès au téléchargement de toutes les photos.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {evenement.type === 'non_paye' && (
              <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm2.45 4.5a1.5 1.5 0 10-2.9 0l1.45 3.45 1.45-3.45z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-teal-800">Accès aux photos</h3>
                    <div className="mt-1 text-sm text-teal-700">
                      <p>Contactez le photographe pour accéder au téléchargement des photos.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Galerie d'images */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={shouldStartAnimations ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold mb-6">
              {evenement.type === 'selection' ? 'Photos sélectionnées' : 'Galerie'}
            </h2>
            
            {selectedImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    className="relative aspect-square overflow-hidden rounded-lg shadow-md group"
                  >
                    <Image
                      src={image.path}
                      alt={`Image ${index + 1} - ${evenement.titre}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {evenement.type === 'selection' && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-100 transition transform hover:scale-105">
                          Sélectionner
                        </button>
                      </div>
                    )}
                    
                    {(evenement.type === 'paye' || evenement.type === 'non_paye') && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-100 transition transform hover:scale-105">
                          Télécharger
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">
                  Aucune photo n'est disponible pour cet événement.
                </p>
          </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
} 