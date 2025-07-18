'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';

import { useImageStore } from '../store/imageStore';
import {
    isIOSSafari,
    getOptimizedLimits,
    deviceLog,
    cleanupImages,
} from '../utils/deviceDetection';
import { getMediaUrl } from '../utils/mediaUrl';

interface SplashScreenProps {
    readonly onLoadingComplete: () => void;
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
    // États principaux
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimationComplete, setIsAnimationComplete] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [hasError, setHasError] = useState(false);

    // Store pour les images préchargées
    const setPreloadedImages = useImageStore((state) => state.setPreloadedImages);

    // Définir l'état d'attente du SplashScreen au démarrage
    useEffect(() => {
        // Indiquer que le SplashScreen est en attente
        localStorage.setItem('splashScreenComplete', 'waiting');
    }, []);

    // Préchargement des images optimisé pour iOS
    useEffect(() => {
        let isMounted = true;
        let loadedImages: HTMLImageElement[] = [];

        // Vérifier si nous sommes sur une page admin via l'URL
        const isAdminPage =
            typeof window !== 'undefined' && window.location.pathname.startsWith('/backoffice');

        // Ne pas précharger les images si nous sommes sur une page admin
        if (isAdminPage) {
            setImagesLoaded(true);
            return;
        }

        const preloadImages = async () => {
            try {
                if (!isMounted) return;

                const response = await fetch('/api/gallery-images?path=home/gallery');
                const data = await response.json();

                // Vérifier si nous avons des images à charger
                if (!data.media || data.media.length === 0) {
                    console.warn('Aucune image trouvée dans la galerie');
                    if (isMounted) {
                        setImagesLoaded(true);
                    }
                    return;
                }

                const imageItems = data.media.filter((item: any) => item.type === 'image');
                const totalImages = imageItems.length;
                let loadedCount = 0;

                // Optimisations spécifiques selon l'appareil
                const limits = getOptimizedLimits();
                const maxImages = Math.min(limits.maxImages, totalImages);

                deviceLog(
                    `Chargement de ${maxImages} images par lots de ${limits.maxConcurrentRequests}`,
                );

                // Fonction de chargement d'une image avec timeout
                const loadImage = (mediaItem: any): Promise<HTMLImageElement | null> =>
                    new Promise((resolve) => {
                        const img = new Image();
                        const timer = setTimeout(() => {
                            console.warn(`⏰ Timeout pour l'image: ${mediaItem.url}`);
                            resolve(null);
                        }, limits.timeoutDuration);

                        img.onload = () => {
                            clearTimeout(timer);
                            if (!isMounted) return;

                            loadedCount++;
                            setLoadingProgress(Math.round((loadedCount / maxImages) * 100));
                            resolve(img);
                        };

                        img.onerror = (error) => {
                            clearTimeout(timer);
                            console.warn(`❌ Erreur pour l'image: ${mediaItem.url}`, error);
                            if (!isMounted) return;

                            loadedCount++;
                            setLoadingProgress(Math.round((loadedCount / maxImages) * 100));
                            resolve(null);
                        };

                        img.src = getMediaUrl(mediaItem.url);
                    });

                // Chargement par lots pour éviter la surcharge mémoire
                const loadInBatches = async (items: any[], batchSize: number) => {
                    const results: HTMLImageElement[] = [];

                    for (let i = 0; i < Math.min(items.length, maxImages); i += batchSize) {
                        if (!isMounted) break;

                        const batch = items.slice(i, i + batchSize);
                        deviceLog(
                            `Lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(Math.min(items.length, maxImages) / batchSize)} (${batch.length} images)`,
                        );

                        const batchResults = await Promise.allSettled(
                            batch.map((item) => loadImage(item)),
                        );

                        batchResults.forEach((result) => {
                            if (result.status === 'fulfilled' && result.value) {
                                results.push(result.value);
                            }
                        });

                        // Pause entre les lots sur iOS pour éviter la surcharge mémoire
                        if (isIOSSafari() && i + batchSize < Math.min(items.length, maxImages)) {
                            await new Promise((resolve) => setTimeout(resolve, 200));
                        }
                    }

                    return results;
                };

                loadedImages = await loadInBatches(imageItems, limits.maxConcurrentRequests);

                if (isMounted) {
                    setPreloadedImages(loadedImages);
                    setImagesLoaded(true);
                    deviceLog(
                        `✅ ${loadedImages.length} images chargées avec succès sur ${totalImages} disponibles`,
                    );
                }
            } catch (error) {
                console.error('❌ Erreur lors du chargement des images:', error);
                setHasError(true);
                if (isMounted) {
                    // On continue même en cas d'erreur pour éviter les blocages
                    setImagesLoaded(true);
                }
            }
        };

        preloadImages();

        return () => {
            isMounted = false;
            // Nettoyage mémoire optimisé pour iOS
            cleanupImages(loadedImages);
        };
    }, [setPreloadedImages]);

    // Gestion de la fin du chargement et transition
    useEffect(() => {
        if (imagesLoaded) {
            // Utilisation des délais optimisés selon l'appareil
            const limits = getOptimizedLimits();
            const delay = hasError ? limits.animationDelay / 2 : limits.animationDelay;

            deviceLog(`Fin du chargement - transition dans ${delay}ms`);

            // Attendre un peu pour que l'utilisateur puisse voir l'animation du logo
            const timer = setTimeout(() => {
                setIsAnimationComplete(true);
                setTimeout(() => {
                    setIsVisible(false);
                    // S'assurer que la page est positionnée tout en haut
                    if (typeof window !== 'undefined') {
                        window.scrollTo(0, 0);
                    }
                    // Définir que le SplashScreen est terminé
                    localStorage.setItem('splashScreenComplete', 'true');
                    onLoadingComplete();
                }, 600);
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [imagesLoaded, onLoadingComplete, hasError]);

    // Animations
    const progressContainerVariants: Variants = {
        hidden: {
            opacity: 0,
        },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
                ease: 'easeOut',
            },
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.3,
                ease: 'easeIn',
            },
        },
    };

    const progressBarVariants: Variants = {
        initial: {
            scaleX: 0,
            transformOrigin: 'left center',
        },
        animate: (progress: number) => ({
            scaleX: progress / 100,
            transition: {
                duration: 0.3,
                ease: 'easeOut',
            },
        }),
    };

    // Définition des animations du logo avec les types corrects
    const logoVariants = {
        initial: {
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            z: 0,
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            y: -30,
            filter: 'blur(8px)',
            transition: {
                duration: 0.7,
                ease: 'easeInOut',
            },
        },
        animate: {
            rotateY: [0, 2, 0, -2, 0],
            rotateX: [0, -1, 0, 1, 0],
            z: [0, 20, 0, -20, 0],
            transition: {
                duration: 5,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'loop' as const,
            },
        },
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 1.05,
                        filter: 'blur(10px)',
                        transition: { duration: 0.8, ease: 'easeInOut' },
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
                >
                    <div className="relative flex flex-col items-center justify-center h-full">
                        <motion.div
                            initial="initial"
                            animate={isAnimationComplete ? 'exit' : 'animate'}
                            variants={logoVariants}
                            className="relative text-center"
                            style={{
                                transformStyle: 'preserve-3d',
                                transformOrigin: 'center center',
                            }}
                        >
                            <div className="text-4xl md:text-6xl lg:text-7xl font-bold relative">
                                <svg
                                    width="100%"
                                    height="100"
                                    viewBox="0 0 600 100"
                                    className="svg-text"
                                    style={{
                                        overflow: 'visible',
                                    }}
                                >
                                    <style jsx>{`
                                        .letter {
                                            stroke-dasharray: 100;
                                            stroke-dashoffset: 100;
                                            opacity: 0;
                                        }

                                        .letter-fill-white {
                                            fill: white;
                                            opacity: 0;
                                        }

                                        .letter-fill-gray {
                                            fill: #9ca3af;
                                            opacity: 0;
                                        }

                                        .dali-letter-1 {
                                            animation:
                                                appear 0.01s linear forwards 0.1s,
                                                dash 0.5s ease forwards 0.1s;
                                        }

                                        .dali-letter-1-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.3s;
                                        }

                                        .dali-letter-2 {
                                            animation:
                                                appear 0.01s linear forwards 0.2s,
                                                dash 0.5s ease forwards 0.2s;
                                        }

                                        .dali-letter-2-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.4s;
                                        }

                                        .dali-letter-3 {
                                            animation:
                                                appear 0.01s linear forwards 0.3s,
                                                dash 0.5s ease forwards 0.3s;
                                        }

                                        .dali-letter-3-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.5s;
                                        }

                                        .dali-letter-4 {
                                            animation:
                                                appear 0.01s linear forwards 0.4s,
                                                dash 0.5s ease forwards 0.4s;
                                        }

                                        .dali-letter-4-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.6s;
                                        }

                                        .films-letter-1 {
                                            animation:
                                                appear 0.01s linear forwards 0.5s,
                                                dash 0.5s ease forwards 0.5s;
                                        }

                                        .films-letter-1-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.7s;
                                        }

                                        .films-letter-2 {
                                            animation:
                                                appear 0.01s linear forwards 0.6s,
                                                dash 0.5s ease forwards 0.6s;
                                        }

                                        .films-letter-2-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.8s;
                                        }

                                        .films-letter-3 {
                                            animation:
                                                appear 0.01s linear forwards 0.7s,
                                                dash 0.5s ease forwards 0.7s;
                                        }

                                        .films-letter-3-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.9s;
                                        }

                                        .films-letter-4 {
                                            animation:
                                                appear 0.01s linear forwards 0.8s,
                                                dash 0.5s ease forwards 0.8s;
                                        }

                                        .films-letter-4-fill {
                                            animation: fill-in 0.7s ease-in forwards 1s;
                                        }

                                        .films-letter-5 {
                                            animation:
                                                appear 0.01s linear forwards 0.9s,
                                                dash 0.5s ease forwards 0.9s;
                                        }

                                        .films-letter-5-fill {
                                            animation: fill-in 0.7s ease-in forwards 1.1s;
                                        }

                                        .films-letter-6 {
                                            animation:
                                                appear 0.01s linear forwards 1s,
                                                dash 0.5s ease forwards 1s;
                                        }

                                        .films-letter-6-fill {
                                            animation: fill-in 0.7s ease-in forwards 1.2s;
                                        }

                                        @keyframes appear {
                                            to {
                                                opacity: 1;
                                            }
                                        }

                                        @keyframes dash {
                                            to {
                                                stroke-dashoffset: 0;
                                            }
                                        }

                                        @keyframes fill-in {
                                            to {
                                                opacity: 1;
                                            }
                                        }
                                    `}</style>

                                    {/* Dali */}
                                    <g>
                                        <text
                                            x="158"
                                            y="70"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="1"
                                            style={{
                                                fontFamily: 'sans-serif',
                                                fontWeight: 'bold',
                                                fontSize: '70px',
                                            }}
                                        >
                                            <tspan className="letter dali-letter-1">D</tspan>
                                            <tspan className="letter dali-letter-2" x="212">
                                                a
                                            </tspan>
                                            <tspan className="letter dali-letter-3" x="252">
                                                l
                                            </tspan>
                                            <tspan className="letter dali-letter-4" x="272">
                                                i
                                            </tspan>
                                        </text>

                                        <text
                                            x="158"
                                            y="70"
                                            stroke="none"
                                            style={{
                                                fontFamily: 'sans-serif',
                                                fontWeight: 'bold',
                                                fontSize: '70px',
                                            }}
                                        >
                                            <tspan className="letter-fill-white dali-letter-1-fill">
                                                D
                                            </tspan>
                                            <tspan
                                                className="letter-fill-white dali-letter-2-fill"
                                                x="212"
                                            >
                                                a
                                            </tspan>
                                            <tspan
                                                className="letter-fill-white dali-letter-3-fill"
                                                x="252"
                                            >
                                                l
                                            </tspan>
                                            <tspan
                                                className="letter-fill-white dali-letter-4-fill"
                                                x="272"
                                            >
                                                i
                                            </tspan>
                                        </text>
                                    </g>

                                    {/* Films */}
                                    <g>
                                        <text
                                            x="288"
                                            y="70"
                                            fill="none"
                                            stroke="#9ca3af"
                                            strokeWidth="1"
                                            style={{
                                                fontFamily: 'sans-serif',
                                                fontWeight: 'bold',
                                                fontSize: '70px',
                                            }}
                                        >
                                            <tspan className="letter films-letter-1">f</tspan>
                                            <tspan className="letter films-letter-2" x="312">
                                                i
                                            </tspan>
                                            <tspan className="letter films-letter-3" x="328">
                                                l
                                            </tspan>
                                            <tspan className="letter films-letter-4" x="348">
                                                m
                                            </tspan>
                                            <tspan className="letter films-letter-5" x="408">
                                                s
                                            </tspan>
                                            <tspan className="letter films-letter-6" x="442">
                                                .
                                            </tspan>
                                        </text>

                                        <text
                                            x="288"
                                            y="70"
                                            stroke="none"
                                            style={{
                                                fontFamily: 'sans-serif',
                                                fontWeight: 'bold',
                                                fontSize: '70px',
                                            }}
                                        >
                                            <tspan className="letter-fill-gray films-letter-1-fill">
                                                f
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray films-letter-2-fill"
                                                x="312"
                                            >
                                                i
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray films-letter-3-fill"
                                                x="328"
                                            >
                                                l
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray films-letter-4-fill"
                                                x="348"
                                            >
                                                m
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray films-letter-5-fill"
                                                x="408"
                                            >
                                                s
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray films-letter-6-fill"
                                                x="442"
                                            >
                                                .
                                            </tspan>
                                        </text>
                                    </g>
                                </svg>
                            </div>
                        </motion.div>
                    </div>

                    {/* Barre de progression */}
                    <motion.div
                        variants={progressContainerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute bottom-0 left-0 right-0 w-full"
                        style={{ zIndex: 60 }}
                    >
                        <div className="w-full h-[5px]">
                            <motion.div
                                className="h-full bg-white"
                                style={{
                                    boxShadow:
                                        '0 0 15px 2px rgba(255, 255, 255, 0.8), 0 0 30px 4px rgba(255, 255, 255, 0.6), 0 0 45px 6px rgba(255, 255, 255, 0.4)',
                                }}
                                variants={progressBarVariants}
                                initial="initial"
                                animate="animate"
                                custom={loadingProgress}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
