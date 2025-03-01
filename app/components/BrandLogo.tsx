'use client';
import { useState } from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  name: string;
  imageSrc?: string;
  className?: string;
}

export default function BrandLogo({ name, imageSrc, className = '' }: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className={`brand-logo-container ${className}`}>
      <div className="p-4 rounded-lg border border-gray-800 w-full h-32 flex items-center justify-center relative overflow-hidden group transition-all duration-300">
        {imageSrc && !imageError ? (
          <div className="relative w-full h-full transition-transform duration-300 group-hover:scale-110">
            <Image
              src={imageSrc}
              alt={name}
              fill
              style={{ objectFit: 'contain' }}
              quality={80}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500 group-hover:text-white transition-colors duration-300">{name}</div>
        )}
        
        {/* Effet de bordure brillante au survol */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
             style={{ 
               boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2), 0 0 15px rgba(44, 108, 176, 0.5)",
             }}>
        </div>
      </div>
    </div>
  );
} 