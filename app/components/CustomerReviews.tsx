'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from '../lib/gsap-config';

interface Review {
  id: string;
  name: string;
  role: string;
  company: string;
  text: string;
  imageSrc?: string;
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

    sliderRef.current.addEventListener('wheel', handleWheel, { passive: false });

    // Nettoyage
    return () => {
      if (scrollAnimation.current) {
        scrollAnimation.current.kill();
      }
      if (sliderRef.current) {
        sliderRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, [reviews.length, autoplaySpeed]);

  // Fonction pour créer une nouvelle animation à partir de la position actuelle
  const createNewAnimationFromCurrentPosition = () => {
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
  };

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
        {duplicatedReviews.map((review, index) => (
          <div 
            key={`${review.id}-${index}`}
            className="review-item flex-shrink-0 w-80"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl shadow-lg h-full">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-gray-200 text-base md:text-lg leading-relaxed select-none">
                    {review.text}
                  </p>
                </div>
                
                <div className="mt-auto flex items-center gap-4">
                  {review.imageSrc && (
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden relative">
                        <Image 
                          src={review.imageSrc} 
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
                    <p className="text-gray-400 text-sm select-none">
                      {review.role}, {review.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 