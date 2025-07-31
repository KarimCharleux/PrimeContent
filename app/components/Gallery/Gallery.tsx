'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

import { useImageStore } from '../../store/imageStore';
import ProtectedImage from '../ProtectedImage';

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

    // Mémoriser la configuration pour éviter les re-calculs inutiles
    const [galleryConfig, setGalleryConfig] = useState({
        rowsNumber: ROWS,
        imageMargin: IMAGE_MARGIN,
        imageHeight: 0,
    });
    const [imageRows, setImageRows] = useState<HTMLImageElement[][]>([]);

    // Mémoriser les images valides pour éviter les re-calculs
    const validImages = useMemo(() => {
        return preloadedImages?.filter((img) => img && img.naturalWidth && img.naturalHeight) || [];
    }, [preloadedImages]);

    // Préparer la galerie (3 lignes fixes, images réparties équitablement)
    const prepareGallery = useCallback(() => {
        if (!validImages || validImages.length === 0) {
            setIsReady(false);
            return;
        }

        // Hauteur de ligne : 90% de la hauteur de la galerie divisée par 3
        const galleryHeight = galleryContainerRef.current?.offsetHeight || 350;
        const rowHeight = (galleryHeight * 0.9) / ROWS;

        // Répartir les images équitablement dans 3 lignes
        const distributedRows: HTMLImageElement[][] = [[], [], []];
        validImages.forEach((img, i) => {
            distributedRows[i % ROWS].push(img);
        });

        const newConfig = {
            rowsNumber: ROWS,
            imageMargin: IMAGE_MARGIN,
            imageHeight: rowHeight,
        };

        // Vérifier si la configuration a changé pour éviter les updates inutiles
        if (
            galleryConfig.imageHeight !== newConfig.imageHeight ||
            imageRows.length === 0 ||
            imageRows.some((row, index) => row.length !== distributedRows[index].length)
        ) {
            setGalleryConfig(newConfig);
            setImageRows(distributedRows);
            setIsReady(true);
        }
    }, [validImages, galleryConfig.imageHeight, imageRows, ROWS, IMAGE_MARGIN]);

    // Effect pour initialiser la galerie une seule fois quand les images sont disponibles
    useEffect(() => {
        if (validImages.length > 0 && !isReady) {
            prepareGallery();
        }
    }, [validImages.length, isReady, prepareGallery]);

    // Effect séparé pour gérer le resize de la fenêtre
    useEffect(() => {
        const handleResize = () => {
            if (isReady && validImages.length > 0) {
                prepareGallery();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isReady, validImages.length, prepareGallery]);

    // Rendu d'une image dans une ligne
    const renderImageInRow = useCallback(
        (img: HTMLImageElement, index: number) => {
            if (!img || !img.naturalWidth) return null;
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const imgWidth = galleryConfig.imageHeight * imgRatio;
            return (
                <div
                    className={styles['gallery-image-container']}
                    key={`${index}-${img.src}`}
                    style={{ margin: `0 ${galleryConfig.imageMargin / 2}px` }}
                >
                    <ProtectedImage
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
        },
        [galleryConfig.imageHeight, galleryConfig.imageMargin],
    );

    // Direction : lignes 0 et 2 → left, ligne 1 → right
    const getScrollContainerClass = useCallback((rowIndex: number) => {
        const direction = rowIndex === 1 ? 'right' : 'left';
        return `${styles['gallery-scroll']} ${styles[direction]} ${styles['speed']}`;
    }, []);

    return (
        <div className={styles['gallery-section']}>
            <div
                className={styles['gallery-3d-container']}
                ref={galleryContainerRef}
                style={{
                    opacity: isReady ? 1 : 0,
                    transform:
                        'perspective(1200px) rotateX(36deg) rotateY(-3deg) scale(1.2) translateY(-2%)',
                    boxShadow: '0 30px 80px -30px rgba(0,0,0,0.45)',
                    transition: 'opacity 0.8s ease-in-out',
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
                        <div style={{ opacity: 0 }}></div>
                    )}
                </div>
            </div>
            <div className={styles['gallery-overlay-primary']}></div>
            <div className={styles['gallery-overlay-secondary']}></div>
        </div>
    );
}
