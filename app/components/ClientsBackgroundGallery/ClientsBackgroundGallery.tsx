'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { useImageStore } from '../../store/imageStore';

import styles from './clientsBackgroundGallery.module.scss';

/**
 * Galerie d'images 3D en arrière-plan pour la page clients
 * Version allégée du composant Gallery principal
 * Utilise les mêmes images préchargées pendant le SplashScreen
 */
export default function ClientsBackgroundGallery() {
    const galleryContainerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    // Récupérer les images préchargées du store
    const preloadedImages = useImageStore((state) => state.preloadedImages);

    // Configuration de la galerie (5 lignes fixes)
    const ROWS = 5;
    const IMAGE_HEIGHT = 200; // Lignes plus hautes
    const IMAGE_MARGIN = 16;

    // Préparer les images pour l'affichage
    useEffect(() => {
        if (preloadedImages && preloadedImages.length > 0) {
            setIsReady(true);
        }
    }, [preloadedImages]);

    // Répartir les images en 5 lignes
    const imageRows = (() => {
        if (!preloadedImages || preloadedImages.length === 0) {
            return [[], [], [], [], []];
        }

        const rows: HTMLImageElement[][] = [[], [], [], [], []];
        preloadedImages.forEach((img, index) => {
            rows[index % ROWS].push(img);
        });

        return rows;
    })();

    // Rendu d'une image dans une ligne
    const renderImageInRow = (img: HTMLImageElement, index: number) => {
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
    };

    // Direction : lignes paires → left, lignes impaires → right
    const getScrollContainerClass = (rowIndex: number) => {
        const direction = rowIndex % 2 === 0 ? 'left' : 'right';
        return `${styles['gallery-scroll']} ${styles[direction]} ${styles['speed']}`;
    };

    if (!isReady || imageRows.every((row) => row.length === 0)) {
        return null;
    }

    return (
        <div className={styles['background-gallery']}>
            <div ref={galleryContainerRef} className={styles['gallery-container']}>
                {imageRows.map((rowImages, rowIndex) => {
                    if (rowImages.length === 0) return null;

                    // Dupliquer les images pour créer un effet de défilement infini
                    const duplicatedImages = [
                        ...rowImages,
                        ...rowImages,
                        ...rowImages,
                        ...rowImages,
                    ];

                    return (
                        <div
                            key={rowIndex}
                            className={styles['gallery-row']}
                            style={{
                                marginBottom: '16px', // Espacement réduit pour 5 lignes
                            }}
                        >
                            <div className={getScrollContainerClass(rowIndex)}>
                                {duplicatedImages.map((img, imgIndex) =>
                                    renderImageInRow(img, `${rowIndex}-${imgIndex}` as any),
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
