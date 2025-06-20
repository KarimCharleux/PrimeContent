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
        return `/client?type=marques&filter=${filterName}`;
    };

    const content = (
        <div className="p-1 lg:p-2 rounded-lg w-full h-full flex items-center justify-center relative overflow-hidden group transition-all duration-300 border border-white/10 hover:border-white/30">
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
