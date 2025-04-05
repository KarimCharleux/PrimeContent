'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';

import gsap from '../lib/gsap-config';
import { getMediaUrl } from '../utils/mediaUrl';

export interface Review {
  name: string;
  role: string;
  company: string;
  text: string;
  imageSrc?: string;
  order?: number;
}

interface CustomerReviewsProps {
  readonly reviews: Review[];
  readonly autoplaySpeed?: number;
}

export default function CustomerReviews({ 
  reviews, 
  autoplaySpeed = 5000 
}: CustomerReviewsProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollAnimation = useRef<gsap.core.Timeline | null>(null);
  const totalWidthRef = useRef<number>(0);

  // Fonction pour créer une nouvelle animation à partir de la position actuelle
  const createNewAnimationFromCurrentPosition = useCallback(() => {
    if (!sliderTrackRef.current || !scrollAnimation.current) return;
    
    // Obtenir la position actuelle
    const currentX = gsap.getProperty(sliderTrackRef.current, "x") as number;
    
    // Calculer la durée restante proportionnellement
    const totalWidth = totalWidthRef.current;
    const halfWidth = totalWidth / 2;
    const remainingDistance = halfWidth + currentX; // Distance jusqu'à la fin
    const fullDuration = autoplaySpeed / 1000 * reviews.length;
    const remainingDuration = (remainingDistance / halfWidth) * fullDuration;
    
    // Arrêter l'animation actuelle
    scrollAnimation.current.kill();
    
    // Créer une nouvelle animation à partir de la position actuelle
    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: 'none' }
    });
    
    // Première partie: terminer le défilement actuel
    tl.to(sliderTrackRef.current, {
      x: -halfWidth,
      duration: remainingDuration,
      ease: 'linear',
      onComplete: () => {
        // Réinitialiser la position sans animation visible
        gsap.set(sliderTrackRef.current, { x: 0 });
      }
    });
    
    // Deuxième partie: défilement complet pour les répétitions suivantes
    tl.to(sliderTrackRef.current, {
      x: -halfWidth,
      duration: fullDuration,
      ease: 'linear',
      onComplete: () => {
        // Réinitialiser la position sans animation visible
        gsap.set(sliderTrackRef.current, { x: 0 });
      }
    });
    
    scrollAnimation.current = tl;
  }, [reviews.length, autoplaySpeed]);

  useEffect(() => {
    if (!sliderTrackRef.current || !sliderRef.current) return;

    // Dupliquer les avis pour créer un effet de défilement infini
    const reviewElements = sliderTrackRef.current.querySelectorAll('.review-item');
    const reviewWidth = reviewElements[0]?.clientWidth || 0;
    const totalWidth = reviewWidth * reviewElements.length;
    totalWidthRef.current = totalWidth;

    // Configurer l'animation de défilement infini
    const setupInfiniteScroll = () => {
      // Réinitialiser la position
      gsap.set(sliderTrackRef.current, { x: 0 });

      // Animation de défilement
      const tl = gsap.timeline({
        repeat: -1,
        defaults: { ease: 'none' }
      });

      // Défilement fluide
      tl.to(sliderTrackRef.current, {
        x: -totalWidth / 2, // Déplacer jusqu'à la moitié (où commencent les doublons)
        duration: autoplaySpeed / 1000 * reviews.length,
        ease: 'linear',
        onComplete: () => {
          // Réinitialiser la position sans animation visible
          gsap.set(sliderTrackRef.current, { x: 0 });
        }
      });

      return tl;
    };

    // Créer l'animation
    scrollAnimation.current = setupInfiniteScroll();

    // Gestion de la molette de souris pour le défilement horizontal
    const handleWheel = (e: WheelEvent) => {
      if (!sliderRef.current) return;
      
      e.preventDefault();
      
      // Pause temporaire de l'animation pendant le défilement manuel
      if (scrollAnimation.current) {
        scrollAnimation.current.pause();
      }
      
      // Calcul de la nouvelle position
      const delta = e.deltaY || e.deltaX;
      const currentX = gsap.getProperty(sliderTrackRef.current, "x") as number;
      const newX = currentX - delta;
      
      // Limites pour éviter de dépasser les bornes
      const minX = -totalWidth / 2;
      const maxX = 0;
      const clampedX = Math.max(Math.min(newX, maxX), minX);
      
      // Applique le déplacement
      gsap.to(sliderTrackRef.current, {
        x: clampedX,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          // Reprend l'animation à partir de la nouvelle position
          if (scrollAnimation.current) {
            // Recréer l'animation à partir de la position actuelle
            createNewAnimationFromCurrentPosition();
          }
        }
      });
    };

    // Stocker une référence pour le nettoyage
    const sliderRefCurrent = sliderRef.current;
    sliderRefCurrent.addEventListener('wheel', handleWheel, { passive: false });

    // Nettoyage
    return () => {
      if (scrollAnimation.current) {
        scrollAnimation.current.kill();
      }
      if (sliderRefCurrent) {
        sliderRefCurrent.removeEventListener('wheel', handleWheel);
      }
    };
  }, [reviews.length, autoplaySpeed, createNewAnimationFromCurrentPosition]);

  // Gestion du swipe sur mobile
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderTrackRef.current) return;
    
    setIsDragging(true);
    setStartX(e.pageX - sliderTrackRef.current.offsetLeft);
    setScrollLeft(gsap.getProperty(sliderTrackRef.current, "x") as number);
    
    // Pause temporaire de l'animation pendant le défilement manuel
    if (scrollAnimation.current) {
      scrollAnimation.current.pause();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!sliderTrackRef.current) return;
    
    setIsDragging(true);
    setStartX(e.touches[0].pageX - sliderTrackRef.current.offsetLeft);
    setScrollLeft(gsap.getProperty(sliderTrackRef.current, "x") as number);
    
    // Pause temporaire de l'animation pendant le défilement manuel
    if (scrollAnimation.current) {
      scrollAnimation.current.pause();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !sliderTrackRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - sliderTrackRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Vitesse de déplacement
    
    // Applique le déplacement
    gsap.to(sliderTrackRef.current, {
      x: scrollLeft + walk,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !sliderTrackRef.current) return;
    
    const x = e.touches[0].pageX - sliderTrackRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Vitesse de déplacement
    
    // Applique le déplacement
    gsap.to(sliderTrackRef.current, {
      x: scrollLeft + walk,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Reprend l'animation à partir de la nouvelle position
    setTimeout(() => {
      createNewAnimationFromCurrentPosition();
    }, 300);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      
      // Reprend l'animation à partir de la nouvelle position
      setTimeout(() => {
        createNewAnimationFromCurrentPosition();
      }, 300);
    }
  };

  // Dupliquer les avis pour créer un effet de défilement infini
  const duplicatedReviews = [...reviews, ...reviews];

  // Générer un gradient légèrement différent basé sur l'ID de l'avis
  const generateGradient = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Variations subtiles de bleus
    const hue1 = 200 + (hash % 10); // Base bleue
    const sat1 = 50 + (hash % 10);
    const light1 = 15 + (hash % 10);
    
    const hue2 = 220 + (hash % 10); // Bleu-indigo
    const sat2 = 80 + (hash % 10);
    const light2 = 10 + (hash % 8);
    
    return {
      normal: `linear-gradient(135deg, hsla(${hue1}, ${sat1}%, ${light1}%, 0.7), hsla(${hue2}, ${sat2}%, ${light2}%, 0.9))`,
      hover: `linear-gradient(135deg, hsla(${hue1}, ${sat1+10}%, ${light1+5}%, 0.8), hsla(${hue2}, ${sat2+5}%, ${light2+3}%, 0.95))`
    };
  };

  return (
    <div 
      ref={sliderRef} 
      className="w-full overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <div 
        ref={sliderTrackRef} 
        className="flex gap-6 py-4"
        style={{ touchAction: 'pan-y' }}
      >
        {duplicatedReviews.map((review, index) => {
          const gradient = generateGradient(review.text);
          return (
            <motion.div 
              key={`${review.order}-${index}`}
              className="review-item flex-shrink-0 w-96"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div 
                className="group relative p-6 rounded-xl h-full overflow-hidden"
                style={{ 
                  background: gradient.normal
                }}
              >
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-blue-300/0 to-white/0 group-hover:via-blue-300/10 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
                
                {/* Bordure brillante */}
                <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/20 transition-all duration-500"></div>
                
                {/* Effet de halo */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/0 group-hover:bg-blue-400/10 rounded-full blur-xl transition-all duration-700 transform group-hover:scale-150"></div>
                
                {/* Background overlay with a glass effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/30 backdrop-blur-[2px] opacity-70 group-hover:opacity-40 transition-all duration-500"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-4">
                    <div className="text-white text-lg md:text-xl font-light italic mb-4">❝</div>
                    <p className="text-white/90 group-hover:text-white text-base md:text-lg leading-relaxed select-none transition-colors duration-300">
                      {review.text}
                    </p>
                  </div>
                  
                  <div className="mt-auto flex items-center gap-4">
                    {review.imageSrc && (
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden relative border-2 border-white/20 group-hover:border-white/40 transition-all duration-300 shadow-lg">
                          <Image 
                            src={getMediaUrl(review.imageSrc)}
                            alt={review.name}
                            fill
                            sizes="48px"
                            className="object-cover select-none"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="font-bold text-white select-none">{review.name}</p>
                      <p className="text-blue-100/70 group-hover:text-blue-100 text-sm select-none transition-colors duration-300">
                        {review.role}, {review.company}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
} 