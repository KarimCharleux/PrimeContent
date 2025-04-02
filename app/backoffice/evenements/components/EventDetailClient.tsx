'use client';

import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Spinner } from '../../components/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase-client';
import { Evenement } from '../../models/eventTypes';

import EventMediaManager, { MediaStats } from './EventMediaManager';

interface EventDetailClientProps {
  readonly eventId: string;
}

export default function EventDetailClient({ eventId }: EventDetailClientProps): JSX.Element {
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const [evenement, setEvenement] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mediaStats, setMediaStats] = useState({
    totalMedias: 0,
    totalImages: 0,
    totalVideos: 0,
    totalSize: 0,
    imagesSize: 0,
    videosSize: 0,
    averageLoadTime: 0,
  });
  
  // Fonction pour formater la taille en ko, Mo ou Go
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + ' octets';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' Ko';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
    }
  };

  // Fonction pour formater le temps de chargement
  const formatLoadTime = (ms: number): string => {
    if (ms < 1000) {
      return ms.toFixed(0) + ' ms';
    } else {
      return (ms / 1000).toFixed(2) + ' s';
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        
        if (!eventId || eventId === 'invalid' || eventId === 'placeholder') {
          setStatusMessage({
            type: 'error',
            message: "ID d'événement invalide ou manquant"
          });
          setTimeout(() => router.push('/backoffice/evenements'), 2000);
          return;
        }
        
        const eventRef = doc(db, 'evenements', eventId);
        const eventDoc = await getDoc(eventRef);

        if (eventDoc.exists()) {
          setEvenement({
            id: eventDoc.id,
            ...eventDoc.data()
          } as Evenement);
        } else {
          setStatusMessage({
            type: 'error',
            message: "Cet événement n'existe pas"
          });
          // Rediriger vers la liste après un court délai
          setTimeout(() => router.push('/backoffice/evenements'), 2000);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'événement:", error);
        setStatusMessage({
          type: 'error',
          message: "Erreur lors de la récupération de l'événement"
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchEvent();
    }
  }, [eventId, authLoading, router]);

  const handleStatusChange = (status: { type: 'success' | 'error'; message: string } | null) => {
    setStatusMessage(status);
    
    // Effacer le message après 5 secondes
    if (status) {
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleMediaStatsChange = (stats: MediaStats) => {
    setMediaStats({
      totalMedias: stats.totalCount,
      totalImages: stats.imageCount,
      totalVideos: stats.videoCount,
      totalSize: stats.totalSize,
      imagesSize: stats.imagesSize,
      videosSize: stats.videosSize,
      averageLoadTime: stats.averageLoadTime
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!evenement) {
    return (
      <div className="container mx-auto px-4 py-8">
        {statusMessage && (
          <div className={`mb-4 p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {statusMessage.message}
          </div>
        )}
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Chargement de l&apos;événement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/backoffice/evenements" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la liste
          </Link>
          <h1 className="text-2xl font-bold mb-2">{evenement.titre}</h1>
          <p className="text-gray-600">
            {evenement.date}
            {evenement.date && evenement.lieu && ' - '}
            {evenement.lieu}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link 
            href={`/evenements/${eventId}`} 
            target="_blank"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Voir la page publique
          </Link>
        </div>
      </div>
      
      {/* Messages d'état */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {statusMessage.message}
        </div>
      )}
      
      {/* Informations sur l'événement */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Informations de l&apos;événement</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-md font-medium mb-2">Détails généraux</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-3">
                <p className="text-sm text-gray-500">Titre</p>
                <p className="font-medium">{evenement.titre}</p>
              </div>
              <div className="mb-3">
                <p className="text-sm text-gray-500">Catégorie</p>
                <p className="font-medium">{evenement.categorie || 'Non spécifiée'}</p>
              </div>
              <div className="mb-3">
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{evenement.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Lieu</p>
                <p className="font-medium">{evenement.lieu || 'Non spécifié'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">Configuration</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-3">
                <p className="text-sm text-gray-500">Type d&apos;événement</p>
                <div className="mt-1">
                  {(() => {
                    switch (evenement.type) {
                      case 'visionner':
                        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Visionnage</span>;
                      case 'selection':
                        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">Sélection</span>;
                      case 'paye':
                        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Déjà payé</span>;
                      case 'non_paye':
                        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">Non payé</span>;
                      default:
                        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{evenement.type}</span>;
                    }
                  })()}
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm text-gray-500">Visibilité</p>
                <p className="font-medium flex items-center mt-1">
                  {evenement.visible ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Visible
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      Masqué
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Protection</p>
                <p className="font-medium flex items-center mt-1">
                  {evenement.protectionMotDePasse?.actif ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Protégé par mot de passe
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Non protégé
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">Statistiques</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              
              {/* Détails des statistiques des médias */}
            <div className="mb-3 bg-blue-50 p-2 rounded">
                <p className="text-xs text-blue-600 font-medium">Nombre de médias</p>
                <p className="text-sm font-bold">{mediaStats.totalMedias} ({mediaStats.totalImages} images • {mediaStats.totalVideos} vidéos)</p>
            </div>
            <div className="mb-3 bg-green-50 p-2 rounded">
                <p className="text-xs text-green-600 font-medium">Taille totale</p>
                <p className="text-sm font-bold">{formatSize(mediaStats.totalSize)}</p>
                <p className="text-xs text-gray-500">Images: {formatSize(mediaStats.imagesSize)} • Vidéos: {formatSize(mediaStats.videosSize)}</p>
            </div>
            <div className="bg-purple-50 p-2 rounded">
                <p className="text-xs text-purple-600 font-medium">Temps de chargement moyen</p>
                <p className="text-sm font-bold">{formatLoadTime(mediaStats.averageLoadTime)}</p>
                <p className="text-xs text-gray-500">Connexion 15 Mbps</p>
            </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Link 
            href="/backoffice/evenements"
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier l&apos;événement
          </Link>
        </div>
      </div>
      
      {/* Gestionnaire de médias */}
      <EventMediaManager 
        evenement={evenement} 
        onStatusChange={handleStatusChange}
        onStatsChange={handleMediaStatsChange}
      />
    </div>
  );
}