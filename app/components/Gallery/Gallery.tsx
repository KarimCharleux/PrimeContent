'use client';

import { useEffect, useRef, useState } from 'react';
import Marquee from 'react-fast-marquee';

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

        // Distribuer les images dans les lignes
        const distributedRows: HTMLImageElement[][] = [];
        for (let i = 0; i < rowCount; i++) {
            distributedRows.push([]);
        }

        // Distribuer les images en s'assurant que chaque ligne a suffisamment de contenu
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            // Vérifier que nous avons des images à distribuer
            if (preloadedImages.length === 0) {
                console.error("Pas d'images à distribuer");
                continue;
            }

            const shuffledImages = [...preloadedImages].sort(() => 0.5 - Math.random());
            let currentRowWidth = 0;
            const targetRowWidth = window.innerWidth * 2; // Assez d'images pour couvrir 2 écrans

            // Ajouter des images jusqu'à ce que la largeur cible soit atteinte
            for (let i = 0; i < shuffledImages.length; i++) {
                const img = shuffledImages[i];
                if (!img || !img.naturalWidth) {
                    console.warn('Image invalide détectée', img);
                    continue;
                }

                const imgRatio = img.naturalWidth / img.naturalHeight;
                const imgWidth = rowHeight * imgRatio;

                distributedRows[rowIndex].push(img);
                currentRowWidth += imgWidth + imageMargin;

                if (currentRowWidth >= targetRowWidth) break;
            }

            // Répéter les images si nécessaire pour atteindre la largeur cible
            if (currentRowWidth < targetRowWidth && distributedRows[rowIndex].length > 0) {
                const rowImages = [...distributedRows[rowIndex]];
                while (currentRowWidth < targetRowWidth) {
                    for (const img of rowImages) {
                        if (!img || !img.naturalWidth) continue;

                        const imgRatio = img.naturalWidth / img.naturalHeight;
                        const imgWidth = rowHeight * imgRatio;

                        distributedRows[rowIndex].push(img);
                        currentRowWidth += imgWidth + imageMargin;

                        if (currentRowWidth >= targetRowWidth) break;
                    }
                }
            }
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
                key={`${index}-${img.src}`}
                className={styles['gallery-image-container']}
                style={{
                    margin: `0 ${galleryConfig.imageMargin / 2}px`,
                    height: `${galleryConfig.imageHeight}px`,
                    width: `${imgWidth}px`,
                }}
            >
                <img
                    src={img.src}
                    alt=""
                    className={styles['gallery-image']}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '7px',
                    }}
                />
            </div>
        );
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
                                    overflow: 'hidden',
                                    margin: `${galleryConfig.imageMargin / 4}px 0`,
                                }}
                            >
                                <Marquee
                                    direction={rowIndex % 2 === 0 ? 'left' : 'right'}
                                    speed={5 + rowIndex}
                                    gradient={false}
                                    pauseOnHover={false}
                                >
                                    {row.map((img, imgIndex) => renderImageInRow(img, imgIndex))}
                                </Marquee>
                            </div>
                        ))
                    ) : (
                        <div
                            className={styles['gallery-loading']}
                            style={{ color: 'white', opacity: 0.5 }}
                        >
                            {preloadedImages && preloadedImages.length > 0
                                ? 'Chargement de la galerie...'
                                : 'En attente des images...'}
                        </div>
                    )}
                </div>
            </div>
            <div className={styles['gallery-overlay-primary']}></div>
            <div className={styles['gallery-overlay-secondary']}></div>
        </div>
    );
}
