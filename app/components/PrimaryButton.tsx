'use client';
import { useRef, useEffect } from 'react';
import Link from 'next/link';
import ScrambleText from './ScrambleText';
import gsap from '../lib/gsap-config';
import '../styles/primary-button.scss';

interface PrimaryButtonProps {
  readonly text: string;
  readonly href?: string;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly animateOnMount?: boolean;
  readonly icon?: React.ReactNode;
  readonly delay?: number;
}

export default function PrimaryButton({
  text,
  href,
  className = '',
  onClick,
  animateOnMount = false,
  icon,
  delay = 0
}: PrimaryButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Masquer le bouton immédiatement au montage du composant
  useEffect(() => {
    if (animateOnMount && containerRef.current) {
      // Masquer le bouton immédiatement
      gsap.set(containerRef.current, { 
        y: 30, 
        opacity: 0,
        scale: 0.95
      });
    }
  }, []); // Ce useEffect s'exécute une seule fois au montage

  // Animation d'entrée avec délai
  useEffect(() => {
    if (animateOnMount && containerRef.current) {
      // Animation d'entrée avec timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      tl.to(containerRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        delay: delay
      });
    }
  }, [animateOnMount, delay]); // Ajout des dépendances animateOnMount et delay

  // Icône de flèche par défaut
  const defaultIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );

  // Classes de base pour le bouton
  const buttonClasses = `primary-button-content ${className}`;

  // Si un lien est fourni, rendre un composant Link
  if (href) {
    return (
      <div ref={containerRef} className="primary-button-container" style={animateOnMount ? {opacity: 0} : undefined}>
        <Link
          href={href}
          ref={buttonRef as React.RefObject<HTMLAnchorElement>}
          className={buttonClasses}
          onClick={onClick}
        >
          <ScrambleText text={text} className="inline-block w-40 hover:font-bold transition-all duration-300" />
          <span className="ml-2">{icon || defaultIcon}</span>
        </Link>
        <span className="animated-border"></span>
      </div>
    );
  }

  // Sinon, rendre un bouton standard
  return (
    <div ref={containerRef} className="primary-button-container" style={animateOnMount ? {opacity: 0} : undefined}>
      <button
        ref={buttonRef as React.RefObject<HTMLButtonElement>}
        className={buttonClasses}
        onClick={onClick}
      >
        <ScrambleText text={text} className="inline-block w-40 hover:font-bold transition-all duration-300" />
        <span className="ml-2">{icon || defaultIcon}</span>
      </button>
      <span className="animated-border"></span>
    </div>
  );
} 