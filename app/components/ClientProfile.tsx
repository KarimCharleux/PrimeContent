'use client';
import { useState } from 'react';
import Image from 'next/image';

interface ClientProfileProps {
  name: string;
  imageSrc?: string;
  imageBackground?: string;
  className?: string;
}

export default function ClientProfile({ name, imageSrc, imageBackground, className = '' }: ClientProfileProps) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4">
        {imageSrc && !imageError ? (
          <Image
            src={imageSrc}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
            quality={90}
            onError={() => setImageError(true)}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black"></div>
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              {name.split(' ').map(part => part[0]).join('')}
            </div>
          </>
        )}
      </div>
      <h3 className="text-xl font-bold text-center">{name}</h3>
    </div>
  );
} 