'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

import { Project } from '../PortfolioGrid/PortfolioGrid';

import styles from './clientsBackgroundGallery.module.scss';

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
    const [isReady, setIsReady] = useState(false);
    const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);

    // Configuration de la galerie (4 lignes fixes)
    const ROWS = 4;
    const IMAGE_MARGIN = 16; // Plus d'espace entre les images
    const IMAGE_HEIGHT = 160; // Hauteur plus grande pour l'arrière-plan

    // Filtrer les projets selon le type et le filtre actifs
    const filteredProjects = useMemo(() => {
        let filtered = projects.filter((project) =>
            activeType === 'marques'
                ? project.clientType === 'marque'
                : project.clientType === 'celebrite',
        );

        // Si un filtre spécifique est sélectionné (pas "Tout")
        if (activeFilter && activeFilter !== 'Tout') {
            filtered = filtered.filter((project) => project.clientName === activeFilter);
        }

        // Filtrer uniquement les images (pas les vidéos)
        const finalFiltered = filtered.filter((project) => !project.isVideo && project.source);

        return finalFiltered;
    }, [projects, activeType, activeFilter]);

    // Sélectionner un échantillon aléatoire d'images pour l'arrière-plan
    const selectedImages = useMemo(() => {
        if (filteredProjects.length === 0) {
            // Si aucune image spécifique, utiliser toutes les images du type actif
            const allImagesOfType = projects.filter((project) => {
                const isCorrectType =
                    activeType === 'marques'
                        ? project.clientType === 'marque'
                        : project.clientType === 'celebrite';
                return isCorrectType && !project.isVideo && project.source;
            });

            if (allImagesOfType.length === 0) {
                // En dernier recours, utiliser toutes les images disponibles
                const anyImages = projects.filter((project) => !project.isVideo && project.source);

                if (anyImages.length === 0) {
                    // Utiliser les images de fallback statiques pour la démonstration
                    return FALLBACK_IMAGES.map((src: string, index: number) => ({
                        source: src,
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
            return filteredProjects;
        }

        // Sinon, sélectionner 12 images aléatoires
        const shuffled = [...filteredProjects].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 12);
    }, [filteredProjects, projects, activeType]);

    // Précharger les images sélectionnées
    const preloadImages = useCallback(async () => {
        if (selectedImages.length === 0) {
            setLoadedImages([]);
            setIsReady(false);
            return;
        }

        const imagePromises = selectedImages.map((project: Project) => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = project.source;
            });
        });

        try {
            const loadedImgs = await Promise.allSettled(imagePromises);
            const validImages = loadedImgs
                .filter(
                    (
                        result: PromiseSettledResult<HTMLImageElement>,
                    ): result is PromiseFulfilledResult<HTMLImageElement> =>
                        result.status === 'fulfilled',
                )
                .map((result: PromiseFulfilledResult<HTMLImageElement>) => result.value)
                .filter((img: HTMLImageElement) => img.naturalWidth && img.naturalHeight);

            setLoadedImages(validImages);
            setIsReady(validImages.length > 0);
        } catch (error) {
            console.error('Erreur lors du préchargement des images:', error);
            setLoadedImages([]);
            setIsReady(false);
        }
    }, [selectedImages]);

    // Répartir les images en 4 lignes
    const imageRows = useMemo(() => {
        if (loadedImages.length === 0) return [[], [], [], []];

        const rows: HTMLImageElement[][] = [[], [], [], []];
        loadedImages.forEach((img, index) => {
            rows[index % ROWS].push(img);
        });

        return rows;
    }, [loadedImages, ROWS]);

    // Effect pour précharger les images quand la sélection change
    useEffect(() => {
        setIsReady(false);
        preloadImages();
    }, [preloadImages]);

    // Rendu d'une image dans une ligne
    const renderImageInRow = useCallback(
        (img: HTMLImageElement, index: number) => {
            if (!img || !img.naturalWidth) return null;

            const imgRatio = img.naturalWidth / img.naturalHeight;
            const imgWidth = IMAGE_HEIGHT * imgRatio;

            return (
                <div
                    className={styles['gallery-image-container']}
                    key={`${index}-${img.src}`}
                    style={{ margin: `0 ${IMAGE_MARGIN / 2}px` }}
                >
                    <Image
                        src={img.src}
                        alt=""
                        width={img.naturalWidth}
                        height={img.naturalHeight}
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
                        fontSize: '12px',
                        zIndex: 9999,
                    }}
                >
                    Galerie BG: {selectedImages.length} images | Ready: {isReady ? 'Oui' : 'Non'}
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
