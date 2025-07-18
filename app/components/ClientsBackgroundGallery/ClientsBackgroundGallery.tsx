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

    // Configuration de la galerie (3 lignes fixes)
    const ROWS = 3;
    const IMAGE_MARGIN = 8;
    const IMAGE_HEIGHT = 120; // Hauteur fixe pour l'arrière-plan

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
        return filtered.filter((project) => !project.isVideo && project.source);
    }, [projects, activeType, activeFilter]);

    // Sélectionner un échantillon aléatoire d'images pour l'arrière-plan
    const selectedImages = useMemo(() => {
        if (filteredProjects.length === 0) return [];

        // Si on a peu d'images, les utiliser toutes
        if (filteredProjects.length <= 12) {
            return filteredProjects;
        }

        // Sinon, sélectionner 12 images aléatoires
        const shuffled = [...filteredProjects].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 12);
    }, [filteredProjects]);

    // Précharger les images sélectionnées
    const preloadImages = useCallback(async () => {
        if (selectedImages.length === 0) {
            setLoadedImages([]);
            setIsReady(false);
            return;
        }

        const imagePromises = selectedImages.map((project) => {
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
                    (result): result is PromiseFulfilledResult<HTMLImageElement> =>
                        result.status === 'fulfilled',
                )
                .map((result) => result.value)
                .filter((img) => img.naturalWidth && img.naturalHeight);

            setLoadedImages(validImages);
            setIsReady(validImages.length > 0);
        } catch (error) {
            console.error('Erreur lors du préchargement des images:', error);
            setLoadedImages([]);
            setIsReady(false);
        }
    }, [selectedImages]);

    // Répartir les images en 3 lignes
    const imageRows = useMemo(() => {
        if (loadedImages.length === 0) return [[], [], []];

        const rows: HTMLImageElement[][] = [[], [], []];
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

    // Direction : lignes 0 et 2 → left, ligne 1 → right
    const getScrollContainerClass = useCallback((rowIndex: number) => {
        const direction = rowIndex === 1 ? 'right' : 'left';
        return `${styles['gallery-scroll']} ${styles[direction]} ${styles['speed']}`;
    }, []);

    return (
        <div className={styles['background-gallery']}>
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
                                    margin: `${IMAGE_MARGIN / 2}px 0`,
                                }}
                            >
                                <div
                                    className={getScrollContainerClass(rowIndex)}
                                    style={{ display: 'flex', width: 'fit-content' }}
                                >
                                    {/* Triple les images pour l'effet infini et remplir l'espace */}
                                    {row.map((img, imgIndex) => renderImageInRow(img, imgIndex))}
                                    {row.map((img, imgIndex) =>
                                        renderImageInRow(img, imgIndex + row.length),
                                    )}
                                    {row.map((img, imgIndex) =>
                                        renderImageInRow(img, imgIndex + row.length * 2),
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
