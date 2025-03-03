'use client';
import { useRef, useEffect } from 'react';
import Link from 'next/link';
import ScrambleText from './ScrambleText';
import gsap from '../lib/gsap-config';
import '../styles/primary-button.scss';
import { motion } from 'framer-motion';
import { useAnimationControl } from '../hooks/useAnimationControl';

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
  const shouldAnimate = useAnimationControl();

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

  const buttonVariants = {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: delay,
      },
    },
  };

  // Si un lien est fourni, rendre un composant Link
  if (href) {
    return (
      <motion.div
        initial={animateOnMount ? "hidden" : "visible"}
        animate={shouldAnimate ? "visible" : "hidden"}
        variants={buttonVariants}
        className={`primary-button-container ${className}`}
      >
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
      </motion.div>
    );
  }

  // Sinon, rendre un bouton standard
  return (
    <motion.div
      initial={animateOnMount ? "hidden" : "visible"}
      animate={shouldAnimate ? "visible" : "hidden"}
      variants={buttonVariants}
      className={`primary-button-container ${className}`}
    >
      <button
        ref={buttonRef as React.RefObject<HTMLButtonElement>}
        className={buttonClasses}
        onClick={onClick}
      >
        <ScrambleText text={text} className="inline-block w-40 hover:font-bold transition-all duration-300" />
        <span className="ml-2">{icon || defaultIcon}</span>
      </button>
      <span className="animated-border"></span>
    </motion.div>
  );
} 