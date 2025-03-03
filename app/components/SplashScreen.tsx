'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  readonly onLoadingComplete: () => void;
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des ressources
    const timer = setTimeout(() => {
      setIsLoading(false);
      onLoadingComplete();
      // Signal pour démarrer les animations GSAP
      localStorage.setItem('splashScreenComplete', 'true');
    }, 2500); // Durée de l'animation réduite à 2.5 secondes

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(20px)', scale: 5 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              times: [0, 0.5, 1]
            }}
            className="text-center"
          >
            <motion.h1
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                times: [0, 0.5, 1],
                repeat: Infinity,
              }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white"
            >
              PRIMECONTENT
            </motion.h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 