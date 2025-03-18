'use client';
import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ExpertiseCardProps {
  readonly title: string;
  readonly description: string;
  readonly icon: ReactNode;
  readonly backgroundImage: string;
  readonly className?: string;
  readonly href?: string;
}

export default function ExpertiseCard({
  title,
  description,
  icon,
  backgroundImage,
  className = '',
  href = '#',
}: ExpertiseCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Générer une couleur de dégradé basée sur le titre pour les cas où l'image n'est pas disponible
  const generateGradient = () => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Utiliser des nuances de bleu au lieu de couleurs aléatoires
    const hue1 = 210 + (hash % 30); // Bleu foncé avec légère variation
    const hue2 = 220 + (hash % 20); // Autre nuance de bleu
    
    return `linear-gradient(135deg, hsla(${hue1}, 70%, 20%, 0.8), hsla(${hue2}, 80%, 10%, 0.8))`;
  };
  
  return (
    <motion.div 
      className={`group relative overflow-hidden rounded-2xl bg-gray-900/70 hover:bg-blue-900/30 transition-all duration-500 h-[350px] md:h-[400px] ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Image d'arrière-plan avec fallback sur un dégradé */}
      <div 
        className="absolute inset-0 z-0 opacity-60 group-hover:opacity-80 transition-opacity duration-500"
        style={imageError ? { background: generateGradient() } : undefined}
      >
        {!imageError && (
          <Image
            src={backgroundImage}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            quality={80}
            onError={() => setImageError(true)}
          />
        )}
      </div>
      
      {/* Overlay gradient pour améliorer la lisibilité */}
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-transparent via-black/40 to-black/90"></div>
      
      {/* Contenu de la carte */}
      <div className="relative z-10 h-full flex flex-col justify-end p-4 md:p-8">
        {/* Contenu principal (icône et titre) */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0 mb-3">
          <div className="w-10 h-10 md:w-[48px] md:h-[48px] md:min-w-[48px] md:min-h-[48px] bg-white rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
            {icon}
          </div>
          <h3 className="text-lg md:text-xl font-bold transition-colors duration-300">
            {title}
          </h3>
        </div>
        
        {/* Description et bouton - s'affiche au survol avec une transition douce */}
        <div 
          className="overflow-hidden transition-all duration-700 ease-in-out max-h-0 group-hover:max-h-[200px] opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0"
          style={{ transitionDelay: '0.1s' }}
        >
          <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-4">
            {description}
          </p>
          
          <a href={href} className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm md:text-base group transition-all duration-300" style={{ transitionDelay: '0.2s' }}>
            <span className="mr-2">En savoir plus</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 md:h-5 md:w-5 transform transition-transform duration-300 group-hover:translate-x-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
      
      {/* Effet de bordure au survol */}
      <div className="absolute inset-0 border border-transparent group-hover:border-blue-700/50 rounded-2xl transition-colors duration-500"></div>
    </motion.div>
  );
} 