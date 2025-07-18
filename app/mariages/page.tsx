'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid from '../components/PortfolioGrid';
import { useMariagesData } from '../hooks/useMariagesData';
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
            ease: [0.25, 0.1, 0.25, 1],
        },
    }),
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.3,
        },
    },
};

// Composant séparé qui utilise useSearchParams
function MariagesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Charger les données depuis Firebase
    const { portfolioData, testimonialsData, loading: dataLoading, error } = useMariagesData();

    // États pour contrôler le démarrage des animations
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    // État pour le chargement
    const [isLoading, setIsLoading] = useState(true);

    // Gestion du filtre actif depuis les query params
    const [activeFilter, setActiveFilter] = useState('Tout');

    // Mettre à jour le filtre depuis les query params
    useEffect(() => {
        const filter = searchParams?.get('couple');
        if (filter) {
            // Décoder le nom du couple depuis l'URL
            const decodedFilter = decodeURIComponent(filter).replace(/-/g, ' ');
            setActiveFilter(decodedFilter);
        } else {
            setActiveFilter('Tout');
        }
    }, [searchParams]);

    // Fonction pour gérer le changement de filtre et mettre à jour l'URL
    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);

        if (filter === 'Tout') {
            // Supprimer le query param si on sélectionne "Tout"
            router.push('/mariages', { scroll: false });
        } else {
            // Encoder le nom du couple pour l'URL
            const encodedFilter = encodeURIComponent(filter.replace(/\s+/g, '-'));
            router.push(`/mariages?couple=${encodedFilter}`, { scroll: false });
        }
    };

    // Vérifier si le SplashScreen est terminé ou si on vient d'une autre page
    useEffect(() => {
        // Attendre que les données soient chargées
        if (!dataLoading) {
            setTimeout(() => {
                setIsLoading(false);
            }, 600);
        }

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
    }, [dataLoading]);

    return (
        <main className="global-main-page">
            <Header />
            <section className="hero-section text-center py-16">
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
                    className="max-w-3xl mx-auto page-subtitle text-gray-200"
                >
                    Immortalisez votre grand jour avec des photos inoubliables ✨
                </motion.p>

                {/* Section Portfolio avec PortfolioGrid */}
                <div className="container mx-auto">
                    {isLoading || dataLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Réessayer
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate={shouldStartAnimations ? 'visible' : 'hidden'}
                            variants={fadeInUp}
                            className="portfolio-container"
                        >
                            <PortfolioGrid
                                projects={portfolioData}
                                showFilter={true}
                                activeFilter={activeFilter}
                                onFilterChange={handleFilterChange}
                            />
                        </motion.div>
                    )}
                </div>
            </section>

            <section className="testimonials-section">
                <motion.div
                    className="testimonials-grid"
                    initial="hidden"
                    animate={shouldStartAnimations ? 'visible' : 'hidden'}
                    variants={staggerContainer}
                >
                    {testimonialsData.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            className="testimonial-card"
                            variants={fadeInUp}
                            custom={index}
                            onClick={() => handleFilterChange(testimonial.coupleName)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="couple-images">
                                <Image
                                    src={getMediaUrl(testimonial.coupleImages.person1)}
                                    alt={`Photo de ${testimonial.coupleName.split(' & ')[0]}`}
                                    width={80}
                                    height={80}
                                    className="object-cover rounded-full overflow-hidden h-20 w-20"
                                />
                                <Image
                                    src={getMediaUrl('/mariages/link.svg')}
                                    alt="Link"
                                    width={116}
                                    height={78}
                                    className="h-20 w-28"
                                />
                                <Image
                                    src={getMediaUrl(testimonial.coupleImages.person2)}
                                    alt={`Photo de ${testimonial.coupleName.split(' & ')[1]}`}
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

// Composant de fallback pour Suspense
function MariagesPageFallback() {
    return (
        <main className="global-main-page">
            <Header />
            <section className="hero-section text-center py-16">
                <div className="title-container relative overflow-hidden">
                    <h1 className="page-title underline-title">MARIAGES</h1>
                </div>
                <p className="max-w-3xl mx-auto page-subtitle text-gray-200">
                    Immortalisez votre grand jour avec des photos inoubliables ✨
                </p>
                <div className="container mx-auto">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
}

// Composant principal qui enveloppe tout dans Suspense
export default function MariagesPage() {
    return (
        <Suspense fallback={<MariagesPageFallback />}>
            <MariagesContent />
        </Suspense>
    );
}
