'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';

import { useImageStore } from '../../store/imageStore';

import styles from './gallery.module.scss';

interface GalleryImage {
    id: string;
    url: string;
    width?: number;
    height?: number;
}

/**
 * Galerie d'images 3D défilante, 3 lignes fixes, effet infini, alternance de direction.
 */
export default function Gallery() {
    const preloadedImages = useImageStore((state) => state.preloadedImages);
    const galleryContainerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

    // 3 lignes fixes
    const ROWS = 3;
    const IMAGE_MARGIN = 10;
    const [galleryConfig, setGalleryConfig] = useState({
        rowsNumber: ROWS,
        imageMargin: IMAGE_MARGIN,
        imageHeight: 0,
    });
    const [imageRows, setImageRows] = useState<GalleryImage[][]>([]);

    // Charger les images de la galerie avec leurs vraies dimensions
    const loadGalleryImages = useCallback(async () => {
        try {
            const response = await fetch('/api/gallery-images?path=home/gallery');
            const data = await response.json();

            if (data.media && data.media.length > 0) {
                const imageItems = data.media
                    .filter((item: any) => item.type === 'image')
                    .slice(0, 18); // Charger plus d'images pour assurer un bon remplissage

                // Charger chaque image pour obtenir ses vraies dimensions
                const imagesWithDimensions: GalleryImage[] = [];

                for (const item of imageItems) {
                    try {
                        const img = await new Promise<GalleryImage>((resolve, reject) => {
                            const image = new window.Image();
                            image.onload = () => {
                                resolve({
                                    id: item.id || `img-${Date.now()}-${Math.random()}`,
                                    url: item.url,
                                    width: image.naturalWidth,
                                    height: image.naturalHeight,
                                });
                            };
                            image.onerror = () => {
                                reject(new Error(`Failed to load image: ${item.url}`));
                            };
                            image.src = item.url;
                        });

                        imagesWithDimensions.push(img);
                    } catch (error) {
                        console.warn(`Image skipped due to loading error: ${item.url}`);
                        // Continue with next image instead of adding failed ones
                    }
                }

                // Dupliquer les images si on n'en a pas assez pour remplir 3 lignes correctement
                let finalImages = [...imagesWithDimensions];
                const minImagesPerRow = 6;
                const minTotalImages = minImagesPerRow * 3;

                while (finalImages.length < minTotalImages) {
                    finalImages = [...finalImages, ...imagesWithDimensions];
                }

                setGalleryImages(finalImages.slice(0, 21)); // Garder 21 images (7 par ligne)
            }
        } catch (error) {
            console.error('Erreur lors du chargement des images:', error);
        }
    }, []);

    // Préparer la galerie (3 lignes fixes, images réparties équitablement)
    const prepareGallery = useCallback(() => {
        if (!galleryImages || galleryImages.length === 0) return;

        // Hauteur de ligne : 90% de la hauteur de la galerie divisée par 3
        const galleryHeight = galleryContainerRef.current?.offsetHeight || 350;
        const rowHeight = (galleryHeight * 0.9) / ROWS;

        // Répartir les images équitablement dans 3 lignes
        const distributedRows: GalleryImage[][] = [[], [], []];

        // Distribution séquentielle simple pour garantir l'équilibre
        galleryImages.forEach((img, i) => {
            const rowIndex = i % ROWS;
            distributedRows[rowIndex].push(img);
        });

        console.log(
            'Distribution initiale:',
            distributedRows.map((row, i) => `Ligne ${i}: ${row.length} images`),
        );

        // S'assurer que chaque ligne a au moins 7 images pour un bon effet de défilement
        distributedRows.forEach((row, rowIndex) => {
            const targetCount = 7; // Nombre cible d'images par ligne
            let duplicateCounter = 0;

            while (row.length < targetCount && galleryImages.length > 0) {
                // Prendre une image de façon cyclique depuis toutes les images disponibles
                const sourceIndex = duplicateCounter % galleryImages.length;
                const imgToAdd = galleryImages[sourceIndex];

                row.push({
                    ...imgToAdd,
                    id: `${imgToAdd.id}-row-${rowIndex}-dup-${duplicateCounter}`, // ID unique par ligne
                });

                duplicateCounter++;

                // Sécurité pour éviter les boucles infinies
                if (duplicateCounter > galleryImages.length * 3) break;
            }

            console.log(`Ligne ${rowIndex}: ${row.length} images`);
        });

        setGalleryConfig({
            rowsNumber: ROWS,
            imageMargin: IMAGE_MARGIN,
            imageHeight: rowHeight,
        });
        setImageRows(distributedRows);
        setIsReady(true);
    }, [galleryImages]);

    useEffect(() => {
        loadGalleryImages();
    }, [loadGalleryImages]);

    useEffect(() => {
        if (galleryImages.length > 0) {
            prepareGallery();
        }
    }, [galleryImages, prepareGallery]);

    // Rendu d'une image dans une ligne
    const renderImageInRow = (img: GalleryImage, index: number) => {
        if (!img || !img.width || !img.height) return null;
        const imgRatio = img.width / img.height;
        const imgWidth = galleryConfig.imageHeight * imgRatio;
        return (
            <div
                className={styles['gallery-image-container']}
                key={`${index}-${img.url}`}
                style={{ margin: `0 ${galleryConfig.imageMargin / 2}px` }}
            >
                <Image
                    src={img.url}
                    alt=""
                    width={img.width}
                    height={img.height}
                    className={styles['gallery-image']}
                    style={{
                        height: `${galleryConfig.imageHeight}px`,
                        width: `${imgWidth}px`,
                        objectFit: 'cover',
                        borderRadius: '7px',
                    }}
                />
            </div>
        );
    };

    // Direction : lignes 0 et 2 → left, ligne 1 → right
    const getScrollContainerClass = (rowIndex: number) => {
        const direction = rowIndex === 1 ? 'right' : 'left';
        return `${styles['gallery-scroll']} ${styles[direction]} ${styles['speed']}`;
    };

    return (
        <div className={styles['gallery-section']}>
            <div
                className={styles['gallery-3d-container']}
                ref={galleryContainerRef}
                style={{
                    opacity: 1,
                    transform:
                        'perspective(1200px) rotateX(36deg) rotateY(-3deg) scale(1.2) translateY(-2%)',
                    boxShadow: '0 30px 80px -30px rgba(0,0,0,0.45)',
                }}
            >
                <div className={styles['gallery-inner']}>
                    {isReady && imageRows.length > 0 ? (
                        imageRows.map((row, rowIndex) => (
                            <div
                                key={`row-${rowIndex}`}
                                className={styles['gallery-row']}
                                style={{
                                    height: `${galleryConfig.imageHeight}px`,
                                    width: '100%',
                                    margin: `${galleryConfig.imageMargin / 2}px 0`,
                                }}
                            >
                                <div
                                    className={getScrollContainerClass(rowIndex)}
                                    style={{ display: 'flex', width: 'fit-content' }}
                                >
                                    {/* Double les images pour l'effet infini */}
                                    {row.map((img, imgIndex) => renderImageInRow(img, imgIndex))}
                                    {row.map((img, imgIndex) =>
                                        renderImageInRow(img, imgIndex + row.length),
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div></div>
                    )}
                </div>
            </div>
            <div className={styles['gallery-overlay-primary']}></div>
            <div className={styles['gallery-overlay-secondary']}></div>
        </div>
    );
}
