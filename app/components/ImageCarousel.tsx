import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ImageCarouselProps { 
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  selectedImages: Set<string>;
  toggleImageSelection: (imageSrc: string) => void;
}

const ImageCarousel = ({ 
  images, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev,
  selectedImages,
  toggleImageSelection
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
        <button 
          className={`carousel-btn select-btn ${selectedImages.has(currentImageSrc) ? 'selected' : ''}`}
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
              <span className="select-label">Sélectionnée</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="select-label">Sélectionner</span>
            </>
          )}
        </button>
        <button 
          className="carousel-btn close-btn"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <button 
        className="carousel-btn prev-btn"
        onClick={onPrev}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div 
        ref={swipeRef} 
        className="relative w-full h-full flex items-center justify-center p-4"
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
          <div className="carousel-image-container">
            <Image 
              src={currentImageSrc}
              alt={`Photo ${currentIndex + 1}`}
              className="carousel-image"
              width={1200}
              height={800}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          </div>
        </motion.div>
      </div>
      
      <button 
        className="carousel-btn next-btn"
        onClick={onNext}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <motion.div 
          className="bg-black/50 backdrop-filter backdrop-blur-md px-6 py-2 rounded-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <span className="text-white text-sm">{currentIndex + 1} / {images.length}</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ImageCarousel; 