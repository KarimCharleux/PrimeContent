'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import gsap from '../../lib/gsap-config';
import PrimaryButton from '../PrimaryButton';

import styles from './footer.module.scss';

interface FooterProps {
  readonly hideCTA?: boolean;
}

export default function Footer({ hideCTA = false }: FooterProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const socialRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    // Animation du titre et du texte
    if (!hideCTA && titleRef.current && textRef.current) {
      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        textRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.2,
          scrollTrigger: {
            trigger: textRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // Animation des icônes sociales
    if (socialRefs.current.length > 0) {
      socialRefs.current.forEach((icon, index) => {
        if (icon) {
          gsap.fromTo(
            icon,
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              delay: 0.1 * index,
              ease: 'back.out(1.7)',
              scrollTrigger: {
                trigger: icon,
                start: 'top 90%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });
    }
  }, [hideCTA]);

  const addSocialRef = (el: HTMLAnchorElement | null, index: number) => {
    socialRefs.current[index] = el;
  };

  return (
    <footer className={styles["footer-container"]}>
      {/* Section CTA - conditionnellement affichée */}
      {!hideCTA && (
        <div className={styles["cta-section"]}>
          <h2 ref={titleRef} className={styles["cta-title"]}>Boostez Votre Présence Aujourd&apos;hui !</h2>
          <p ref={textRef} className={styles["cta-text"]}>
            Votre image mérite d&apos;être vue, entendue, ressentie. Rejoignez <b className="primecontent-title">Prime<span className="text-gray-400">content.</span></b> pour propulser votre présence visuelle et numérique au niveau supérieur.
          </p>
          <PrimaryButton 
            text="Contactez-nous" 
            href="/contact" 
            className={styles["cta-button"]}
          />
        </div>
      )}

      {/* Section Info */}
      <div className={styles["info-section"]}>
        <div className={styles["company-info"]}>
          <p className={styles["company-description"]}>
            <span className="primecontent-title">Prime<span className="text-gray-400">content.</span></span> est une agence de production basée à Paris
          </p>
          
          <div className={styles["social-links"]}>
            <span className={styles.social}>
              <Link 
                href="https://www.instagram.com/dali.ayaida" 
                ref={(el) => addSocialRef(el, 0)}
                className="flex items-center gap-2"
                aria-label="Instagram"
              >
                <span className={styles["social-icon"]}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </span>
                @dali.ayaida
              </Link>
            </span>

            <span className={styles.social}>
              <Link 
                href="https://www.instagram.com/primecontent.fr" 
                ref={(el) => addSocialRef(el, 0)}
                className="flex items-center gap-2"
                aria-label="Instagram"
              >
                <span className={styles["social-icon"]}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </span>
                @primecontent.fr
              </Link>
            </span>
          </div>
        </div>
        
        <div className={styles["contact-info"]}>
          <a href="mailto:contact@primecontent.fr" className={styles["contact-email"]}>
            <span className={styles["contact-icon"]}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
            </span>
            contact@primecontent.fr
          </a>
          <a href="tel:+33649095795" className={styles["contact-phone"]}>
            <span className={styles["contact-icon"]}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
              </svg>
            </span>
            +33 6 49 09 57 95
          </a>
        </div>
      </div>

      {/* Section Copyright */}
      <div className={styles["copyright-section"]}>
        <div className={styles["copyright-content"]}>
          <p className={styles["brand-name"]}>
            <span className="text-white">Prime</span><span className="text-gray-400">content.</span>
          </p>
          <p className={styles["copyright-text"]}>© 2024 <span className="primecontent-title">Primecontent</span>. All rights reserved</p>
        </div>
      </div>
    </footer>
  );
} 