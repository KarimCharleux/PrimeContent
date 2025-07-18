'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

import { getMediaUrl } from '@/app/utils/mediaUrl';

import { Project } from '../PortfolioGrid/PortfolioGrid';

import styles from './clientsBackgroundGallery.module.scss';
import { useBackgroundImages } from './useBackgroundImages';

interface ClientsBackgroundGalleryProps {
    projects: Project[];
    activeType: 'marques' | 'celebrites';
    activeFilter: string;
}

// Images de fallback constantes pour éviter les re-créations
const FALLBACK_IMAGES = [
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
    '/uploads/SCR-20250618-ukfp.png',
];

/**
 * Galerie d'images 3D en arrière-plan pour la page clients
 * Affiche les médias filtrés selon la sélection actuelle avec effet flou et sombre
 */
export default function ClientsBackgroundGallery({
    projects,
    activeType,
    activeFilter,
}: ClientsBackgroundGalleryProps) {
    const galleryContainerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(true); // Toujours prêt maintenant

    // Configuration de la galerie (4 lignes fixes)
    const ROWS = 4;
    const IMAGE_MARGIN = 16; // Plus d'espace entre les images
    const IMAGE_HEIGHT = 160; // Hauteur plus grande pour l'arrière-plan

    // Hook personnalisé pour charger rapidement les images indépendamment du PortfolioGrid
    const { backgroundImages, loading: bgLoading } = useBackgroundImages({
        activeType,
        activeFilter,
    });

    // Filtrer les projets selon le type et le filtre actifs
    const filteredProjects = useMemo(() => {
        console.log('🎨 [ClientsBackgroundGallery] Filtrage des projets:', {
            totalProjects: projects.length,
            activeType,
            activeFilter,
            projectTypes: projects.map((p) => ({
                clientType: p.clientType,
                isVideo: p.isVideo,
                source: p.source,
            })),
        });

        let filtered = projects.filter((project) =>
            activeType === 'marques'
                ? project.clientType === 'marque'
                : project.clientType === 'celebrite',
        );

        console.log('🎨 [ClientsBackgroundGallery] Après filtrage par type:', {
            count: filtered.length,
            projects: filtered.map((p) => ({
                title: p.title,
                isVideo: p.isVideo,
                source: p.source,
            })),
        });

        // Si un filtre spécifique est sélectionné (pas "Tout")
        if (activeFilter && activeFilter !== 'Tout') {
            filtered = filtered.filter((project) => project.clientName === activeFilter);
            console.log('🎨 [ClientsBackgroundGallery] Après filtrage par client:', {
                count: filtered.length,
                filter: activeFilter,
            });
        }

        // Filtrer uniquement les images (pas les vidéos) - Filtrage renforcé
        const finalFiltered = filtered.filter((project) => {
            const hasSource = !!project.source;
            const isNotVideo = !project.isVideo && !project.provider && !project.isYouTube;
            const isImageSource =
                project.source &&
                !project.source.includes('youtube') &&
                !project.source.includes('dailymotion');

            const shouldInclude = hasSource && isNotVideo && isImageSource;

            if (!shouldInclude) {
                console.log('🎨 [ClientsBackgroundGallery] Projet exclu:', {
                    title: project.title,
                    hasSource,
                    isNotVideo,
                    isImageSource,
                    isVideo: project.isVideo,
                    provider: project.provider,
                    source: project.source,
                });
            }

            return shouldInclude;
        });

        console.log('🎨 [ClientsBackgroundGallery] Images finales sélectionnées:', {
            count: finalFiltered.length,
            sources: finalFiltered.map((p) => p.source),
        });

        return finalFiltered;
    }, [projects, activeType, activeFilter]);

    // Sélectionner un échantillon aléatoire d'images pour l'arrière-plan
    const selectedImages = useMemo(() => {
        console.log('🎨 [ClientsBackgroundGallery] Sélection des images:', {
            backgroundImagesCount: backgroundImages.length,
            filteredProjectsCount: filteredProjects.length,
            totalProjectsCount: projects.length,
            bgLoading,
            environment: process.env.NODE_ENV,
        });

        // 1. Priorité aux images du hook personnalisé (plus rapide)
        if (backgroundImages.length > 0) {
            console.log(
                '🎨 [ClientsBackgroundGallery] Utilisation des images du hook personnalisé:',
                backgroundImages.length,
            );

            // Sélectionner jusqu'à 12 images
            const selected = backgroundImages.slice(0, 12);

            console.log('🎨 [ClientsBackgroundGallery] Images sélectionnées via hook:', {
                count: selected.length,
                sources: selected.map((img) => img.source),
            });

            return selected;
        }

        // 2. Fallback sur les projets filtrés si le hook n'a pas encore chargé ou n'a pas d'images
        if (filteredProjects.length === 0) {
            console.log(
                '🎨 [ClientsBackgroundGallery] Aucune image filtrée, recherche de fallback...',
            );

            // Si aucune image spécifique, utiliser toutes les images du type actif
            const allImagesOfType = projects.filter((project) => {
                const isCorrectType =
                    activeType === 'marques'
                        ? project.clientType === 'marque'
                        : project.clientType === 'celebrite';
                const hasSource = !!project.source;
                const isNotVideo = !project.isVideo && !project.provider && !project.isYouTube;

                return isCorrectType && hasSource && isNotVideo;
            });

            console.log('🎨 [ClientsBackgroundGallery] Images du type actif:', {
                count: allImagesOfType.length,
                activeType,
                sources: allImagesOfType.map((p) => p.source),
            });

            if (allImagesOfType.length === 0) {
                // En dernier recours, utiliser toutes les images disponibles
                const anyImages = projects.filter((project) => {
                    const hasSource = !!project.source;
                    const isNotVideo = !project.isVideo && !project.provider && !project.isYouTube;
                    return hasSource && isNotVideo;
                });

                console.log('🎨 [ClientsBackgroundGallery] Toutes images disponibles:', {
                    count: anyImages.length,
                    sources: anyImages.map((p) => p.source),
                });

                if (anyImages.length === 0) {
                    // Utiliser les images de fallback statiques pour la démonstration
                    console.log('🎨 [ClientsBackgroundGallery] Utilisation des images de fallback');

                    // En production, on ne veut pas les fallback
                    if (process.env.NODE_ENV === 'production') {
                        console.log(
                            '🎨 [ClientsBackgroundGallery] Mode production: pas de fallback',
                        );
                        return [];
                    }

                    return FALLBACK_IMAGES.map((src: string, index: number) => ({
                        source: getMediaUrl(src),
                        title: `Image de démonstration ${index + 1}`,
                        category: 'Fallback',
                        isVideo: false,
                        format: 'paysage' as const,
                        clientType:
                            activeType === 'marques' ? ('marque' as const) : ('celebrite' as const),
                        clientName: 'demo',
                    }));
                }

                return anyImages.slice(0, 12);
            }

            return allImagesOfType.slice(0, 12);
        }

        // Si on a peu d'images, les utiliser toutes
        if (filteredProjects.length <= 12) {
            console.log(
                '🎨 [ClientsBackgroundGallery] Utilisation de toutes les images filtrées:',
                filteredProjects.length,
            );
            return filteredProjects;
        }

        // Sinon, sélectionner 12 images aléatoires
        const shuffled = [...filteredProjects].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 12);

        console.log('🎨 [ClientsBackgroundGallery] Sélection aléatoire:', {
            total: filteredProjects.length,
            selected: selected.length,
            sources: selected.map((p) => p.source),
        });

        return selected;
    }, [backgroundImages, filteredProjects, projects, activeType, bgLoading]);

    // Effect pour marquer comme prêt quand les images changent
    useEffect(() => {
        console.log('🎨 [ClientsBackgroundGallery] Images sélectionnées:', {
            count: selectedImages.length,
            sources: selectedImages.map((p) => p.source),
        });
        setIsReady(selectedImages.length > 0);
    }, [selectedImages]);

    // Répartir les images en 4 lignes (basé sur selectedImages directement)
    const imageRows = useMemo(() => {
        if (selectedImages.length === 0) return [[], [], [], []];

        const rows: Project[][] = [[], [], [], []];
        selectedImages.forEach((project, index) => {
            rows[index % ROWS].push(project);
        });

        return rows;
    }, [selectedImages, ROWS]);

    // Rendu d'une image dans une ligne
    const renderImageInRow = useCallback(
        (project: Project, index: number) => {
            if (!project?.source) return null;

            // Utiliser un ratio par défaut de 16:9 pour les images
            const imgRatio = project.format === 'portrait' ? 9 / 16 : 16 / 9;
            const imgWidth = IMAGE_HEIGHT * imgRatio;

            return (
                <div
                    className={styles['gallery-image-container']}
                    key={`${index}-${project.source}`}
                    style={{ margin: `0 ${IMAGE_MARGIN / 2}px` }}
                >
                    <Image
                        src={getMediaUrl(project.source)}
                        alt=""
                        width={Math.round(imgWidth)}
                        height={IMAGE_HEIGHT}
                        className={styles['gallery-image']}
                        style={{
                            height: `${IMAGE_HEIGHT}px`,
                            width: `${imgWidth}px`,
                            objectFit: 'cover',
                            borderRadius: '6px',
                        }}
                    />
                </div>
            );
        },
        [IMAGE_HEIGHT, IMAGE_MARGIN],
    );

    // Direction : lignes paires → left, lignes impaires → right
    const getScrollContainerClass = useCallback((rowIndex: number) => {
        const direction = rowIndex % 2 === 0 ? 'left' : 'right';
        return `${styles['gallery-scroll']} ${styles[direction]} ${styles['speed']}`;
    }, []);

    if (selectedImages.length === 0) {
        return null;
    }

    return (
        <div className={styles['background-gallery']}>
            {/* Debug info - à supprimer en production */}
            {process.env.NODE_ENV === 'development' && (
                <div
                    style={{
                        position: 'fixed',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        zIndex: 9999,
                        maxWidth: '300px',
                        lineHeight: '1.3',
                    }}
                >
                    <div>
                        <strong>🎨 ClientsBackgroundGallery Debug</strong>
                    </div>
                    <div>
                        Type: {activeType} | Filtre: {activeFilter}
                    </div>
                    <div>
                        Hook BG: {backgroundImages.length} images{' '}
                        {bgLoading ? '(⏳ loading...)' : '(✅ loaded)'}
                    </div>
                    <div>Projets totaux: {projects.length}</div>
                    <div>Images sélectionnées: {selectedImages.length}</div>
                    <div>Images sélectionnées: {selectedImages.length}</div>
                    <div>Ready: {isReady ? '✅ Oui' : '❌ Non'}</div>
                    <div>Env: {process.env.NODE_ENV}</div>
                    {selectedImages.length > 0 && (
                        <div style={{ marginTop: '5px', fontSize: '10px' }}>
                            <strong>Sources:</strong>
                            {selectedImages.slice(0, 3).map((img, i) => (
                                <div key={i} style={{ wordBreak: 'break-all' }}>
                                    {i + 1}. {img.source.substring(img.source.lastIndexOf('/') + 1)}
                                </div>
                            ))}
                            {selectedImages.length > 3 && (
                                <div>... et {selectedImages.length - 3} autres</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div
                className={styles['gallery-3d-container']}
                ref={galleryContainerRef}
                style={{
                    opacity: isReady ? 0.4 : 0, // Opacité réduite pour l'arrière-plan
                    transform:
                        'perspective(1200px) rotateX(36deg) rotateY(-3deg) scale(1.2) translateY(-2%)',
                    transition: 'opacity 1s ease-in-out',
                }}
            >
                <div className={styles['gallery-inner']}>
                    {isReady && imageRows.length > 0 ? (
                        imageRows.map((row, rowIndex) => (
                            <div
                                key={`row-${rowIndex}`}
                                className={styles['gallery-row']}
                                style={{
                                    height: `${IMAGE_HEIGHT}px`,
                                    width: '100%',
                                    // La marge est maintenant gérée par le CSS
                                }}
                            >
                                <div
                                    className={getScrollContainerClass(rowIndex)}
                                    style={{ display: 'flex', width: 'fit-content' }}
                                >
                                    {/* Quadruple les images pour l'effet infini avec 4 lignes */}
                                    {row.map((img, imgIndex) => renderImageInRow(img, imgIndex))}
                                    {row.map((img, imgIndex) =>
                                        renderImageInRow(img, imgIndex + row.length),
                                    )}
                                    {row.map((img, imgIndex) =>
                                        renderImageInRow(img, imgIndex + row.length * 2),
                                    )}
                                    {row.map((img, imgIndex) =>
                                        renderImageInRow(img, imgIndex + row.length * 3),
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ opacity: 0 }}></div>
                    )}
                </div>
            </div>

            {/* Overlays pour l'effet sombre et flou */}
            <div className={styles['background-overlay']}></div>
            <div className={styles['blur-overlay']}></div>
        </div>
    );
}
