'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useState } from 'react';

import { getMediaUrl } from '../utils/mediaUrl';

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

    // Générer un gradient stylé basé sur le titre pour les cas où l'image n'est pas disponible
    const generateGradient = () => {
        let hash = 0;
        for (let i = 0; i < title.length; i++) {
            hash = title.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Une palette de couleurs plus riche
        const hue1 = 210 + (hash % 30); // Base bleue
        const hue2 = 240 + (hash % 40); // Violet/indigo

        return `linear-gradient(135deg, hsla(${hue1}, 80%, 30%, 0.85), hsla(${hue2}, 90%, 15%, 0.9), hsla(0, 0%, 5%, 0.95))`;
    };

    const cardContent = (
        <motion.div
            className={`group relative overflow-hidden rounded-2xl transition-all duration-500 w-full h-full ${className}`}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            {/* Icône cliquable - visible seulement sur mobile/tablet */}
            <div className="md:hidden absolute top-3 right-3 z-20 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
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

            {/* Arrière-plan avec gradient ou image */}
            <div
                className="absolute inset-0 z-0 opacity-90 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-br from-white/5 via-blue-900/40 to-black/80"
                style={imageError ? { background: generateGradient() } : {}}
            >
                {!imageError && (
                    <Image
                        src={getMediaUrl(backgroundImage)}
                        alt={title}
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={85}
                        onError={() => setImageError(true)}
                    />
                )}
            </div>

            {/* Overlay gradient pour améliorer la lisibilité */}
            <div className="absolute inset-0 z-1 bg-gradient-to-b from-black/10 via-blue-900/30 to-black/80 opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>

            {/* Effet de brillance au survol */}
            <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/0 via-blue-400/0 to-white/0 group-hover:via-blue-400/10 transition-all duration-700 blur-xl"></div>

            {/* Contenu de la carte */}
            <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3 md:p-4 lg:p-6">
                {/* Contenu principal (icône et titre) */}
                <div className="flex flex-col space-y-2 sm:space-y-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-white to-blue-100 rounded-lg flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/30 mx-auto sm:mx-0">
                        {icon}
                    </div>
                    <div className="text-center sm:text-left">
                        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold transition-colors duration-300 line-clamp-2 text-white group-hover:text-blue-100 leading-tight">
                            {title}
                        </h3>
                    </div>
                </div>

                {/* Description et bouton - masqués sur mobile/tablet, visibles sur desktop */}
                <div
                    className="hidden md:block overflow-hidden transition-all duration-700 ease-in-out max-h-0 group-hover:max-h-[150px] sm:group-hover:max-h-[200px] opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0"
                    style={{ transitionDelay: '0.1s' }}
                >
                    <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed mb-2 sm:mb-3 group-hover:text-blue-50">
                        {description}
                    </p>

                    <a
                        href={href}
                        className="inline-flex items-center text-blue-300 hover:text-blue-100 text-xs sm:text-sm md:text-base group transition-all duration-300"
                        style={{ transitionDelay: '0.2s' }}
                    >
                        <span className="mr-1 sm:mr-2">En savoir plus</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 transform transition-transform duration-300 group-hover:translate-x-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Effet de bordure au survol */}
            <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/50 rounded-2xl transition-colors duration-500"></div>

            {/* Effet lumineux dans le coin supérieur droit au survol */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/0 group-hover:bg-blue-400/10 rounded-full blur-xl transition-all duration-700 ease-in-out transform group-hover:scale-150"></div>
        </motion.div>
    );

    // Wrapper conditionnel : Link sur mobile/tablet, div normale sur desktop
    return (
        <>
            {/* Version mobile/tablet - carte cliquable */}
            <div className="md:hidden w-full h-full">
                <Link href={href} className="block w-full h-full">
                    {cardContent}
                </Link>
            </div>

            {/* Version desktop - comportement actuel */}
            <div className="hidden md:block w-full h-full">{cardContent}</div>
        </>
    );
}
