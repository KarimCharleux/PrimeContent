'use client';
import { useRef, useState, useEffect } from 'react';
import gsap from '../lib/gsap-config';
import Link from 'next/link';

interface ScrambleTextProps {
  text: string;
  href?: string;
  className?: string;
}

export default function ScrambleText({ text, href, className = '' }: ScrambleTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  
  // Calculer la largeur du texte pour la maintenir constante
  useEffect(() => {
    if (textRef.current) {
      // Appliquer une largeur fixe basée sur le contenu initial
      const width = textRef.current.offsetWidth;
      if (width > 0) {
        textRef.current.style.display = 'inline-block';
        textRef.current.style.minWidth = `${width}px`;
      }
    }
  }, []);
  
  useEffect(() => {
    if (!textRef.current) return;
    
    // Réinitialiser l'état d'animation complétée lorsque le survol change
    if (!isHovered) {
      setAnimationCompleted(false);
    }
    
    // Ne lancer l'animation que si on est en survol, qu'aucune animation n'est en cours,
    // et que l'animation n'a pas déjà été complétée pour ce survol
    if (isHovered && !isAnimating && !animationCompleted) {
      setIsAnimating(true);
      
      // Créer une timeline pour l'animation
      const tl = gsap.timeline({
        onComplete: () => {
          setIsAnimating(false);
          setAnimationCompleted(true); // Marquer l'animation comme complétée
        }
      });
      
      // Caractères pour le brouillage - utiliser des caractères de largeur similaire
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      
      // Fonction pour générer un texte partiellement révélé
      const getPartialText = (progress: number) => {
        const revealLength = Math.floor(text.length * progress);
        let result = '';
        
        // Partie révélée (texte original)
        for (let i = 0; i < revealLength; i++) {
          result += text[i];
        }
        
        // Partie brouillée (caractères aléatoires)
        for (let i = revealLength; i < text.length; i++) {
          // Essayer de maintenir la même largeur en choisissant des caractères similaires
          const originalChar = text[i];
          let randomChar;
          
          if (originalChar === ' ') {
            // Garder les espaces pour maintenir la structure du mot
            randomChar = ' ';
          } else if (/[A-Z]/.test(originalChar)) {
            // Remplacer les majuscules par des majuscules
            randomChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(Math.random() * 26));
          } else if (/[a-z]/.test(originalChar)) {
            // Remplacer les minuscules par des minuscules
            randomChar = "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 26));
          } else if (/[0-9]/.test(originalChar)) {
            // Remplacer les chiffres par des chiffres
            randomChar = "0123456789".charAt(Math.floor(Math.random() * 10));
          } else {
            // Autres caractères
            randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          result += randomChar;
        }
        
        return result;
      };
      
      // Fonction pour générer un texte complètement brouillé
      const getRandomText = () => {
        let result = '';
        for (let j = 0; j < text.length; j++) {
          // Préserver les espaces pour maintenir la structure du mot
          if (text[j] === ' ') {
            result += ' ';
          } else {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
        }
        return result;
      };
      
      // Phase 1: Brouillage complet (environ 0.3s)
      const scrambleSteps = 6;
      const scrambleDuration = 0.05;
      
      for (let i = 0; i < scrambleSteps; i++) {
        tl.to(textRef.current, {
          duration: scrambleDuration,
          text: getRandomText(),
          ease: "none"
        });
      }
      
      // Phase 2: Révélation progressive (environ 0.5s)
      const revealSteps = 10;
      const revealDuration = 0.05;
      
      for (let i = 0; i < revealSteps; i++) {
        const progress = (i + 1) / revealSteps;
        tl.to(textRef.current, {
          duration: revealDuration,
          text: getPartialText(progress),
          ease: "none"
        });
      }
      
      // S'assurer que le texte final est correct
      tl.to(textRef.current, {
        duration: 0.1,
        text: text,
        ease: "none"
      });
    }
  }, [isHovered, text, isAnimating, animationCompleted]);
  
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  if (href) {
    return (
      <Link 
        href={href}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span ref={textRef} style={{ display: 'inline-block' }}>{text}</span>
      </Link>
    );
  }
  
  return (
    <span 
      ref={textRef}
      className={className}
      style={{ display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </span>
  );
} 