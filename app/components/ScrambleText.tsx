'use client';
import { useRef, useState, useEffect } from 'react';
import gsap from '../lib/gsap-config';
import Link from 'next/link';

interface ScrambleTextProps {
  text: string;
  href?: string;
  className?: string;
  isParentHovered?: boolean;
}

export default function ScrambleText({ text, href, className = '', isParentHovered = false }: ScrambleTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [textWidth, setTextWidth] = useState<number | null>(null);
  
  // Calculer la largeur du texte pour la maintenir constante
  useEffect(() => {
    if (textRef.current) {
      // Créer un élément temporaire pour mesurer exactement le texte
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'nowrap';
      
      // Copier les styles pertinents du texte de référence
      const styles = window.getComputedStyle(textRef.current);
      tempSpan.style.fontFamily = styles.fontFamily;
      tempSpan.style.fontSize = styles.fontSize;
      tempSpan.style.letterSpacing = styles.letterSpacing;
      
      // Mesurer avec le poids normal puis medium
      tempSpan.style.fontWeight = '400';
      tempSpan.textContent = text;
      document.body.appendChild(tempSpan);
      const normalWidth = tempSpan.offsetWidth;
      
      tempSpan.style.fontWeight = '500';
      const mediumWidth = tempSpan.offsetWidth;
      
      // Prendre la largeur la plus grande + padding
      const width = Math.max(normalWidth, mediumWidth) + 10;
      
      document.body.removeChild(tempSpan);
      
      if (width > 0) {
        setTextWidth(width);
      }
    }
  }, [text]);
  
  useEffect(() => {
    if (!textRef.current) return;
    
    // Réinitialiser l'animation lorsque le survol change
    if (!isParentHovered) {
      setAnimationCompleted(false);
      // Restaurer le texte d'origine si différent
      if (textRef.current.textContent !== text) {
        gsap.to(textRef.current, {
          duration: 0.3,
          text: text,
          color: "inherit",
          fontWeight: "inherit",
          ease: "power2.out"
        });
      }
      return;
    }
    
    // Lancer l'animation au survol si aucune animation en cours
    if (isParentHovered && !isAnimating && !animationCompleted) {
      setIsAnimating(true);
      
      const tl = gsap.timeline({
        onComplete: () => {
          setIsAnimating(false);
          setAnimationCompleted(true);
        }
      });
      
      const chars = "abcdefghijklmnopqrstuvwxyz";
      
      // Commencer l'animation
      tl.to(textRef.current, {
        duration: 0.1,
        fontWeight: "500",
        ease: "power1.inOut"
      });
      
      // Fonction pour mélanger le texte
      const getRandomText = () => {
        return text.split('').map(char => 
          char === ' ' ? ' ' : chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
      };
      
      // Fonction pour révéler progressivement le texte original
      const getPartialText = (progress: number) => {
        const revealLength = Math.floor(text.length * progress);
        
        return text.split('').map((char, index) => {
          if (index < revealLength) return char;
          if (char === ' ') return ' ';
          return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join('');
      };
      
      // Phase 1: Brouillage complet
      const scrambleSteps = 4;
      const scrambleDuration = 0.06;
      
      for (let i = 0; i < scrambleSteps; i++) {
        tl.to(textRef.current, {
          duration: scrambleDuration,
          text: getRandomText(),
          ease: "none"
        });
      }
      
      // Phase 2: Révélation progressive
      const revealSteps = 5;
      const revealDuration = 0.08;
      
      for (let i = 0; i < revealSteps; i++) {
        const progress = (i + 1) / revealSteps;
        tl.to(textRef.current, {
          duration: revealDuration,
          text: getPartialText(progress),
          ease: "power1.out"
        });
      }
      
      // Finalisation
      tl.to(textRef.current, {
        duration: 0.1,
        text: text,
        color: "inherit",
        fontWeight: "inherit",
        ease: "power1.out"
      });
    }
  }, [isParentHovered, text, isAnimating, animationCompleted]);

  const styles = {
    display: 'inline-block',
    width: textWidth ? `${textWidth}px` : 'auto',
    whiteSpace: 'nowrap' as const,
    overflow: 'visible' as const,
    textOverflow: 'clip' as const
  };
  
  if (href) {
    return (
      <Link href={href} className={className}>
        <span ref={textRef} style={styles}>{text}</span>
      </Link>
    );
  }
  
  return (
    <span ref={textRef} className={className} style={styles}>
      {text}
    </span>
  );
} 