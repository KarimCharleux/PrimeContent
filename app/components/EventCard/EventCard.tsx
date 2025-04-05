'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import styles from './EventCard.module.scss';
import { getMediaUrl } from '@/app/utils/mediaUrl';

// Variants pour les animations
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: custom * 0.1,
      ease: [0.25, 0.1, 0.25, 1]
    }
  })
};

interface EventCardProps {
  readonly href: string;
  readonly imageSrc: string;
  readonly title: string;
  readonly date?: string;
  readonly location?: string;
  readonly category?: string;
  readonly index: number;
}

export default function EventCard({ 
  href, 
  imageSrc, 
  title, 
  date, 
  location, 
  category, 
  index 
}: EventCardProps) {
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
      const percentX = x / rect.width * 100;
      const percentY = y / rect.height * 100;
      shine.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%)`;
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    
    // Réinitialiser la transformation
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    
    // Réinitialiser l'effet d'éclairage
    const shine = cardRef.current.querySelector(`.${styles.cardShine}`) as HTMLElement;
    if (shine) {
      shine.style.background = 'none';
    }
  };

  return (
    <Link href={href}>
      <motion.div 
        ref={cardRef}
        className={styles.evenementCard}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        variants={fadeInUp}
        custom={index}
      >
        <div className={styles.cardInner}>
          <div className={styles.cardShine}></div>
          <div className={styles.imageContainer}>
            <Image 
              src={getMediaUrl(imageSrc)}
              alt={title} 
              className={styles.evenementImage}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className={styles.evenementOverlay}>
            <div className={styles.metaInfo}>
              {date && (
                <div className={styles.metaItem}>
                  <svg className={styles.metaIcon} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className={styles.metaText}>{date}</span>
                </div>
              )}
              {location && (
                <div className={styles.metaItem}>
                  <svg className={styles.metaIcon} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className={styles.metaText}>{location}</span>
                </div>
              )}
            </div>
            <h3 className={styles.eventTitle}>{title}</h3>
            {category && <div className={styles.eventCategory}>{category}</div>}
          </div>
        </div>
      </motion.div>
    </Link>
  );
} 