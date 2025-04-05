'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

import { getMediaUrl } from '../utils/mediaUrl';

interface ClientProfileProps {
    readonly name: string;
    readonly domain?: string;
    readonly imageSrc?: string;
    readonly imageBackground?: string;
    readonly href?: string;
    readonly className?: string;
}

export default function ClientProfile({
    name,
    domain = '',
    imageSrc,
    imageBackground,
    href = '#',
    className = '',
}: ClientProfileProps) {
    const [imageError, setImageError] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Effet de parallaxe au survol
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // Position X de la souris dans la carte
            const y = e.clientY - rect.top; // Position Y de la souris dans la carte

            // Calculer le pourcentage de la position de la souris dans la carte
            const xPercent = (x / rect.width - 0.5) * 2; // -1 à 1
            const yPercent = (y / rect.height - 0.5) * 2; // -1 à 1

            // Appliquer la rotation et le parallaxe
            const intensity = 5; // Intensité de la rotation
            card.style.transform = `perspective(1000px) rotateX(${-yPercent * intensity}deg) rotateY(${xPercent * intensity}deg)`;

            // Effet de parallaxe sur l'image
            const imageElement = card.querySelector('.client-image') as HTMLElement;
            const textElement = card.querySelector('.client-text') as HTMLElement;

            if (imageElement) {
                // L'image se déplace plus rapidement (effet de profondeur)
                imageElement.style.transform = `translateX(${xPercent * 15}px) translateY(${yPercent * 15}px)`;
            }

            if (textElement) {
                // Le texte se déplace moins rapidement
                textElement.style.transform = `translateX(${xPercent * 5}px) translateY(${yPercent * 5}px)`;
            }
        };

        const handleMouseLeave = () => {
            // Réinitialiser les transformations
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';

            const imageElement = card.querySelector('.client-image') as HTMLElement;
            const textElement = card.querySelector('.client-text') as HTMLElement;

            if (imageElement) {
                imageElement.style.transform = 'translateX(0) translateY(0)';
            }

            if (textElement) {
                textElement.style.transform = 'translateX(0) translateY(0)';
            }
        };

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            card.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const content = (
        <div
            ref={cardRef}
            className={`client-profile-card relative w-full aspect-square overflow-hidden rounded-2xl cursor-pointer ${className}`}
            style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s ease-out',
            }}
        >
            {/* Fond de la carte */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black overflow-hidden">
                {imageBackground && !imageError ? (
                    <Image
                        src={getMediaUrl(imageBackground)}
                        alt={`${name} background`}
                        fill
                        style={{ objectFit: 'cover', opacity: 0.6 }}
                        quality={80}
                        className="client-background transition-transform duration-300"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-black"></div>
                )}
            </div>

            {/* Image du client avec effet de parallaxe */}
            <div className="client-image absolute inset-0 transition-transform duration-200 ease-out">
                {imageSrc && !imageError ? (
                    <Image
                        src={getMediaUrl(imageSrc)}
                        alt={name}
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={90}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-white/30">
                        {name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')}
                    </div>
                )}
            </div>

            {/* Overlay avec dégradé plus foncé pour améliorer le contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

            {/* Texte avec styles renforcés */}
            <div className="client-text absolute bottom-0 left-0 w-full p-6 transition-transform duration-200 ease-out text-center z-10">
                <h3
                    className="text-2xl font-bold !text-white mb-1 max-md:text-lg"
                    style={{ color: 'white' }}
                >
                    {name}
                </h3>
                {domain && (
                    <p
                        className="text-sm !text-white font-light opacity-90 max-md:hidden"
                        style={{ color: 'white' }}
                    >
                        {domain}
                    </p>
                )}
            </div>
        </div>
    );

    return href && href !== '#' ? (
        <Link href={href} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
            {content}
        </Link>
    ) : (
        content
    );
}
