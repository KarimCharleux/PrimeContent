'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';

import { getMediaUrl } from '../../utils/mediaUrl';

import styles from './TeamCard.module.scss';

// Variants pour les animations
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            delay: custom * 0.1,
            ease: [0.25, 0.1, 0.25, 1],
        },
    }),
};

interface TeamCardProps {
    readonly imageSrc?: string;
    readonly name: string;
    readonly title: string;
    readonly description: string;
    readonly index: number;
}

export default function TeamCard({ imageSrc, name, title, description, index }: TeamCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();

        // Calculer la position relative du curseur par rapport à la carte
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculer la rotation en fonction de la position du curseur
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;

        // Appliquer la transformation
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;

        // Effet d'éclairage pour la bordure
        const shine = card.querySelector(`.${styles.cardShine}`) as HTMLElement;
        if (shine) {
            const percentX = (x / rect.width) * 100;
            const percentY = (y / rect.height) * 100;
            shine.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%)`;
        }
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;

        // Réinitialiser la transformation
        cardRef.current.style.transform =
            'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';

        // Réinitialiser l'effet d'éclairage
        const shine = cardRef.current.querySelector(`.${styles.cardShine}`) as HTMLElement;
        if (shine) {
            shine.style.background = 'none';
        }
    };

    return (
        <motion.div
            ref={cardRef}
            className={styles.teamCard}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            variants={fadeInUp}
            custom={index}
        >
            <div className={styles.cardInner}>
                <div className={styles.cardShine}></div>
                <div className={styles.imageContainer}>
                    {imageSrc ? (
                        <Image
                            src={getMediaUrl(imageSrc)}
                            alt={name}
                            className={styles.teamImage}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: 'cover' }}
                        />
                    ) : (
                        <div className={styles.placeholderImage}>
                            <div className={styles.placeholderIcon}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-16 h-16"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.teamOverlay}>
                    <div className={styles.teamInfo}>
                        <h3 className={styles.teamName}>{name}</h3>
                        <div className={styles.teamTitle}>{title}</div>
                        <p className={styles.teamDescription}>{description}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
