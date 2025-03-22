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
      
      // Mesurer d'abord avec le poids normal
      tempSpan.style.fontWeight = '400';
      tempSpan.textContent = text;
      document.body.appendChild(tempSpan);
      const normalWidth = tempSpan.offsetWidth;
      
      // Puis avec le poids medium pour s'assurer que le texte ne bouge pas pendant l'animation
      tempSpan.style.fontWeight = '500';
      const mediumWidth = tempSpan.offsetWidth;
      
      // Prendre la largeur la plus grande + padding
      const width = Math.max(normalWidth, mediumWidth) + 10;
      
      // Nettoyer l'élément temporaire
      document.body.removeChild(tempSpan);
      
      if (width > 0) {
        setTextWidth(width);
      }
    }
  }, [text]); // Recalculer si le texte change
  
  useEffect(() => {
    if (!textRef.current) return;
    
    // Réinitialiser l'état d'animation complétée lorsque le survol change
    if (!isParentHovered) {
      setAnimationCompleted(false);
      // Si le bouton n'est plus survolé et que le texte est animé, restaurer le texte d'origine
      if (textRef.current.textContent !== text) {
        gsap.to(textRef.current, {
          duration: 0.3, // Ralenti pour une transition plus fluide
          text: text,
          color: "inherit", // Retour à la couleur d'origine
          ease: "power2.out"
        });
      }
    }
    
    // Ne lancer l'animation que si on est en survol, qu'aucune animation n'est en cours,
    // et que l'animation n'a pas déjà été complétée pour ce survol
    if (isParentHovered && !isAnimating && !animationCompleted) {
      setIsAnimating(true);
      
      // Créer une timeline pour l'animation
      const tl = gsap.timeline({
        onComplete: () => {
          setIsAnimating(false);
          setAnimationCompleted(true); // Marquer l'animation comme complétée
        }
      });
      
      // Caractères pour le brouillage - uniquement des minuscules pour respecter le style
      const chars = "abcdefghijklmnopqrstuvwxyz";
      
      // Ajouter une légère animation de couleur pour rendre l'effet plus visible
      tl.to(textRef.current, {
        duration: 0.1,
        fontWeight: "500", // Medium weight pendant l'animation
        ease: "power1.inOut"
      });
      
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
            // Remplacer les majuscules par des minuscules aléatoires
            randomChar = "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 26));
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
      
      // Phase 1: Brouillage complet (environ 0.24s)
      const scrambleSteps = 4; // Augmenté de 3 à 4
      const scrambleDuration = 0.06; // Augmenté de 0.03 à 0.06
      
      for (let i = 0; i < scrambleSteps; i++) {
        tl.to(textRef.current, {
          duration: scrambleDuration,
          text: getRandomText(),
          ease: "none"
        });
      }
      
      // Phase 2: Révélation progressive (environ 0.4s)
      const revealSteps = 5;
      const revealDuration = 0.08; // Augmenté de 0.04 à 0.08
      
      for (let i = 0; i < revealSteps; i++) {
        const progress = (i + 1) / revealSteps;
        tl.to(textRef.current, {
          duration: revealDuration,
          text: getPartialText(progress),
          ease: "power1.out" // Ajoute une accélération
        });
      }
      
      // S'assurer que le texte final est correct et restaurer la couleur
      tl.to(textRef.current, {
        duration: 0.1,
        text: text,
        color: "inherit",
        fontWeight: "inherit", // Retour au poids de police d'origine
        ease: "power1.out"
      });
    }
  }, [isParentHovered, text, isAnimating, animationCompleted]);

  const styles = {
    display: 'inline-block',
    width: textWidth ? `${textWidth}px` : 'auto',
    whiteSpace: 'nowrap' as const,
    overflow: 'visible' as const, // Changé de 'hidden' à 'visible' pour éviter le croppage
    textOverflow: 'clip' as const // Changé de 'ellipsis' à 'clip'
  };
  
  if (href) {
    return (
      <Link 
        href={href}
        className={className}
      >
        <span ref={textRef} style={styles}>{text}</span>
      </Link>
    );
  }
  
  return (
    <span 
      ref={textRef}
      className={className}
      style={styles}
    >
      {text}
    </span>
  );
} 