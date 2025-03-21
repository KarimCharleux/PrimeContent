import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './ImageCarousel.module.css';

interface ImageCarouselProps { 
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  // Rendre la sélection optionnelle
  selectionEnabled?: boolean;
  selectedImages?: Set<string>;
  toggleImageSelection?: (imageSrc: string) => void;
  // Ajout de props optionnelles pour personnaliser le carrousel
  showCounter?: boolean;
  imageQuality?: number;
}

const ImageCarousel = ({ 
  images, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev,
  selectionEnabled = false,
  selectedImages = new Set(),
  toggleImageSelection = () => {},
  showCounter = true,
  imageQuality = 80
}: ImageCarouselProps) => {
  // Référence pour détecter les swipes
  const swipeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentImageSrc = images[currentIndex];
  
  // Gérer les événements touch pour le swipe
  useEffect(() => {
    const element = swipeRef.current;
    if (!element) return;
    
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
  }, [onNext, onPrev]);
  
  // Gérer les touches clavier pour la navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  // Styles pour les boutons du carrousel
  const carouselButtonClass = "bg-[rgba(30,30,30,0.6)] text-white border-none rounded-full min-w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out z-10 px-4 backdrop-blur-[4px] shadow-md hover:bg-[rgba(60,60,60,0.8)] hover:scale-105 hover:shadow-lg";
  const navButtonClass = `${carouselButtonClass} absolute top-1/2 -translate-y-1/2 w-[50px] h-[50px] p-0 md:w-[50px] md:h-[50px]`;
  
  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center"
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
            className={`${carouselButtonClass} ${styles.carouselButton} ${
              selectedImages.has(currentImageSrc) 
                ? 'bg-[rgba(60,60,60,0.8)] border border-[rgba(255,255,255,0.6)]' 
                : 'bg-[rgba(40,40,40,0.7)] border border-[rgba(255,255,255,0.3)]'
            } backdrop-blur-[8px]`}
            onClick={(e) => {
              e.stopPropagation();
              toggleImageSelection(currentImageSrc);
            }}
          >
            {selectedImages.has(currentImageSrc) ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-sm hidden md:inline">Sélectionnée</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="ml-2 text-sm hidden md:inline">Sélectionner</span>
              </>
            )}
          </button>
        )}
        <button 
          className={`${carouselButtonClass} ${styles.carouselButton}`}
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <button 
        className={`${navButtonClass} ${styles.carouselButton} left-4`}
        onClick={onPrev}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div 
        ref={swipeRef} 
        className={`relative w-full h-full flex items-center justify-center p-4 ${styles.carouselContainer}`}
        onClick={onClose}
      >
        <motion.div 
          className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
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
            <Image 
              src={currentImageSrc}
              alt={`Photo ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain shadow-xl rounded"
              width={1200}
              height={800}
              priority
              quality={imageQuality}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          </div>
        </motion.div>
      </div>
      
      <button 
        className={`${navButtonClass} ${styles.carouselButton} right-4`}
        onClick={onNext}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      {showCounter && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <motion.div 
            className="bg-black/50 backdrop-blur-md px-6 py-2 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <span className="text-white text-sm">{currentIndex + 1} / {images.length}</span>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ImageCarousel; 