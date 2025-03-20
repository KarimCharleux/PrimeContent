'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { mariagesGalleryData, mariagesTestimonialsData } from '../data/mariagesData';
import '../styles/mariages/mariages.scss';

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

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.3
        }
    }
};

export default function MariagesPage() {
    // État pour contrôler le démarrage des animations
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    
    // Référence pour le titre principal
    const titleRef = useRef<HTMLHeadingElement>(null);

    // Vérifier si le SplashScreen est terminé
    useEffect(() => {
        // Vérifie si le splash screen est terminé via le localStorage
        const checkSplashScreen = () => {
            const splashScreenComplete = localStorage.getItem('splashScreenComplete');
            if (splashScreenComplete === 'true') {
                setShouldStartAnimations(true);
                localStorage.removeItem('splashScreenComplete');
                // Réinitialiser la position de défilement à 0
                window.scrollTo(0, 0);
            }
        };

        // Vérifie immédiatement et toutes les 100ms si le splash screen est terminé
        checkSplashScreen();
        const interval = setInterval(checkSplashScreen, 100);

        // Animation du titre
        if (titleRef.current) {
            setTimeout(() => {
                titleRef.current?.classList.add('visible');
            }, 300);
        }

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="mariages-page pt-24 min-h-screen bg-black">
            <Header />

            <section className="hero-section text-center px-4 py-12">
                <h1 
                    ref={titleRef}
                    className="page-title underline-title"
                >
                    MARIAGES
                </h1>
                <p className="max-w-3xl mx-auto text-base md:text-lg text-gray-200">
                    Nous vous accompagnons dans votre grand jour pour capturer en photos chaque moment précieux et 
                    créer des souvenirs intemporels ✨
                </p>
            </section>

            <motion.div 
                className="gallery-grid"
                initial="hidden"
                animate={shouldStartAnimations ? "visible" : "hidden"}
                variants={staggerContainer}
            >
                {mariagesGalleryData.map((item, index) => (
                    <motion.div
                        key={item.id}
                        className={`gallery-item ${item.type === 'video' ? 'video-item' : ''}`}
                        variants={fadeInUp}
                        custom={index}
                    >
                        <Image
                            src={item.src}
                            alt={item.alt}
                            width={600}
                            height={600}
                            className="w-full h-full object-cover transition-transform duration-500"
                            priority={index < 4}
                        />
                        {item.type === 'video' && (
                            <div className="play-button">
                                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 5V19L19 12L8 5Z" />
                                </svg>
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            <section className="testimonials-section">
                <motion.div 
                    className="testimonials-grid"
                    initial="hidden"
                    animate={shouldStartAnimations ? "visible" : "hidden"}
                    variants={staggerContainer}
                >
                    {mariagesTestimonialsData.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            className="testimonial-card"
                            variants={fadeInUp}
                            custom={index}
                        >
                            <div className="couple-images">
                                <Image
                                    src={testimonial.coupleImages.person1}
                                    alt={`Photo de ${testimonial.coupleName.split('&')[0]}`}
                                    width={80}
                                    height={80}
                                    className="object-cover rounded-full overflow-hidden h-20 w-20"
                                />
                                <Image src="/mariages/link.svg" alt="Link" width={116} height={78} className="h-20 w-28"/>
                                <Image
                                    src={testimonial.coupleImages.person2}
                                    alt={`Photo de ${testimonial.coupleName.split('&')[1]}`}
                                    width={80}
                                    height={80}
                                    className="object-cover rounded-full overflow-hidden h-20 w-20"
                                />
                            </div>
                            <div className="text-base md:text-lg font-semibold mb-4 text-white">
                                {testimonial.coupleName}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>
            <Footer />
        </main>
    );
} 