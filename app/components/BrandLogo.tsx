'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { getMediaUrl } from '../utils/mediaUrl';

interface BrandLogoProps {
    readonly name: string;
    readonly imageSrc?: string;
    readonly href?: string;
}

export default function BrandLogo({ name, imageSrc, href }: BrandLogoProps) {
    const [imageError, setImageError] = useState(false);

    // Générer l'URL vers la page client avec le filtre de la marque
    const getClientUrl = () => {
        if (href && href !== '#') {
            return href; // Utiliser le href existant si défini
        }

        // Créer l'URL vers la page client avec le filtre de la marque
        const filterName = name.toLowerCase().replace(/\s+/g, '-');
        return `/clients?type=marques&filter=${filterName}`;
    };

    const content = (
        <div className="p-1 lg:p-2 rounded-lg w-full h-full flex items-center justify-center relative overflow-hidden group transition-all duration-300 border border-white/10 hover:border-white/30">
            {/* Icône cliquable */}
            <div className="absolute top-2 right-2 z-20 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
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

            {imageSrc && !imageError ? (
                <div className="relative w-fit h-fit transition-all duration-300 group-hover:scale-105">
                    <Image
                        src={getMediaUrl(imageSrc)}
                        alt={name}
                        width={500}
                        height={260}
                        style={{
                            objectFit: 'contain',
                            filter: 'brightness(0) invert(1)',
                            transition: 'all 0.3s ease-in-out',
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
    );

    return (
        <div className="brand-logo-container w-full h-full">
            <Link href={getClientUrl()} className="block w-full h-full">
                {content}
            </Link>
        </div>
    );
}
