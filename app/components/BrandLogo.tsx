'use client';
import Image from 'next/image';
import { useState } from 'react';

interface BrandLogoProps {
  readonly name: string;
  readonly imageSrc?: string;
}

export default function BrandLogo({ name, imageSrc }: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="brand-logo-container w-full h-full">
      <div className="p-4 rounded-lg w-full h-full w-full flex items-center justify-center relative overflow-hidden group transition-all duration-300 border border-white/10 hover:border-white/30">
        {imageSrc && !imageError ? (
          <div className="relative w-fit h-fit transition-all duration-300 group-hover:scale-105">
            <Image
              src={imageSrc}
              alt={name}
              width={500}
              height={260}
              style={{ 
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                transition: 'all 0.3s ease-in-out'
              }}
              className="group-hover:!filter-none"
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