'use client';

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid from '../components/PortfolioGrid';

// Importation des styles
import './videos.scss';

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

export default function VideosPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    const [videos, setVideos] = useState<any[]>([]);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const videosCollection = collection(db, 'videos');
                const videosQuery = query(videosCollection, orderBy('order', 'asc'));
                const videosSnapshot = await getDocs(videosQuery);

                if (!videosSnapshot.empty) {
                    const fetchedVideos = videosSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        isVideo: true,
                    }));
                    setVideos(fetchedVideos);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des vidéos:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideos();
    }, []);

    useEffect(() => {
        // Simuler un chargement
        const loadingTimer = setTimeout(() => {
            setIsLoading(false);
        }, 600);

        // Activer les animations après un délai
        const animationTimer = setTimeout(() => {
            setShouldStartAnimations(true);
        }, 100);

        return () => {
            clearTimeout(loadingTimer);
            clearTimeout(animationTimer);
        };
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
                        <h1 className="page-title underline-title">VIDÉOS</h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={
                            shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }
                        }
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                        className="page-subtitle"
                    >
                        Réalisation / écriture, Tournage, Montage / VFX, Étalonnage
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
                            <PortfolioGrid projects={videos} showFilter={true} />
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
