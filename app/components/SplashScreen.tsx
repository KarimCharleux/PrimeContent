'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';

import { useImageStore } from '../store/imageStore';
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

    // Store pour les images préchargées
    const setPreloadedImages = useImageStore((state) => state.setPreloadedImages);

    // Définir l'état d'attente du SplashScreen au démarrage
    useEffect(() => {
        // Indiquer que le SplashScreen est en attente
        localStorage.setItem('splashScreenComplete', 'waiting');
    }, []);

    // Préchargement des images
    useEffect(() => {
        let isMounted = true;

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

                const response = await fetch('/api/gallery-images');
                const data = await response.json();
                const totalImages = data.images.length;
                let loadedCount = 0;

                const loadImage = (src: string): Promise<HTMLImageElement> =>
                    new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            if (!isMounted) return;

                            loadedCount++;
                            setLoadingProgress(Math.round((loadedCount / totalImages) * 100));
                            resolve(img);
                        };
                        img.onerror = reject;
                        img.src = getMediaUrl(`/home/gallery/${src}`);
                    });

                const loadedImages = await Promise.all(data.images.map(loadImage));
                if (isMounted) {
                    setPreloadedImages(loadedImages);
                    setImagesLoaded(true);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des images:', error);
                if (isMounted) {
                    setImagesLoaded(true); // On continue même en cas d'erreur
                }
            }
        };

        preloadImages();

        return () => {
            isMounted = false;
        };
    }, [setPreloadedImages]);

    // Gestion de la fin du chargement et transition
    useEffect(() => {
        if (imagesLoaded) {
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
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [imagesLoaded, onLoadingComplete]);

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

                                        .prime-letter-1 {
                                            animation:
                                                appear 0.01s linear forwards 0.1s,
                                                dash 0.5s ease forwards 0.1s;
                                        }

                                        .prime-letter-1-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.3s;
                                        }

                                        .prime-letter-2 {
                                            animation:
                                                appear 0.01s linear forwards 0.2s,
                                                dash 0.5s ease forwards 0.2s;
                                        }

                                        .prime-letter-2-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.4s;
                                        }

                                        .prime-letter-3 {
                                            animation:
                                                appear 0.01s linear forwards 0.3s,
                                                dash 0.5s ease forwards 0.3s;
                                        }

                                        .prime-letter-3-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.5s;
                                        }

                                        .prime-letter-4 {
                                            animation:
                                                appear 0.01s linear forwards 0.4s,
                                                dash 0.5s ease forwards 0.4s;
                                        }

                                        .prime-letter-4-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.6s;
                                        }

                                        .prime-letter-5 {
                                            animation:
                                                appear 0.01s linear forwards 0.5s,
                                                dash 0.5s ease forwards 0.5s;
                                        }

                                        .prime-letter-5-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.7s;
                                        }

                                        .content-letter-1 {
                                            animation:
                                                appear 0.01s linear forwards 0.6s,
                                                dash 0.5s ease forwards 0.6s;
                                        }

                                        .content-letter-1-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.8s;
                                        }

                                        .content-letter-2 {
                                            animation:
                                                appear 0.01s linear forwards 0.7s,
                                                dash 0.5s ease forwards 0.7s;
                                        }

                                        .content-letter-2-fill {
                                            animation: fill-in 0.7s ease-in forwards 0.9s;
                                        }

                                        .content-letter-3 {
                                            animation:
                                                appear 0.01s linear forwards 0.8s,
                                                dash 0.5s ease forwards 0.8s;
                                        }

                                        .content-letter-3-fill {
                                            animation: fill-in 0.7s ease-in forwards 1s;
                                        }

                                        .content-letter-4 {
                                            animation:
                                                appear 0.01s linear forwards 0.9s,
                                                dash 0.5s ease forwards 0.9s;
                                        }

                                        .content-letter-4-fill {
                                            animation: fill-in 0.7s ease-in forwards 1.1s;
                                        }

                                        .content-letter-5 {
                                            animation:
                                                appear 0.01s linear forwards 1s,
                                                dash 0.5s ease forwards 1s;
                                        }

                                        .content-letter-5-fill {
                                            animation: fill-in 0.7s ease-in forwards 1.2s;
                                        }

                                        .content-letter-6 {
                                            animation:
                                                appear 0.01s linear forwards 1.1s,
                                                dash 0.5s ease forwards 1.1s;
                                        }

                                        .content-letter-6-fill {
                                            animation: fill-in 0.7s ease-in forwards 1.3s;
                                        }

                                        .content-letter-7 {
                                            animation:
                                                appear 0.01s linear forwards 1.2s,
                                                dash 0.5s ease forwards 1.2s;
                                        }

                                        .content-letter-7-fill {
                                            animation: fill-in 0.7s ease-in forwards 1.4s;
                                        }

                                        .content-letter-8 {
                                            animation:
                                                appear 0.01s linear forwards 1.3s,
                                                dash 0.5s ease forwards 1.3s;
                                        }

                                        .content-letter-8-fill {
                                            animation: fill-in 0.7s ease-in forwards 1.5s;
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

                                    {/* Prime */}
                                    <g>
                                        <text
                                            x="80"
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
                                            <tspan className="letter prime-letter-1">P</tspan>
                                            <tspan className="letter prime-letter-2" x="124">
                                                r
                                            </tspan>
                                            <tspan className="letter prime-letter-3" x="151">
                                                i
                                            </tspan>
                                            <tspan className="letter prime-letter-4" x="167">
                                                m
                                            </tspan>
                                            <tspan className="letter prime-letter-5" x="227">
                                                e
                                            </tspan>
                                        </text>

                                        <text
                                            x="80"
                                            y="70"
                                            stroke="none"
                                            style={{
                                                fontFamily: 'sans-serif',
                                                fontWeight: 'bold',
                                                fontSize: '70px',
                                            }}
                                        >
                                            <tspan className="letter-fill-white prime-letter-1-fill">
                                                P
                                            </tspan>
                                            <tspan
                                                className="letter-fill-white prime-letter-2-fill"
                                                x="124"
                                            >
                                                r
                                            </tspan>
                                            <tspan
                                                className="letter-fill-white prime-letter-3-fill"
                                                x="151"
                                            >
                                                i
                                            </tspan>
                                            <tspan
                                                className="letter-fill-white prime-letter-4-fill"
                                                x="167"
                                            >
                                                m
                                            </tspan>
                                            <tspan
                                                className="letter-fill-white prime-letter-5-fill"
                                                x="227"
                                            >
                                                e
                                            </tspan>
                                        </text>
                                    </g>

                                    {/* Content */}
                                    <g>
                                        <text
                                            x="265"
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
                                            <tspan className="letter content-letter-1">c</tspan>
                                            <tspan className="letter content-letter-2" x="303">
                                                o
                                            </tspan>
                                            <tspan className="letter content-letter-3" x="343">
                                                n
                                            </tspan>
                                            <tspan className="letter content-letter-4" x="384">
                                                t
                                            </tspan>
                                            <tspan className="letter content-letter-5" x="407">
                                                e
                                            </tspan>
                                            <tspan className="letter content-letter-6" x="443">
                                                n
                                            </tspan>
                                            <tspan className="letter content-letter-7" x="484">
                                                t
                                            </tspan>
                                            <tspan className="letter content-letter-8" x="507">
                                                .
                                            </tspan>
                                        </text>

                                        <text
                                            x="265"
                                            y="70"
                                            stroke="none"
                                            style={{
                                                fontFamily: 'sans-serif',
                                                fontWeight: 'bold',
                                                fontSize: '70px',
                                            }}
                                        >
                                            <tspan className="letter-fill-gray content-letter-1-fill">
                                                c
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray content-letter-2-fill"
                                                x="303"
                                            >
                                                o
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray content-letter-3-fill"
                                                x="343"
                                            >
                                                n
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray content-letter-4-fill"
                                                x="384"
                                            >
                                                t
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray content-letter-5-fill"
                                                x="407"
                                            >
                                                e
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray content-letter-6-fill"
                                                x="443"
                                            >
                                                n
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray content-letter-7-fill"
                                                x="484"
                                            >
                                                t
                                            </tspan>
                                            <tspan
                                                className="letter-fill-gray content-letter-8-fill"
                                                x="507"
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
