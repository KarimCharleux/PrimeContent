'use client';
import { ReactNode, useState } from 'react';
import ScrambleText from './ScrambleText';
import Image from 'next/image';

interface ExpertiseCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  backgroundImage: string;
  className?: string;
}

export default function ExpertiseCard({
  title,
  description,
  icon,
  backgroundImage,
  className = '',
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
    <div 
      className={`group relative overflow-hidden p-8 rounded-2xl bg-gray-900/70 hover:bg-blue-900/30 transition duration-500 h-full ${className}`}
    >
      {/* Image d'arrière-plan avec fallback sur un dégradé */}
      <div 
        className="absolute inset-0 z-0 opacity-40 group-hover:opacity-50 transition-opacity duration-500"
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
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div>
      
      {/* Contenu de la carte */}
      <div className="relative z-10 h-full flex flex-col">
        <div className="w-14 h-14 bg-white rounded-lg mb-6 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
          {icon}
        </div>
        
        <h3 className="text-xl font-bold mb-3 transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 flex-grow text-sm leading-relaxed">
          {description}
        </p>
        
        {/* Bouton "En savoir plus" */}
        <div className="mt-5 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition duration-300">
          <a href="#" className="inline-flex items-center text-blue-400 hover:text-blue-300 group">
            <span className="mr-2">En savoir plus</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" 
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
      <div className="absolute inset-0 border border-transparent group-hover:border-blue-700/30 rounded-2xl transition-colors duration-500"></div>
    </div>
  );
} 