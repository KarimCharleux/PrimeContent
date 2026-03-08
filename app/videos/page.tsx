'use client';

import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import Footer from '../components/Footer';
import Header from '../components/Header';
import PortfolioGrid, { ClientData } from '../components/PortfolioGrid/PortfolioGrid';
import { getVideoProvider, extractVideoId } from '../utils/videoManager';

// Importation des styles
import './videos.scss';

// Variants pour les animations
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

interface Brand {
    id?: string;
    name: string;
    imageSrc: string;
    order?: number;
}

interface Talent {
    id?: string;
    name: string;
    imageSrc: string;
    imageBackground?: string;
    order?: number;
}

export default function VideosPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    const [videos, setVideos] = useState<any[]>([]);
    const [hasBackofficeVideos, setHasBackofficeVideos] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('Marques');
    const [activeSubFilter, setActiveSubFilter] = useState<string>('Tout');
    const [brands, setBrands] = useState<Brand[]>([]);
    const [talents, setTalents] = useState<Talent[]>([]);

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

                // 2. Récupérer les marques et talents pour les logos/images
                const brandsCollection = collection(db, 'brands');
                const brandsSnapshot = await getDocs(brandsCollection);
                const fetchedBrands = brandsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Brand[];
                const sortedBrands = fetchedBrands.sort((a, b) => (a.order || 0) - (b.order || 0));
                setBrands(sortedBrands);

                const clientsCollection = collection(db, 'clients');
                const clientsSnapshot = await getDocs(clientsCollection);
                const fetchedTalents = clientsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Talent[];
                const sortedTalents = fetchedTalents.sort(
                    (a, b) => (a.order || 0) - (b.order || 0),
                );
                setTalents(sortedTalents);

                // Construire des maps id → entité pour le matching
                const brandById = Object.fromEntries(sortedBrands.map((b) => [b.id, b]));
                const talentById = Object.fromEntries(sortedTalents.map((t) => [t.id, t]));

                // 3. Récupérer les vidéos des célébrités
                const clientVideosCollection = collection(db, 'client-videos');
                const clientVideosQuery = query(
                    clientVideosCollection,
                    where('clientType', '==', 'celebrity'),
                );
                const clientVideosSnapshot = await getDocs(clientVideosQuery);

                const celebrityVideos = clientVideosSnapshot.docs.map((doc) => {
                    const data = doc.data();

                    let provider = data.provider || 'youtube';
                    let source = data.source || data.youtubeUrl || '';
                    let videoId = data.videoId || data.youtubeId;

                    if (!data.provider && source) {
                        provider = getVideoProvider(source);
                        videoId = extractVideoId(source, provider);
                    }

                    // Utiliser le nom normalisé (slugifié) depuis la collection clients si possible
                    const matchedTalent = data.clientId ? talentById[data.clientId] : null;
                    const clientName = matchedTalent
                        ? matchedTalent.name.toLowerCase().replace(/\s+/g, '-')
                        : (data.clientName || '').toLowerCase().replace(/\s+/g, '-');

                    return {
                        id: doc.id,
                        title: data.title || data.clientName || 'Vidéo talent',
                        category: 'Talents',
                        source,
                        provider,
                        videoId,
                        embedUrl: data.embedUrl,
                        watchUrl: data.watchUrl,
                        thumbnail: data.thumbnail,
                        format: data.format || 'paysage',
                        isVideo: true,
                        clientType: 'celebrite' as const,
                        clientName,
                        order: data.order || 0,
                        youtubeUrl: data.youtubeUrl,
                        youtubeId: data.youtubeId,
                        isYouTube: provider === 'youtube',
                    };
                });

                // 4. Récupérer les vidéos des marques
                const brandVideosQuery = query(
                    clientVideosCollection,
                    where('clientType', '==', 'brand'),
                );
                const brandVideosSnapshot = await getDocs(brandVideosQuery);

                const brandVideos = brandVideosSnapshot.docs.map((doc) => {
                    const data = doc.data();

                    let provider = data.provider || 'youtube';
                    let source = data.source || data.youtubeUrl || '';
                    let videoId = data.videoId || data.youtubeId;

                    if (!data.provider && source) {
                        provider = getVideoProvider(source);
                        videoId = extractVideoId(source, provider);
                    }

                    // Utiliser le nom normalisé (slugifié) depuis la collection brands si possible
                    const matchedBrand = data.clientId ? brandById[data.clientId] : null;
                    const clientName = matchedBrand
                        ? matchedBrand.name.toLowerCase().replace(/\s+/g, '-')
                        : (data.clientName || '').toLowerCase().replace(/\s+/g, '-');

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
                        clientType: 'marque' as const,
                        clientName,
                        order: data.order || 0,
                        youtubeUrl: data.youtubeUrl,
                        youtubeId: data.youtubeId,
                        isYouTube: provider === 'youtube',
                    };
                });

                // 5. Combiner toutes les vidéos
                const allVideos = [...backofficeVideos, ...celebrityVideos, ...brandVideos];

                setVideos(allVideos);
                setHasBackofficeVideos(backofficeVideos.length > 0);
                setActiveFilter(backofficeVideos.length > 0 ? 'Tout' : 'Marques');
            } catch (error) {
                console.error('Erreur lors de la récupération des vidéos:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllVideos();
    }, []);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 600);

        const checkSplashScreen = () => {
            const splashScreenComplete = localStorage.getItem('splashScreenComplete');

            if (splashScreenComplete === 'true') {
                setShouldStartAnimations(true);
                localStorage.removeItem('splashScreenComplete');
                window.scrollTo(0, 0);
            } else if (splashScreenComplete !== 'waiting') {
                setTimeout(() => {
                    setShouldStartAnimations(true);
                }, 100);
            }
        };

        checkSplashScreen();
        const interval = setInterval(checkSplashScreen, 100);

        return () => clearInterval(interval);
    }, []);

    // Changement du filtre principal → réinitialise le sous-filtre
    const handleMainFilterChange = (filter: string) => {
        setActiveFilter(filter);
        setActiveSubFilter('Tout');
    };

    const getSliderClass = (filter: string, hasBackoffice: boolean): string => {
        if (hasBackoffice) {
            if (filter === 'Tout') return 'pos-0';
            if (filter === 'Marques') return 'pos-1';
            return 'pos-2';
        }
        return filter === 'Marques' ? 'left' : 'right';
    };

    // Vidéos pré-filtrées par catégorie principale
    const filteredByCategory = useMemo(() => {
        return videos.filter((v) => {
            if (activeFilter === 'Tout') return true;
            if (activeFilter === 'Marques') return v.clientType === 'marque';
            if (activeFilter === 'Talents') return v.clientType === 'celebrite';
            return true;
        });
    }, [videos, activeFilter]);

    // Filtres personnalisés basés sur les vidéos disponibles (mêmes marques/talents que la page clients)
    const customFilters = useMemo(() => {
        if (activeFilter === 'Tout') return undefined;

        const clientKeys = new Set(filteredByCategory.map((v) => v.clientName).filter(Boolean));

        if (activeFilter === 'Marques') {
            return brands
                .filter((b) => clientKeys.has(b.name.toLowerCase().replace(/\s+/g, '-')))
                .map((b) => ({
                    key: b.name.toLowerCase().replace(/\s+/g, '-'),
                    label: b.name,
                }));
        } else {
            return talents
                .filter((t) => clientKeys.has(t.name.toLowerCase().replace(/\s+/g, '-')))
                .map((t) => ({
                    key: t.name.toLowerCase().replace(/\s+/g, '-'),
                    label: t.name.split(' ')[0],
                }));
        }
    }, [filteredByCategory, activeFilter, brands, talents]);

    // Données clients pour l'affichage avec images (logos/photos)
    const clientData = useMemo(() => {
        const data: { [key: string]: ClientData } = {};

        if (activeFilter === 'Marques' || activeFilter === 'Tout') {
            brands.forEach((b) => {
                data[b.name.toLowerCase().replace(/\s+/g, '-')] = {
                    name: b.name,
                    imageSrc: b.imageSrc,
                    type: 'brand',
                };
            });
        }

        if (activeFilter === 'Talents' || activeFilter === 'Tout') {
            talents.forEach((t) => {
                data[t.name.toLowerCase().replace(/\s+/g, '-')] = {
                    name: t.name,
                    imageSrc: t.imageSrc,
                    imageBackground: t.imageBackground,
                    type: 'celebrity',
                };
            });
        }

        return data;
    }, [activeFilter, brands, talents]);

    const showSubFilter = activeFilter !== 'Tout' && (customFilters?.length ?? 0) > 0;

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
                                        onClick={() => handleMainFilterChange('Tout')}
                                    >
                                        Tout
                                    </button>
                                )}
                                <button
                                    className={`toggle-btn ${activeFilter === 'Marques' ? 'active' : ''}`}
                                    onClick={() => handleMainFilterChange('Marques')}
                                >
                                    Marques
                                </button>
                                <button
                                    className={`toggle-btn ${activeFilter === 'Talents' ? 'active' : ''}`}
                                    onClick={() => handleMainFilterChange('Talents')}
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
                                projects={filteredByCategory}
                                showFilter={showSubFilter}
                                customFilters={customFilters}
                                activeFilter={activeSubFilter}
                                onFilterChange={setActiveSubFilter}
                                filterWithImages={true}
                                clientData={clientData}
                                activeClientType={
                                    activeFilter === 'Talents' ? 'talents' : 'marques'
                                }
                                enablePagination={true}
                                itemsPerPageDesktop={24}
                                itemsPerPageMobile={12}
                            />
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
