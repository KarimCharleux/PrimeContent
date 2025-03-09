'use client';
import { useRef, useEffect } from 'react';
import gsap from '../lib/gsap-config';

interface AnimatedStatProps {
  value: number;
  prefix?: string;
  suffix?: string;
  description: string;
  className?: string;
  isPercentage?: boolean;
}

export default function AnimatedStat({
  value,
  prefix = '+',
  suffix = '',
  description,
  className = '',
  isPercentage = false
}: AnimatedStatProps) {
  const statRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statRef.current || !numberRef.current) return;

    // Animation d'entrée
    gsap.fromTo(
      statRef.current,
      {
        y: 30,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        scrollTrigger: {
          trigger: statRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );

    // Animation du compteur
    const obj = { val: 0 };
    
    gsap.to(obj, {
      val: value,
      duration: 2,
      delay: 0.3,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: statRef.current,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      onUpdate: function() {
        if (numberRef.current) {
          numberRef.current.textContent = `${prefix}${Math.round(obj.val)}${isPercentage ? '%' : suffix}`;
        }
      }
    });
  }, [value, prefix, suffix, isPercentage]);

  return (
    <div ref={statRef} className={`stat-item text-center opacity-0 ${className}`}>
      <div 
        ref={numberRef} 
        className="text-5xl md:text-6xl font-bold mb-4 stat-number"
      >
        {prefix}{value}{isPercentage ? '%' : suffix}
      </div>
      <div className="text-sm md:text-base font-light text-center">
        {description}
      </div>
    </div>
  );
} 