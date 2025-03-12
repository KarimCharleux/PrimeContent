'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useImageStore } from '../store/imageStore';

interface SplashScreenProps {
  readonly onLoadingComplete: () => void;
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [phase, setPhase] = useState<'animating' | 'loading'>('animating');
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [zoomPosition, setZoomPosition] = useState({ x: -1400, scale: 110 });
  const setPreloadedImages = useImageStore(state => state.setPreloadedImages);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Effet pour ajuster la position du zoom en fonction de la taille de l'écran
  useEffect(() => {
    const updateZoomPosition = () => {
      const width = window.innerWidth;
      if(width <= 400) {
        setZoomPosition({ x: -1750, scale: 110 });
      } else if (width <= 480) { // Mobile
        setZoomPosition({ x: -1900, scale: 110 });
      } else if (width <= 550) { // Tablet
        setZoomPosition({ x: -2400, scale: 110 });
      } else { // Desktop
        setZoomPosition({ x: -2690, scale: 110 });
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

  // Effet pour passer à la phase de chargement après l'animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('loading');
    }, 2500); // Durée ajustée pour la nouvelle animation plus rapide

    return () => clearTimeout(timer);
  }, []);

  // Effet de fin et transition
  useEffect(() => {
    if (phase === 'loading' && imagesLoaded) {
      const timer = setTimeout(() => {
        setShowSpinner(false);
        setTimeout(() => {
          setIsAnimationComplete(true);
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
    animating: {
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
              animate={isAnimationComplete ? {
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
              <div className="text-4xl md:text-6xl lg:text-7xl font-bold relative">
                <svg 
                  width="100%" 
                  height="100" 
                  viewBox="0 0 600 100" 
                  className="svg-text"
                  style={{
                    overflow: 'visible',
                  }}
                >
                  <style jsx>{`
                    .letter {
                      stroke-dasharray: 100;
                      stroke-dashoffset: 100;
                      fill-opacity: 0;
                      opacity: 0;
                    }
                    
                    .prime-letter-1 {
                      animation: appear 0.01s linear forwards 0.1s, 
                                 dash 0.5s ease forwards 0.1s, 
                                 filling-white 0.7s ease-in forwards 0.3s;
                    }
                    
                    .prime-letter-2 {
                      animation: appear 0.01s linear forwards 0.2s, 
                                 dash 0.5s ease forwards 0.2s, 
                                 filling-white 0.7s ease-in forwards 0.4s;
                    }
                    
                    .prime-letter-3 {
                      animation: appear 0.01s linear forwards 0.3s, 
                                 dash 0.5s ease forwards 0.3s, 
                                 filling-white 0.7s ease-in forwards 0.5s;
                    }
                    
                    .prime-letter-4 {
                      animation: appear 0.01s linear forwards 0.4s, 
                                 dash 0.5s ease forwards 0.4s, 
                                 filling-white 0.7s ease-in forwards 0.6s;
                    }
                    
                    .prime-letter-5 {
                      animation: appear 0.01s linear forwards 0.5s, 
                                 dash 0.5s ease forwards 0.5s, 
                                 filling-white 0.7s ease-in forwards 0.7s;
                    }
                    
                    .content-letter-1 {
                      animation: appear 0.01s linear forwards 0.6s, 
                                 dash 0.5s ease forwards 0.6s, 
                                 filling-gray 0.7s ease-in forwards 0.8s;
                    }
                    
                    .content-letter-2 {
                      animation: appear 0.01s linear forwards 0.7s, 
                                 dash 0.5s ease forwards 0.7s, 
                                 filling-gray 0.7s ease-in forwards 0.9s;
                    }
                    
                    .content-letter-3 {
                      animation: appear 0.01s linear forwards 0.8s, 
                                 dash 0.5s ease forwards 0.8s, 
                                 filling-gray 0.7s ease-in forwards 1.0s;
                    }
                    
                    .content-letter-4 {
                      animation: appear 0.01s linear forwards 0.9s, 
                                 dash 0.5s ease forwards 0.9s, 
                                 filling-gray 0.7s ease-in forwards 1.1s;
                    }
                    
                    .content-letter-5 {
                      animation: appear 0.01s linear forwards 1.0s, 
                                 dash 0.5s ease forwards 1.0s, 
                                 filling-gray 0.7s ease-in forwards 1.2s;
                    }
                    
                    .content-letter-6 {
                      animation: appear 0.01s linear forwards 1.1s, 
                                 dash 0.5s ease forwards 1.1s, 
                                 filling-gray 0.7s ease-in forwards 1.3s;
                    }
                    
                    .content-letter-7 {
                      animation: appear 0.01s linear forwards 1.2s, 
                                 dash 0.5s ease forwards 1.2s, 
                                 filling-gray 0.7s ease-in forwards 1.4s;
                    }
                    
                    .content-letter-8 {
                      animation: appear 0.01s linear forwards 1.3s, 
                                 dash 0.5s ease forwards 1.3s, 
                                 filling-gray 0.7s ease-in forwards 1.5s;
                    }
                    
                    @keyframes appear {
                      to {
                        opacity: 1;
                      }
                    }
                    
                    @keyframes dash {
                      to {
                        stroke-dashoffset: 0;
                      }
                    }
                    
                    @keyframes filling-white {
                      to {
                        fill: white;
                        fill-opacity: 1;
                      }
                    }
                    
                    @keyframes filling-gray {
                      to {
                        fill: #9ca3af;
                        fill-opacity: 1;
                      }
                    }
                  `}</style>
                  
                  {/* Prime */}
                  <text 
                    x="80" 
                    y="70" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="1"
                    style={{
                      fontFamily: 'sans-serif',
                      fontWeight: 'bold',
                      fontSize: '70px',
                    }}
                  >
                    <tspan className="letter prime-letter-1">P</tspan>
                    <tspan className="letter prime-letter-2" x="124">r</tspan>
                    <tspan className="letter prime-letter-3" x="151">i</tspan>
                    <tspan className="letter prime-letter-4" x="167">m</tspan>
                    <tspan className="letter prime-letter-5" x="227">e</tspan>
                  </text>
                  
                  {/* Content */}
                  <text 
                    x="265" 
                    y="70" 
                    fill="none" 
                    stroke="#9ca3af" 
                    strokeWidth="1"
                    style={{
                      fontFamily: 'sans-serif',
                      fontWeight: 'bold',
                      fontSize: '70px',
                    }}
                  >
                    <tspan className="letter content-letter-1">c</tspan>
                    <tspan className="letter content-letter-2" x="303">o</tspan>
                    <tspan className="letter content-letter-3" x="343">n</tspan>
                    <tspan className="letter content-letter-4" x="384">t</tspan>
                    <tspan className="letter content-letter-5" x="407">e</tspan>
                    <tspan className="letter content-letter-6" x="443">n</tspan>
                    <tspan className="letter content-letter-7" x="484">t</tspan>
                    <tspan className="letter content-letter-8" x="507">.</tspan>
                  </text>
                </svg>
              </div>
            </motion.div>

            {/* Spinner de chargement avec pourcentage */}
            <AnimatePresence>
              {showSpinner && !isAnimationComplete && (
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