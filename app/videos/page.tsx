'use client';

import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid from '../components/PortfolioGrid';
import { getVideoProvider, extractVideoId } from '../utils/videoManager';

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
    const [hasBackofficeVideos, setHasBackofficeVideos] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('Marques');

    useEffect(() => {
        const fetchAllVideos = async () => {
            try {
                // 1. Récupérer les vidéos du backoffice
                const videosCollection = collection(db, 'videos');
                const videosQuery = query(videosCollection, orderBy('order', 'asc'));
                const videosSnapshot = await getDocs(videosQuery);

                const backofficeVideos = videosSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    isVideo: true,
                    category: doc.data().category || '',
                }));

                // 2. Récupérer les vidéos des clients (célébrités)
                const clientVideosCollection = collection(db, 'client-videos');
                const clientVideosQuery = query(
                    clientVideosCollection,
                    where('clientType', '==', 'celebrity'),
                );
                const clientVideosSnapshot = await getDocs(clientVideosQuery);

                const celebrityVideos = clientVideosSnapshot.docs.map((doc) => {
                    const data = doc.data();

                    // Support de rétrocompatibilité avec l'ancien format
                    let provider = data.provider || 'youtube';
                    let source = data.source || data.youtubeUrl || '';
                    let videoId = data.videoId || data.youtubeId;

                    // Si pas de provider défini, essayer de le détecter
                    if (!data.provider && source) {
                        provider = getVideoProvider(source);
                        videoId = extractVideoId(source, provider);
                    }

                    return {
                        id: doc.id,
                        title: data.title || data.clientName || 'Vidéo célébrité',
                        category: 'Talents',
                        source,
                        provider,
                        videoId,
                        embedUrl: data.embedUrl,
                        watchUrl: data.watchUrl,
                        thumbnail: data.thumbnail,
                        format: data.format || 'paysage',
                        isVideo: true,
                        clientType: 'celebrity',
                        clientName: data.clientName,
                        order: data.order || 0,
                        // Propriétés de rétrocompatibilité
                        youtubeUrl: data.youtubeUrl,
                        youtubeId: data.youtubeId,
                        isYouTube: provider === 'youtube',
                    };
                });

                // 3. Récupérer les vidéos des marques
                const brandVideosQuery = query(
                    clientVideosCollection,
                    where('clientType', '==', 'brand'),
                );
                const brandVideosSnapshot = await getDocs(brandVideosQuery);

                const brandVideos = brandVideosSnapshot.docs.map((doc) => {
                    const data = doc.data();

                    // Support de rétrocompatibilité avec l'ancien format
                    let provider = data.provider || 'youtube';
                    let source = data.source || data.youtubeUrl || '';
                    let videoId = data.videoId || data.youtubeId;

                    // Si pas de provider défini, essayer de le détecter
                    if (!data.provider && source) {
                        provider = getVideoProvider(source);
                        videoId = extractVideoId(source, provider);
                    }

                    return {
                        id: doc.id,
                        title: data.title || data.clientName || 'Vidéo marque',
                        category: 'Marques',
                        source,
                        provider,
                        videoId,
                        embedUrl: data.embedUrl,
                        watchUrl: data.watchUrl,
                        thumbnail: data.thumbnail,
                        format: data.format || 'paysage',
                        isVideo: true,
                        clientType: 'brand',
                        clientName: data.clientName,
                        order: data.order || 0,
                        // Propriétés de rétrocompatibilité
                        youtubeUrl: data.youtubeUrl,
                        youtubeId: data.youtubeId,
                        isYouTube: provider === 'youtube',
                    };
                });

                // 4. Combiner toutes les vidéos
                const allVideos = [...backofficeVideos, ...celebrityVideos, ...brandVideos];

                console.log('Vidéos chargées:', {
                    backoffice: backofficeVideos.length,
                    celebrities: celebrityVideos.length,
                    brands: brandVideos.length,
                    total: allVideos.length,
                });

                setVideos(allVideos);
                setHasBackofficeVideos(backofficeVideos.length > 0);
                if (backofficeVideos.length > 0) {
                    setActiveFilter('Tout');
                } else {
                    setActiveFilter('Marques');
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des vidéos:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllVideos();
    }, []);

    useEffect(() => {
        // Simuler un chargement
        setTimeout(() => {
            setIsLoading(false);
        }, 600);

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

    const getSliderClass = (filter: string, hasBackoffice: boolean): string => {
        if (hasBackoffice) {
            if (filter === 'Tout') return 'pos-0';
            if (filter === 'Marques') return 'pos-1';
            return 'pos-2';
        }
        return filter === 'Marques' ? 'left' : 'right';
    };

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

                    {/* Toggle Marques / Talents */}
                    {!isLoading && (
                        <div className="videos-toggle">
                            <div
                                className={`toggle-container ${hasBackofficeVideos ? 'three-btns' : 'two-btns'}`}
                            >
                                {hasBackofficeVideos && (
                                    <button
                                        className={`toggle-btn ${activeFilter === 'Tout' ? 'active' : ''}`}
                                        onClick={() => setActiveFilter('Tout')}
                                    >
                                        Tout
                                    </button>
                                )}
                                <button
                                    className={`toggle-btn ${activeFilter === 'Marques' ? 'active' : ''}`}
                                    onClick={() => setActiveFilter('Marques')}
                                >
                                    Marques
                                </button>
                                <button
                                    className={`toggle-btn ${activeFilter === 'Talents' ? 'active' : ''}`}
                                    onClick={() => setActiveFilter('Talents')}
                                >
                                    Talents
                                </button>
                                <div
                                    className={`toggle-slider ${getSliderClass(activeFilter, hasBackofficeVideos)}`}
                                ></div>
                            </div>
                        </div>
                    )}

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
                            <PortfolioGrid
                                projects={videos}
                                showFilter={false}
                                enablePagination={true}
                                itemsPerPageDesktop={24}
                                itemsPerPageMobile={12}
                                activeFilter={activeFilter}
                                onFilterChange={setActiveFilter}
                            />
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
