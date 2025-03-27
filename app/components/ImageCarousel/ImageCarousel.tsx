import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';

import styles from './ImageCarousel.module.scss';

interface MediaItem {
  src: string;
  isVideo?: boolean;
}

interface ImageCarouselProps { 
  media: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  // Rendre la sélection optionnelle
  selectionEnabled?: boolean;
  selectedItems?: Set<string>;
  toggleItemSelection?: (itemSrc: string) => void;
  // Ajout de props optionnelles pour personnaliser le carrousel
  showCounter?: boolean;
}

const ImageCarousel = ({ 
  media, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev,
  selectionEnabled = false,
  selectedItems = new Set(),
  toggleItemSelection = () => {},
  showCounter = true,
}: ImageCarouselProps) => {
  // Référence pour détecter les swipes
  const swipeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentItem = media[currentIndex];
  
  // États pour contrôler la vidéo
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  
  // Vérifier s'il y a plus d'un élément
  const hasMultipleItems = media.length > 1;
  const isVideo = currentItem?.isVideo;
  
  // Fonctions de contrôle vidéo
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => console.error("Erreur de lecture vidéo:", err));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);
  
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  }, [isMuted]);
  
  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Erreur lors de la sortie du plein écran:", err));
    } else {
      videoRef.current.requestFullscreen().catch(err => console.error("Erreur lors du passage en plein écran:", err));
    }
  }, []);
  
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setVideoProgress(progress);
  };
  
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = position * videoRef.current.duration;
  };
  
  // Formater le temps de la vidéo (secondes -> MM:SS)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Réinitialiser les états vidéo lors du changement d'élément
  useEffect(() => {
    setIsPlaying(false);
    
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setVideoDuration(videoRef.current.duration || 0);
    }
  }, [currentIndex]);
  
  // Charger la durée vidéo une fois que les métadonnées sont disponibles
  useEffect(() => {
    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setVideoDuration(videoRef.current.duration);
      }
    };
    
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    }
    
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, [currentItem]);
  
  // Gérer les événements touch pour le swipe
  useEffect(() => {
    const element = swipeRef.current;
    if (!element || !hasMultipleItems) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const diffX = e.changedTouches[0].clientX - startXRef.current;
      if (diffX > 50) { // Swipe droite
        onPrev();
      } else if (diffX < -50) { // Swipe gauche
        onNext();
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onNext, onPrev, hasMultipleItems]);
  
  // Gérer les touches clavier pour la navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (hasMultipleItems) {
        if (e.key === 'ArrowRight') onNext();
        if (e.key === 'ArrowLeft') onPrev();
      }
      if (isVideo) {
        if (e.key === ' ' || e.key === 'k') {
          e.preventDefault();
          togglePlay();
        }
        if (e.key === 'm') {
          toggleMute();
        }
        if (e.key === 'f') {
          toggleFullscreen();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasMultipleItems, isVideo, togglePlay, toggleMute, toggleFullscreen]);

  return (
    <motion.div 
      className={styles.carousel}
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ 
        duration: 0.4,
        backdropFilter: { delay: 0.1, duration: 0.5 }
      }}
    >
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-4">
        {selectionEnabled && (
          <button 
            className={`${styles['select-button']} ${
              selectedItems.has(currentItem.src) ? styles['selected'] : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleItemSelection(currentItem.src);
            }}
          >
            {selectedItems.has(currentItem.src) ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className={styles['select-label']}>Sélectionnée</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className={styles['select-label']}>Sélectionner</span>
              </>
            )}
          </button>
        )}
        <button 
          className={styles['carousel-button']}
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {hasMultipleItems && (
        <button 
          className={`${styles['nav-button']} ${styles['prev']}`}
          onClick={onPrev}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      <div 
        ref={swipeRef} 
        className={styles['carousel-container']}
        onClick={isVideo ? undefined : onClose}
      >
        <motion.div 
          className="relative max-w-full max-h-[90vh] w-full h-full flex items-center justify-center"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            delay: 0.15
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {isVideo ? (
              <div className={styles['video-wrapper']}>
                <video
                  ref={videoRef}
                  src={currentItem.src}
                  className={styles['carousel-video']}
                  onClick={togglePlay}
                  onTimeUpdate={handleTimeUpdate}
                  loop
                  muted={isMuted}
                  playsInline
                />
                
                {/* Contrôles vidéo */}
                <div className={styles['video-controls']}>
                  {/* Barre de progression */}
                  <div 
                    className={styles['progress-bar']} 
                    onClick={handleProgressBarClick}
                  >
                    <div 
                      className={styles['progress-fill']}
                      style={{ width: `${videoProgress}%` }}
                    ></div>
                  </div>
                  
                  <div className={styles['controls-row']}>
                    {/* Bouton lecture/pause */}
                    <button 
                      className={styles['control-button']}
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Affichage du temps */}
                    <div className={styles['time-display']}>
                      {videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'} / {formatTime(videoDuration)}
                    </div>
                    
                    <div className="flex-grow"></div>
                    
                    {/* Bouton mute/unmute */}
                    <button 
                      className={styles['control-button']}
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Bouton plein écran */}
                    <button 
                      className={styles['control-button']}
                      onClick={toggleFullscreen}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Image 
                src={currentItem.src}
                alt={`Média ${currentIndex + 1}`}
                className={styles['carousel-image']}
                width={1200}
                height={800}
                priority
                quality={100}
                sizes="100vw"
              />
            )}
          </div>
        </motion.div>
      </div>
      
      {hasMultipleItems && (
        <button 
          className={`${styles['nav-button']} ${styles['next']}`}
          onClick={onNext}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      
      {showCounter && hasMultipleItems && (
        <div className={styles['counter']}>
          <motion.div 
            className={styles['counter-badge']}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <span>{currentIndex + 1} / {media.length}</span>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ImageCarousel; 