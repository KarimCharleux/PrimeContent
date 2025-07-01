'use client';

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid, { Project } from '../components/PortfolioGrid';

// Importation des styles
import './realisations.scss';

// Variants pour les animations
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
};

export default function RealisationsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    const [realisations, setRealisations] = useState<Project[]>([]);

    useEffect(() => {
        // Récupérer les réalisations depuis Firebase
        const fetchRealisations = async () => {
            try {
                setIsLoading(true);

                // Récupérer les photos
                const photosCollection = collection(db, 'realisations-photos');
                const photosQuery = query(photosCollection, orderBy('order', 'asc'));
                const photosSnapshot = await getDocs(photosQuery);

                // Récupérer les vidéos
                const videosCollection = collection(db, 'realisations-videos');
                const videosQuery = query(videosCollection, orderBy('order', 'asc'));
                const videosSnapshot = await getDocs(videosQuery);

                const allRealisations: Project[] = [];

                // Ajouter les photos
                photosSnapshot.forEach((doc) => {
                    const data = doc.data();
                    allRealisations.push({
                        category: data.category || '',
                        source: data.url || '',
                        format: data.format || 'paysage',
                        title: data.title || '',
                        isVideo: false,
                        thumbnail: data.thumbnail,
                    });
                });

                // Ajouter les vidéos
                videosSnapshot.forEach((doc) => {
                    const data = doc.data();
                    allRealisations.push({
                        category: data.category || '',
                        source: data.url || '',
                        format: data.format || 'paysage',
                        title: data.title || '',
                        isVideo: true,
                        isYouTube: data.isYouTube || false,
                        youtubeId: data.youtubeId || '',
                        thumbnail: data.thumbnail,
                    });
                });

                // Trier par ordre (les photos et vidéos ont leurs propres ordres)
                setRealisations(allRealisations);
            } catch (error) {
                console.error('Erreur lors de la récupération des réalisations:', error);
            } finally {
                // Simuler un délai minimum pour éviter un flash de chargement
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        };

        fetchRealisations();

        // Vérifier si le SplashScreen est terminé ou si on vient d'une autre page
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

            <section className="px-4 py-16 min-h-screen">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={
                            shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }
                        }
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        className="title-container"
                    >
                        <h1 className="page-title underline-title">RÉALISATIONS</h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: -20 }}
                        animate={
                            shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }
                        }
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
                        className="description"
                    >
                        Découvrez notre portfolio complet de créations visuelles, photos et vidéos
                        réalisées pour nos clients.
                    </motion.p>

                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate={shouldStartAnimations ? 'visible' : 'hidden'}
                            variants={fadeIn}
                            className="portfolio-container"
                        >
                            <PortfolioGrid projects={realisations} showFilter={true} />
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
