'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';

import { useImageStore } from '../../store/imageStore';

import styles from './gallery.module.scss';

/**
 * Galerie d'images 3D défilante, 3 lignes fixes, effet infini, alternance de direction.
 */
export default function Gallery() {
    const preloadedImages = useImageStore((state) => state.preloadedImages);
    const galleryContainerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    // 3 lignes fixes
    const ROWS = 3;
    const IMAGE_MARGIN = 10;
    const [galleryConfig, setGalleryConfig] = useState({
        rowsNumber: ROWS,
        imageMargin: IMAGE_MARGIN,
        imageHeight: 0,
    });
    const [imageRows, setImageRows] = useState<HTMLImageElement[][]>([]);

    // Préparer la galerie (3 lignes fixes, images réparties équitablement)
    const prepareGallery = useCallback(() => {
        if (!preloadedImages || preloadedImages.length === 0) return;
        // Hauteur de ligne : 90% de la hauteur de la galerie divisée par 3
        const galleryHeight = galleryContainerRef.current?.offsetHeight || 350;
        const rowHeight = (galleryHeight * 0.9) / ROWS;
        // Répartir les images équitablement dans 3 lignes
        const distributedRows: HTMLImageElement[][] = [[], [], []];
        preloadedImages.forEach((img, i) => {
            distributedRows[i % ROWS].push(img);
        });
        setGalleryConfig({
            rowsNumber: ROWS,
            imageMargin: IMAGE_MARGIN,
            imageHeight: rowHeight,
        });
        setImageRows(distributedRows);
        setIsReady(true);
    }, [preloadedImages]);

    useEffect(() => {
        if (preloadedImages && preloadedImages.length > 0) {
            prepareGallery();
        }
    }, [preloadedImages, prepareGallery]);

    // Rendu d'une image dans une ligne
    const renderImageInRow = (img: HTMLImageElement, index: number) => {
        if (!img || !img.naturalWidth) return null;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const imgWidth = galleryConfig.imageHeight * imgRatio;
        return (
            <div
                className={styles['gallery-image-container']}
                key={`${index}-${img.src}`}
                style={{ margin: `0 ${galleryConfig.imageMargin / 2}px` }}
            >
                <Image
                    src={img.src}
                    alt=""
                    width={img.naturalWidth}
                    height={img.naturalHeight}
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
