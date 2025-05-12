'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { useImageStore } from '../../store/imageStore';

import styles from './gallery.module.scss';
export default function Gallery() {
    const preloadedImages = useImageStore((state) => state.preloadedImages);
    const galleryContainerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [isPortrait, setIsPortrait] = useState(
        typeof window !== 'undefined' ? window.innerWidth < window.innerHeight : false,
    );

    // Configuration de la galerie
    const [galleryConfig, setGalleryConfig] = useState({
        rowsNumber: isPortrait ? 9 : 5,
        imageMargin: isPortrait ? 5 : 10,
        imageHeight: 0,
    });

    // Distribuer les images par ligne
    const [imageRows, setImageRows] = useState<HTMLImageElement[][]>([]);

    // Préparer la galerie
    const prepareGallery = () => {
        if (!preloadedImages || preloadedImages.length === 0) return;

        const currentIsPortrait = window.innerWidth < window.innerHeight;
        setIsPortrait(currentIsPortrait);

        const rowCount = currentIsPortrait ? 9 : 5;
        const imageMargin = currentIsPortrait ? 5 : 10;
        const rowHeight = window.innerHeight / rowCount - imageMargin / 2;

        // Calculer combien d'images nous pouvons afficher par ligne pour couvrir 2 écrans
        const avgImageWidth =
            preloadedImages.reduce((sum, img) => {
                if (!img || !img.naturalWidth || !img.naturalHeight) return sum;
                return sum + rowHeight * (img.naturalWidth / img.naturalHeight);
            }, 0) / preloadedImages.length;

        // Nombre d'images nécessaires pour couvrir 2 écrans de largeur
        const targetWidth = window.innerWidth * 2;
        const imagesPerRow = Math.max(10, Math.ceil(targetWidth / (avgImageWidth + imageMargin)));

        // Distribuer les images uniformément dans chaque ligne
        const distributedRows: HTMLImageElement[][] = [];

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            // Mélanger les images pour chaque ligne
            const shuffledImages = [...preloadedImages].sort(() => 0.5 - Math.random());

            // Filtrer les images valides
            const validImages = shuffledImages.filter(
                (img) => img && img.naturalWidth && img.naturalHeight,
            );

            if (validImages.length === 0) {
                console.error("Pas d'images valides disponibles");
                continue;
            }

            // Créer une ligne avec exactement le même nombre d'images
            const row: HTMLImageElement[] = [];

            // Remplir la ligne avec le nombre requis d'images
            for (let i = 0; i < imagesPerRow; i++) {
                // Utiliser le modulo pour répéter les images si nécessaire
                const imgIndex = i % validImages.length;
                row.push(validImages[imgIndex]);
            }

            distributedRows.push(row);
        }

        // Filtrer les rangées vides
        const filteredRows = distributedRows.filter((row) => row.length > 0);

        if (filteredRows.length === 0) {
            console.error('Toutes les rangées sont vides après distribution');
            return;
        }

        setGalleryConfig({
            rowsNumber: filteredRows.length,
            imageMargin: imageMargin,
            imageHeight: rowHeight,
        });

        setImageRows(filteredRows);
        setIsReady(true);

        // Appliquer les transformations 3D
        setTimeout(updateTransformations, 100);
    };

    // Appliquer les transformations 3D
    const updateTransformations = () => {
        if (!galleryContainerRef.current) return;

        let rotateYAngle = 0;
        let rotateXAngle = 0;
        let rotateZAngle = 0;
        let scaleValue = 1;
        let translateX = 0;
        let translateY = 0;

        if (window.innerWidth <= 1400) {
            rotateYAngle = 343;
            rotateXAngle = 30;
            rotateZAngle = 5;
            scaleValue = 1.7;
            translateX = 3;
            translateY = 0;
        } else if (window.innerWidth < 2500) {
            rotateYAngle = 344;
            rotateXAngle = 25;
            rotateZAngle = 5;
            scaleValue = 2.1;
            translateX = 3;
            translateY = -5;
        } else {
            rotateYAngle = 350;
            rotateXAngle = 25;
            rotateZAngle = 5;
            scaleValue = 2.2;
            translateX = 5;
            translateY = -4;
        }

        galleryContainerRef.current.style.transform = `
            rotateY(${rotateYAngle}deg) 
            rotateX(${rotateXAngle}deg) 
            rotateZ(${rotateZAngle}deg) 
            scale(${scaleValue})
            translate3d(${translateX}%, ${translateY}%, 0)
        `;

        galleryContainerRef.current.style.opacity = '1';
    };

    // Gérer le redimensionnement
    useEffect(() => {
        const handleResize = () => {
            const currentIsPortrait = window.innerWidth < window.innerHeight;

            if (currentIsPortrait !== isPortrait) {
                console.log("Changement d'orientation détecté, reconstruction de la galerie");
                // On attend que le navigateur ait complètement fini de redimensionner
                if (galleryContainerRef.current) {
                    galleryContainerRef.current.style.opacity = '0';
                }
                setIsReady(false);

                // Délai plus long pour s'assurer que tout est prêt
                setTimeout(() => {
                    prepareGallery();
                }, 300);
            } else {
                updateTransformations();
            }
        };

        // Utiliser un debounce pour éviter les appels excessifs
        let resizeTimeout: NodeJS.Timeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                handleResize();
            }, 250);
        };

        window.addEventListener('resize', debouncedResize);
        return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', debouncedResize);
        };
    }, [isPortrait, preloadedImages]);

    // Charger la galerie au montage ou quand les images changent
    useEffect(() => {
        if (preloadedImages && preloadedImages.length > 0) {
            prepareGallery();
        }
    }, [preloadedImages]);

    // Rendu des images
    const renderImageInRow = (img: HTMLImageElement, index: number) => {
        if (!img || !img.naturalWidth) {
            console.warn('Image invalide dans le rendu', img);
            return null;
        }

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const imgWidth = galleryConfig.imageHeight * imgRatio;

        return (
            <div
                className={styles['image-container']}
                key={`${index}-${img.src}`}
                style={{
                    margin: `0 ${galleryConfig.imageMargin / 2}px`,
                }}
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

    // Déterminer la direction et la vitesse de défilement pour chaque ligne
    const getScrollContainerClass = (rowIndex: number) => {
        // Alterner les directions
        const direction = rowIndex % 2 === 0 ? 'left' : 'right';

        // Varier les vitesses pour un effet plus naturel
        // Utiliser l'index de ligne pour déterminer la vitesse (1, 2, ou 3)
        const speedClass = `speed-${(rowIndex % 3) + 1}`;

        return `${styles['scroll-container']} ${styles[direction]} ${styles[speedClass]}`;
    };

    return (
        <div className={styles['gallery-hero-section']}>
            <div
                className={styles['gallery-container']}
                ref={galleryContainerRef}
                style={{ opacity: 0, transition: 'opacity 0.5s ease' }}
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
                                {/* Conteneur de défilement avec animation CSS */}
                                <div
                                    className={getScrollContainerClass(rowIndex)}
                                    style={{
                                        display: 'flex',
                                        width: 'fit-content', // Assure que le conteneur s'adapte au contenu
                                    }}
                                >
                                    {/* Double les images pour créer un défilement continu */}
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
