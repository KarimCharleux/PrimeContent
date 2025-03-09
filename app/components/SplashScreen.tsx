'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useImageStore } from '../store/imageStore';

interface SplashScreenProps {
  readonly onLoadingComplete: () => void;
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const fullText = 'PRIMECONTENT';
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [phase, setPhase] = useState<'typing' | 'loading'>('typing');
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [zoomPosition, setZoomPosition] = useState({ x: -1400, scale: 110 });
  const setPreloadedImages = useImageStore(state => state.setPreloadedImages);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Effet pour ajuster la position du zoom en fonction de la taille de l'écran
  useEffect(() => {
    const updateZoomPosition = () => {
      const width = window.innerWidth;
      if (width <= 480) { // Mobile
        setZoomPosition({ x: -600, scale: 80 });
      } else if (width <= 768) { // Tablet
        setZoomPosition({ x: -650, scale: 90 });
      } else if (width <= 1024) { // Small laptop
        setZoomPosition({ x: -1200, scale: 100 });
      } else { // Desktop
        setZoomPosition({ x: -1600, scale: 110 });
      }
    };

    updateZoomPosition();
    window.addEventListener('resize', updateZoomPosition);
    return () => window.removeEventListener('resize', updateZoomPosition);
  }, []);

  // Effet de chargement des images
  useEffect(() => {
    const preloadImages = async () => {
      try {
        // Récupérer la liste des images depuis l'API
        const response = await fetch('/api/gallery-images');
        const data = await response.json();
        const totalImages = data.images.length;
        let loadedCount = 0;

        const loadImage = (src: string): Promise<HTMLImageElement> =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              loadedCount++;
              setLoadingProgress(Math.round((loadedCount / totalImages) * 100));
              resolve(img);
              console.log('Img:', src , ' - ', loadedCount, '/', totalImages);
            };
            img.onerror = reject;
            img.src = `/gallery/${src}`;
          });

        // Charger toutes les images en parallèle
        const loadedImages = await Promise.all(
          data.images.map(loadImage)
        );

        setPreloadedImages(loadedImages);
        setImagesLoaded(true);
      } catch (error) {
        console.error('Erreur lors du chargement des images:', error);
        setImagesLoaded(true); // On continue même en cas d'erreur
      }
    };

    preloadImages();
  }, [setPreloadedImages]);

  // Effet pour contrôler l'affichage du spinner
  useEffect(() => {
    if (phase === 'loading') {
      setShowSpinner(true);
    }
  }, [phase]);

  // Effet de typing
  useEffect(() => {
    if (phase === 'typing' && text.length < fullText.length) {
      const timeout = setTimeout(() => {
        setText(fullText.slice(0, text.length + 1));
      }, 150);
      return () => clearTimeout(timeout);
    } else if (phase === 'typing' && text.length === fullText.length) {
      setPhase('loading');
    }
  }, [text, phase]);

  // Effet de fin et transition
  useEffect(() => {
    if (phase === 'loading' && imagesLoaded) {
      const timer = setTimeout(() => {
        setShowSpinner(false);
        setTimeout(() => {
          setIsTypingComplete(true);
          setTimeout(() => {
            setIsLoading(false);
            onLoadingComplete();
            localStorage.setItem('splashScreenComplete', 'true');
          }, 1200);
        }, 300);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [phase, imagesLoaded, onLoadingComplete]);

  const cursorVariants: Variants = {
    typing: {
      opacity: 1,
    },
    loading: {
      opacity: [1, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  const spinnerVariants: Variants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 0.8,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 10,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const spinnerCircleVariants: Variants = {
    typing: {
      rotate: 360,
      transition: {
        duration: 1.2,
        ease: "linear",
        repeat: Infinity
      }
    },
    loading: {
      rotate: 360,
      transition: {
        duration: 1.2,
        ease: "linear",
        repeat: Infinity
      }
    }
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, filter: "blur(20px)", ease: "easeInOut" }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
        >
          <div className="relative flex flex-col items-center justify-center h-full">
            <motion.div
              animate={isTypingComplete ? {
                scale: zoomPosition.scale,
                y: -20,
                x: zoomPosition.x,
                transition: { 
                  duration: 1.2,
                  ease: "easeInOut",
                  delay: 0.4,
                }
              } : {}}
              className="relative text-center"
            >
              <span className="text-4xl md:text-6xl lg:text-7xl font-bold text-white relative">
                {text}
                <motion.span
                  variants={cursorVariants}
                  initial="typing"
                  animate={phase}
                  className="absolute -right-5 top-1 text-white"
                >
                  |
                </motion.span>
              </span>
            </motion.div>

            {/* Spinner de chargement avec pourcentage */}
            <AnimatePresence>
              {showSpinner && !isTypingComplete && (
                <motion.div
                  variants={spinnerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
                >
                  <motion.div 
                    className="w-8 h-8 rounded-full border-2 border-white border-t-transparent mb-2"
                    variants={spinnerCircleVariants}
                    animate={phase}
                  />
                  <motion.span 
                    className="text-white text-sm"
                    style={{
                      opacity: phase === 'loading' ? 0.8 : 0.4
                    }}
                  >
                    {loadingProgress}%
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 