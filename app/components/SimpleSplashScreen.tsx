'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { useImageStore } from '../store/imageStore';
import { getMediaUrl } from '../utils/mediaUrl';

interface SimpleSplashScreenProps {
    readonly onLoadingComplete: () => void;
}

export default function SimpleSplashScreen({ onLoadingComplete }: SimpleSplashScreenProps) {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const setPreloadedImages = useImageStore((state) => state.setPreloadedImages);

    useEffect(() => {
        let isMounted = true;

        const preloadImages = async () => {
            try {
                const response = await fetch('/api/gallery-images?path=home/gallery');
                const data = await response.json();

                if (!isMounted) return;

                if (data.media && data.media.length > 0) {
                    const imageItems = data.media.filter((item: any) => item.type === 'image');
                    const imagesToLoad = imageItems.slice(0, 8); // Limiter à 8 images sur iOS
                    const totalImages = imagesToLoad.length;
                    let loadedCount = 0;

                    const loadedImages: HTMLImageElement[] = [];

                    // Charger les images une par une avec progression
                    for (const mediaItem of imagesToLoad) {
                        if (!isMounted) break;

                        try {
                            await new Promise<void>((resolve, reject) => {
                                const img = new window.Image();

                                img.onload = () => {
                                    if (!isMounted) return;
                                    loadedImages.push(img);
                                    loadedCount++;
                                    setProgress(Math.round((loadedCount / totalImages) * 100));
                                    resolve();
                                };

                                img.onerror = () => {
                                    console.warn(`Erreur chargement image: ${mediaItem.url}`);
                                    loadedCount++;
                                    setProgress(Math.round((loadedCount / totalImages) * 100));
                                    resolve(); // Continue même en cas d'erreur
                                };

                                // Timeout pour éviter les blocages
                                setTimeout(() => {
                                    if (img.complete) return;
                                    console.warn(`Timeout chargement image: ${mediaItem.url}`);
                                    loadedCount++;
                                    setProgress(Math.round((loadedCount / totalImages) * 100));
                                    resolve();
                                }, 5000);

                                img.src = getMediaUrl(mediaItem.url);
                            });
                        } catch (error) {
                            console.warn(`Erreur chargement image: ${mediaItem.url}`, error);
                            loadedCount++;
                            setProgress(Math.round((loadedCount / totalImages) * 100));
                        }
                    }

                    if (isMounted) {
                        setPreloadedImages(loadedImages);
                        setImagesLoaded(true);
                    }
                }
            } catch (error) {
                console.warn('Erreur lors du préchargement des images:', error);
                if (isMounted) {
                    setProgress(100);
                    setImagesLoaded(true);
                }
            }
        };

        // Démarrer le préchargement
        preloadImages();

        return () => {
            isMounted = false;
        };
    }, [setPreloadedImages]);

    // Terminer le splash screen quand les images sont chargées
    useEffect(() => {
        if (imagesLoaded && progress >= 100) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onLoadingComplete, 300);
            }, 800); // Petit délai pour voir la fin

            return () => clearTimeout(timer);
        }
    }, [imagesLoaded, progress, onLoadingComplete]);

    if (!isVisible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                overflow: 'hidden',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
            }}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
        >
            {/* Logo Simple */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    color: 'white',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    marginBottom: '2rem',
                    textAlign: 'center',
                }}
            >
                Prime<span style={{ color: '#9ca3af' }}>content.</span>
            </motion.div>

            {/* Barre de progression simple */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        backgroundColor: 'white',
                        width: `${progress}%`,
                        transition: 'width 0.1s ease-out',
                        boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                />
            </div>
        </div>
    );
}
