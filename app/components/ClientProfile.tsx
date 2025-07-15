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
    href,
    className = '',
}: ClientProfileProps) {
    const [imageError, setImageError] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Générer l'URL vers la page client avec le filtre de la célébrité
    const getClientUrl = () => {
        if (href && href !== '#') {
            return href; // Utiliser le href existant si défini
        }

        // Créer l'URL vers la page client avec le filtre de la célébrité
        const filterName = name.toLowerCase().replace(/\s+/g, '-');
        return `/clients?type=celebrites&filter=${filterName}`;
    };

    // Effet de parallaxe au survol
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xPercent = (x / rect.width - 0.5) * 2;
            const yPercent = (y / rect.height - 0.5) * 2;

            const intensity = 5;
            card.style.transform = `perspective(1000px) rotateX(${-yPercent * intensity}deg) rotateY(${xPercent * intensity}deg)`;

            const imageElement = card.querySelector('.client-image') as HTMLElement;
            const textElement = card.querySelector('.client-text') as HTMLElement;

            if (imageElement) {
                imageElement.style.transform = `translateX(${xPercent * 15}px) translateY(${yPercent * 15}px)`;
            }

            if (textElement) {
                textElement.style.transform = `translateX(${xPercent * 5}px) translateY(${yPercent * 5}px)`;
            }
        };

        const handleMouseLeave = () => {
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
        <>
            {/* Version Desktop - Style actuel avec carré et effets parallaxe */}
            <div
                ref={cardRef}
                className={`client-profile-card relative w-full aspect-square overflow-hidden rounded-2xl cursor-pointer group hidden sm:block ${className}`}
                style={{
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.1s ease-out',
                }}
            >
                {/* Icône cliquable */}
                <div className="absolute top-3 right-3 z-20 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white drop-shadow-lg transition-all duration-500 ease-in-out group-hover:animate-[iconTeleport_0.6s_ease-in-out]"
                        style={
                            {
                                '--icon-start-x': '0px',
                                '--icon-start-y': '0px',
                                '--icon-mid-x': '8px',
                                '--icon-mid-y': '-8px',
                                '--icon-end-x': '-14px',
                                '--icon-end-y': '14px',
                            } as React.CSSProperties
                        }
                    >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                    </svg>
                </div>

                {/* Animation CSS */}
                <style jsx>{`
                    @keyframes iconTeleport {
                        0% {
                            transform: translate(var(--icon-start-x), var(--icon-start-y)) scale(1);
                            opacity: 1;
                        }
                        30% {
                            transform: translate(var(--icon-mid-x), var(--icon-mid-y)) scale(0.8);
                            opacity: 0.7;
                        }
                        50% {
                            transform: translate(var(--icon-mid-x), var(--icon-mid-y)) scale(0.6);
                            opacity: 0;
                        }
                        51% {
                            transform: translate(var(--icon-end-x), var(--icon-end-y)) scale(0.6);
                            opacity: 0;
                        }
                        70% {
                            transform: translate(var(--icon-end-x), var(--icon-end-y)) scale(0.8);
                            opacity: 0.7;
                        }
                        100% {
                            transform: translate(var(--icon-start-x), var(--icon-start-y)) scale(1);
                            opacity: 1;
                        }
                    }
                `}</style>

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
                    <h3 className="text-2xl font-bold !text-white mb-1" style={{ color: 'white' }}>
                        {name}
                    </h3>
                    {domain && (
                        <p
                            className="text-sm !text-white font-light opacity-90"
                            style={{ color: 'white' }}
                        >
                            {domain}
                        </p>
                    )}
                </div>
            </div>

            {/* Version Mobile - Style simple et professionnel */}
            <div
                className={`client-profile-mobile flex flex-col items-center cursor-pointer group sm:hidden ${className}`}
            >
                {/* Photo ronde simple avec background */}
                <div className="relative w-16 h-16 mb-2 rounded-full overflow-hidden bg-gray-800 border-2 border-white/20">
                    {/* Image de fond */}
                    {imageBackground && (
                        <Image
                            src={getMediaUrl(imageBackground)}
                            alt={`${name} background`}
                            fill
                            style={{ objectFit: 'cover', opacity: 0.6 }}
                            quality={80}
                            className="absolute inset-0"
                        />
                    )}

                    {/* Image principale */}
                    {imageSrc && !imageError ? (
                        <Image
                            src={getMediaUrl(imageSrc)}
                            alt={name}
                            fill
                            style={{ objectFit: 'cover' }}
                            quality={90}
                            onError={() => setImageError(true)}
                            className="relative z-10 transition-transform duration-300 group-hover:scale-110"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white/70 z-10">
                            {name
                                .split(' ')
                                .map((part) => part[0])
                                .join('')}
                        </div>
                    )}
                </div>

                {/* Nom en bas */}
                <div className="text-center">
                    <h3
                        className="text-xs font-medium text-white truncate max-w-[60px]"
                        title={name}
                    >
                        {name}
                    </h3>
                </div>
            </div>
        </>
    );

    return (
        <Link href={getClientUrl()} className="block w-full h-full">
            {content}
        </Link>
    );
}
