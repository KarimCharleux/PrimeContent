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
      <div className="p-4 rounded-lg w-full h-32 flex items-center justify-center relative overflow-hidden group transition-all duration-300">
        {imageSrc && !imageError ? (
          <div className="relative w-full h-full transition-transform duration-300 group-hover:scale-110">
            <Image
              src={imageSrc}
              alt={name}
              width={500}
              height={260}
              style={{ objectFit: 'contain' }}
              quality={80}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="text-center text-xs text-white">{name}</div>
        )}
        
      </div>
    </div>
  );
} 