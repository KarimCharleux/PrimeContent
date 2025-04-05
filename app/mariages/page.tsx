'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid from '../components/PortfolioGrid';
import { mariagesPortfolioData, mariagesTestimonialsData } from '../data/mariagesData';
import './mariages.scss';
import { getMediaUrl } from '../utils/mediaUrl';

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
    // État pour le chargement
    const [isLoading, setIsLoading] = useState(true);
    
    // Vérifier si le SplashScreen est terminé ou si on vient d'une autre page
    useEffect(() => {
        // Simuler un chargement
        setTimeout(() => {
            setIsLoading(false);
        }, 600);
        
        // Vérifie si le splash screen est terminé via le localStorage
        const checkSplashScreen = () => {
            const splashScreenComplete = localStorage.getItem('splashScreenComplete');
            
            // Si on vient du SplashScreen
            if (splashScreenComplete === 'true') {
                setShouldStartAnimations(true);
                localStorage.removeItem('splashScreenComplete');
                // Réinitialiser la position de défilement à 0
                window.scrollTo(0, 0);
            } 
            // Si on vient d'une autre page (pas de SplashScreen)
            else if (splashScreenComplete !== 'waiting') {
                // On active les animations après un petit délai pour laisser la page se charger
                setTimeout(() => {
                    setShouldStartAnimations(true);
                }, 100);
            }
        };

        // Vérifie immédiatement et toutes les 100ms si le splash screen est terminé
        checkSplashScreen();
        const interval = setInterval(checkSplashScreen, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="global-main-page">
            <Header />
            <section className="hero-section text-center px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="title-container relative overflow-hidden"
                >
                    <motion.h1 
                        className="page-title underline-title"
                        initial={{ opacity: 0 }}
                        animate={shouldStartAnimations ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        MARIAGES
                    </motion.h1>
                </motion.div>
                
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="max-w-3xl mx-auto text-base md:text-lg text-gray-200"
                >
                    Nous vous accompagnons dans votre grand jour pour capturer en photos chaque moment précieux et 
                    créer des souvenirs intemporels ✨
                </motion.p>
            </section>

            {/* Section Portfolio avec PortfolioGrid */}
            <section className="px-4 py-8">
                <div className="container mx-auto">
                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate={shouldStartAnimations ? "visible" : "hidden"}
                            variants={fadeInUp}
                            className="portfolio-container"
                        >
                            <PortfolioGrid projects={mariagesPortfolioData} showFilter={true} />
                        </motion.div>
                    )}
                </div>
            </section>

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
                                    src={getMediaUrl(testimonial.coupleImages.person1)}
                                    alt={`Photo de ${testimonial.coupleName.split('&')[0]}`}
                                    width={80}
                                    height={80}
                                    className="object-cover rounded-full overflow-hidden h-20 w-20"
                                />
                                <Image src={getMediaUrl('/mariages/link.svg')} alt="Link" width={116} height={78} className="h-20 w-28"/>
                                <Image
                                    src={getMediaUrl(testimonial.coupleImages.person2)}
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