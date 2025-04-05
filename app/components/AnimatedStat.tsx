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
    delay?: number;
}

export default function AnimatedStat({
    value,
    prefix = '+',
    suffix = '',
    description,
    className = '',
    isPercentage = false,
    delay = 0,
}: AnimatedStatProps) {
    const statRef = useRef<HTMLDivElement>(null);
    const numberRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!statRef.current || !numberRef.current || !glowRef.current) return;

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
                delay: delay,
                scrollTrigger: {
                    trigger: statRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none none',
                },
            },
        );

        // Animation du compteur
        const obj = { val: 0 };

        gsap.to(obj, {
            val: value,
            duration: 2,
            delay: delay + 0.3,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: statRef.current,
                start: 'top 80%',
                toggleActions: 'play none none none',
            },
            onUpdate: function () {
                if (numberRef.current) {
                    numberRef.current.textContent = `${prefix}${Math.round(obj.val)}${isPercentage ? '%' : suffix}`;
                }
            },
        });

        // Animation simple du halo lumineux (apparition uniquement)
        gsap.fromTo(
            glowRef.current,
            {
                opacity: 0,
            },
            {
                opacity: 0.6,
                duration: 1.5,
                delay: delay + 0.5,
                scrollTrigger: {
                    trigger: statRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none none',
                },
            },
        );
    }, [value, prefix, suffix, isPercentage, delay]);

    return (
        <div ref={statRef} className={`stat-item text-center opacity-0 ${className}`}>
            <div className="relative">
                {/* Halo lumineux blanc statique */}
                <div
                    ref={glowRef}
                    className="absolute inset-0 rounded-full opacity-0 blur-xl z-0"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'scale(1.3)',
                    }}
                ></div>

                {/* Chiffre */}
                <div
                    ref={numberRef}
                    className="text-5xl md:text-6xl font-bold mb-4 stat-number relative z-10"
                >
                    {prefix}
                    {value}
                    {isPercentage ? '%' : suffix}
                </div>
            </div>

            <div className="text-sm md:text-base font-light text-center relative z-10">
                {description}
            </div>
        </div>
    );
}
