'use client';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '../backoffice/lib/firebase-client';

// Types pour les données de mariages
interface Couple {
    id: string;
    person1Name: string;
    person2Name: string;
    person1Image: string;
    person2Image: string;
    coupleDisplayName: string;
    order: number;
}

interface CoupleMedia {
    id: string;
    coupleId: string;
    type: 'photo' | 'video';
    url: string;
    filename: string;
    title?: string;
    description?: string;
    category?: string;
    order: number;
}

interface CoupleVideo {
    id: string;
    coupleId: string;
    type: 'youtube' | 'dailymotion';
    videoId: string;
    title: string;
    description?: string;
    thumbnail?: string;
    embedUrl: string;
    watchUrl: string;
    format?: 'portrait' | 'paysage';
}

// Types pour PortfolioGrid (compatibilité)
export interface MariageProject {
    title: string;
    category: string;
    source: string;
    isVideo?: boolean;
    format?: 'paysage' | 'portrait';
    thumbnail?: string;
    provider?: 'youtube' | 'dailymotion' | 'local';
    videoId?: string;
    embedUrl?: string;
    watchUrl?: string;
}

export interface MariageTestimonial {
    id: string;
    coupleName: string;
    coupleImages: {
        person1: string;
        person2: string;
    };
}

export const useMariagesData = () => {
    const [couples, setCouples] = useState<Couple[]>([]);
    const [portfolioData, setPortfolioData] = useState<MariageProject[]>([]);
    const [testimonialsData, setTestimonialsData] = useState<MariageTestimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMariagesData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Charger les médias généraux (non liés à des couples)
                const generalMediaCollection = collection(db, 'mariageGeneralMedias');
                const generalMediaSnapshot = await getDocs(generalMediaCollection);

                const generalMediaData: MariageProject[] = [];
                if (!generalMediaSnapshot.empty) {
                    const fetchedGeneralMedias = generalMediaSnapshot.docs.map((doc) => doc.data());
                    const sortedGeneralMedias = fetchedGeneralMedias.sort(
                        (a: any, b: any) => (a.order || 0) - (b.order || 0),
                    );

                    sortedGeneralMedias.forEach((media: any) => {
                        generalMediaData.push({
                            title: media.title,
                            category: media.category,
                            source: media.watchUrl || media.url,
                            isVideo: media.type !== 'photo',
                            format: media.format || 'paysage',
                            thumbnail: media.thumbnail,
                            provider:
                                media.type === 'youtube' || media.type === 'dailymotion'
                                    ? media.type
                                    : media.type === 'video'
                                      ? 'local'
                                      : undefined,
                            videoId: media.videoId,
                            embedUrl: media.embedUrl,
                            watchUrl: media.watchUrl,
                        });
                    });
                }

                // 2. Charger les couples
                const couplesCollection = collection(db, 'couples');
                const couplesSnapshot = await getDocs(couplesCollection);

                if (!couplesSnapshot.empty) {
                    const fetchedCouples = couplesSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Couple[];

                    const sortedCouples = [...fetchedCouples].sort(
                        (a, b) => (a.order || 0) - (b.order || 0),
                    );
                    setCouples(sortedCouples);

                    // 3. Charger les médias pour tous les couples
                    const allMedia: MariageProject[] = [];
                    const allVideos: MariageProject[] = [];

                    for (const couple of sortedCouples) {
                        // Charger les médias (photos/vidéos locales)
                        const mediaCollection = collection(db, 'coupleMedias');
                        const mediaQuery = query(
                            mediaCollection,
                            where('coupleId', '==', couple.id),
                        );
                        const mediaSnapshot = await getDocs(mediaQuery);

                        if (!mediaSnapshot.empty) {
                            const coupleMedias = mediaSnapshot.docs.map((doc) =>
                                doc.data(),
                            ) as CoupleMedia[];
                            const sortedMedias = coupleMedias.sort(
                                (a, b) => (a.order || 0) - (b.order || 0),
                            );

                            sortedMedias.forEach((media) => {
                                // Fonction pour détecter le format à partir du nom de fichier
                                const detectFormat = (source: string): 'paysage' | 'portrait' => {
                                    const filename = source.toLowerCase();

                                    // Mots-clés pour le format portrait
                                    const portraitKeywords = [
                                        'portrait',
                                        'vertical',
                                        'vert',
                                        'tall',
                                        'standing',
                                        'debout',
                                    ];

                                    // Mots-clés pour le format paysage
                                    const paysageKeywords = [
                                        'paysage',
                                        'landscape',
                                        'horizontal',
                                        'horiz',
                                        'wide',
                                        'large',
                                    ];

                                    // Vérifier les mots-clés portrait en premier
                                    if (
                                        portraitKeywords.some((keyword) =>
                                            filename.includes(keyword),
                                        )
                                    ) {
                                        return 'portrait';
                                    }

                                    // Vérifier les mots-clés paysage
                                    if (
                                        paysageKeywords.some((keyword) =>
                                            filename.includes(keyword),
                                        )
                                    ) {
                                        return 'paysage';
                                    }

                                    // Par défaut, considérer comme portrait pour les photos (plus courant en mariage)
                                    // et paysage pour les vidéos
                                    return media.type === 'video' ? 'paysage' : 'portrait';
                                };

                                allMedia.push({
                                    title: media.title || couple.coupleDisplayName, // Juste le nom du couple si pas de titre
                                    category: couple.coupleDisplayName,
                                    source: media.url,
                                    isVideo: media.type === 'video',
                                    format: detectFormat(media.filename), // Détection automatique du format
                                    provider: media.type === 'video' ? 'local' : undefined,
                                });
                            });
                        }

                        // Charger les vidéos externes (YouTube/Dailymotion)
                        const videosCollection = collection(db, 'coupleVideos');
                        const videosQuery = query(
                            videosCollection,
                            where('coupleId', '==', couple.id),
                        );
                        const videosSnapshot = await getDocs(videosQuery);

                        if (!videosSnapshot.empty) {
                            const coupleVideos = videosSnapshot.docs.map((doc) =>
                                doc.data(),
                            ) as CoupleVideo[];

                            coupleVideos.forEach((video) => {
                                allVideos.push({
                                    title: video.title,
                                    category: couple.coupleDisplayName,
                                    source: video.watchUrl,
                                    isVideo: true,
                                    format: video.format || 'paysage', // Inclure le format détecté
                                    thumbnail: video.thumbnail,
                                    provider: video.type,
                                    videoId: video.videoId,
                                    embedUrl: video.embedUrl,
                                    watchUrl: video.watchUrl,
                                });
                            });
                        }
                    }

                    // Combiner tous les médias (médias généraux, puis vidéos externes des couples, puis médias des couples)
                    const allPortfolioData = [...generalMediaData, ...allVideos, ...allMedia];
                    setPortfolioData(allPortfolioData);

                    // 3. Générer les données de témoignages
                    const testimonials: MariageTestimonial[] = sortedCouples.map((couple) => ({
                        id: couple.id,
                        coupleName: couple.coupleDisplayName,
                        coupleImages: {
                            person1: couple.person1Image,
                            person2: couple.person2Image,
                        },
                    }));
                    setTestimonialsData(testimonials);
                } else {
                    // Pas de couples trouvés
                    setCouples([]);
                    setPortfolioData(generalMediaData); // Garder les médias généraux même sans couples
                    setTestimonialsData([]);
                }

                setLoading(false);
            } catch (err) {
                console.error('Erreur lors du chargement des données de mariages:', err);
                setError('Impossible de charger les données des mariages');
                setLoading(false);
            }
        };

        fetchMariagesData();
    }, []);

    return {
        couples,
        portfolioData,
        testimonialsData,
        loading,
        error,
    };
};
