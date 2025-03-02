'use client';
import { useRef, useEffect } from 'react';
import Link from 'next/link';
import ScrambleText from './ScrambleText';
import gsap from '../lib/gsap-config';

interface PrimaryButtonProps {
  text: string;
  href?: string;
  className?: string;
  onClick?: () => void;
  animateOnMount?: boolean;
  icon?: React.ReactNode;
}

export default function PrimaryButton({
  text,
  href,
  className = '',
  onClick,
  animateOnMount = false,
  icon
}: PrimaryButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  useEffect(() => {
    if (animateOnMount && buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      );
    }
  }, [animateOnMount]);

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
  const baseClasses = "px-8 py-4 w-72 bg-white text-black hover:bg-gray-200 rounded-full transition duration-300 transform flex items-center justify-center space-x-2";
  const buttonClasses = `${baseClasses} ${className}`;

  // Si un lien est fourni, rendre un composant Link
  if (href) {
    return (
      <Link
        href={href}
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        className={buttonClasses}
        onClick={onClick}
      >
        <ScrambleText text={text} className="inline-block w-40 hover:font-bold transition-all duration-300" />
        <span className="ml-2">{icon || defaultIcon}</span>
      </Link>
    );
  }

  // Sinon, rendre un bouton standard
  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      className={buttonClasses}
      onClick={onClick}
    >
      <ScrambleText text={text} className="inline-block w-40 hover:font-bold transition-all duration-300" />
      <span className="ml-2">{icon || defaultIcon}</span>
    </button>
  );
} 