'use client';
import { useRef, useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';

interface Brand {
  readonly name: string;
  readonly imageSrc?: string;
}

interface InfiniteLogoCarouselProps {
  readonly brands: Brand[];
  readonly speed?: number; // Vitesse de défilement en pixels par seconde
  readonly className?: string;
}

export default function InfiniteLogoCarousel({ 
  brands, 
  speed = 30, 
  className = '' 
}: InfiniteLogoCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [duplicatedBrands, setDuplicatedBrands] = useState<Brand[]>([]);
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  
  // Dupliquer les marques pour créer un effet infini
  useEffect(() => {
    // Dupliquer les marques pour assurer un défilement continu
    setDuplicatedBrands([...brands, ...brands, ...brands]);
  }, [brands]);
  
  useEffect(() => {
    if (!containerRef.current || !innerRef.current) return;
    
    let startTime: number | null = null;
    let lastTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
        lastTime = timestamp;
      }
      
      const deltaTime = timestamp - (lastTime || timestamp);
      lastTime = timestamp;
      
      if (innerRef.current) {
        // Calculer le déplacement en fonction de la vitesse et du temps écoulé
        const pixelsToMove = (speed * deltaTime) / 1000;
        positionRef.current -= pixelsToMove;
        
        // Vérifier si nous avons dépassé la largeur d'un groupe de logos
        if (innerRef.current.children.length > 0) {
          const logoWidth = innerRef.current.children[0].clientWidth;
          const totalWidth = logoWidth * brands.length;
          
          // Si nous avons défilé au-delà de la largeur d'un logo, déplacer ce logo à la fin
          if (Math.abs(positionRef.current) >= totalWidth) {
            // Réinitialiser la position mais conserver l'effet de défilement continu
            positionRef.current += totalWidth;
            
            // Réorganiser les éléments pour créer l'illusion d'un défilement infini
            if (innerRef.current) {
              // On garde la même transformation pour éviter un saut visuel
              innerRef.current.style.transform = `translateX(${positionRef.current}px)`;
            }
          }
        }
        
        // Appliquer la transformation avec une transition douce
        innerRef.current.style.transform = `translateX(${positionRef.current}px)`;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, brands.length]);
  
  return (
    <div 
      ref={containerRef}
      className={`${className}`}
    >
      <div 
        ref={innerRef}
        className="flex"
        style={{ willChange: 'transform' }}
      >
        {duplicatedBrands.map((brand, index) => (
          <div key={`${brand.name}-${index}`} className="flex-shrink-0 px-4 w-64">
            <BrandLogo 
              name={brand.name} 
              imageSrc={brand.imageSrc}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 