'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';

import { getMediaUrl } from '../../utils/mediaUrl';
import { VideoProvider, getVideoEmbedUrl, isExternalVideo } from '../../utils/videoManager';
import ProtectedImage from '../ProtectedImage';

import styles from './ImageCarousel.module.scss';

interface MediaItem {
    src: string;
    isVideo?: boolean;
    provider?: VideoProvider; // 'youtube' | 'dailymotion' | 'local'
    videoId?: string; // ID de la vidéo externe
    embedUrl?: string; // URL d'embed
    watchUrl?: string; // URL de visionnage
    thumbnail?: string; // URL de la miniature sauvegardée
    // Propriétés de rétrocompatibilité
    isYouTube?: boolean;
    youtubeId?: string;
}

interface ImageCarouselProps {
    media: MediaItem[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    // Rendre la sélection optionnelle
    selectionEnabled?: boolean;
    selectedItems?: Set<string>;
    toggleItemSelection?: (itemSrc: string) => void;
    // Ajout de props optionnelles pour personnaliser le carrousel
    showCounter?: boolean;
}

const ImageCarousel = ({
    media,
    currentIndex,
    onClose,
    onNext,
    onPrev,
    selectionEnabled = false,
    selectedItems = new Set(),
    toggleItemSelection = () => {},
    showCounter = true,
}: ImageCarouselProps) => {
    // Référence pour détecter les swipes
    const swipeRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const videoRef = useRef<any>(null);
    const currentItem = media[currentIndex];

    // Note: Les contrôles vidéo sont maintenant gérés par ReactPlayer

    // Vérifier s'il y a plus d'un élément
    const hasMultipleItems = media.length > 1;
    const isVideo = currentItem?.isVideo;
    const isExternalVideoSource = currentItem && isExternalVideo(currentItem.src);
    const isYouTube = currentItem?.isYouTube || currentItem?.provider === 'youtube';
    const isDailymotion = currentItem?.provider === 'dailymotion';
    const isExternalVid = isExternalVideoSource || isYouTube || isDailymotion;

    // Note: Les fonctions de contrôle vidéo sont maintenant gérées par ReactPlayer

    // Note: ReactPlayer gère automatiquement le changement d'élément et les métadonnées

    // Gérer les événements touch pour le swipe
    useEffect(() => {
        const element = swipeRef.current;
        if (!element || !hasMultipleItems) return;

        const handleTouchStart = (e: TouchEvent) => {
            startXRef.current = e.touches[0].clientX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const diffX = e.changedTouches[0].clientX - startXRef.current;
            if (diffX > 50) {
                // Swipe droite
                onPrev();
            } else if (diffX < -50) {
                // Swipe gauche
                onNext();
            }
        };

        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [onNext, onPrev, hasMultipleItems]);

    // Gérer les touches clavier pour la navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (hasMultipleItems) {
                if (e.key === 'ArrowRight') onNext();
                if (e.key === 'ArrowLeft') onPrev();
            }
            // Note: Les contrôles vidéo (espace, m, f) sont gérés par ReactPlayer
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev, hasMultipleItems]);

    return (
        <motion.div
            className={styles.carousel}
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{
                duration: 0.4,
                backdropFilter: { delay: 0.1, duration: 0.5 },
            }}
        >
            <div className="absolute top-4 right-4 flex items-center space-x-4">
                <button className={styles['carousel-button']} onClick={onClose}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {hasMultipleItems && (
                <button className={`${styles['nav-button']} ${styles['prev']}`} onClick={onPrev}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
            )}

            <div ref={swipeRef} className={styles['carousel-container']} onClick={onClose}>
                <motion.div
                    className="relative max-w-full max-h-[90vh] w-full h-full flex items-center justify-center"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 10 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        delay: 0.15,
                    }}
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        {isVideo ? (
                            isExternalVid && currentItem.videoId ? (
                                // Vidéo externe (YouTube, Dailymotion)
                                <div
                                    className={styles['youtube-wrapper']}
                                    style={{ zIndex: 10000, position: 'relative' }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <iframe
                                        src={
                                            currentItem.embedUrl ||
                                            getVideoEmbedUrl(
                                                currentItem.videoId,
                                                currentItem.provider || 'youtube',
                                                {
                                                    autoplay: false,
                                                    controls: true,
                                                    modestBranding: true,
                                                    rel: false,
                                                    showInfo: false,
                                                },
                                            ) ||
                                            undefined
                                        }
                                        className={styles['youtube-video']}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        title="Lecteur vidéo"
                                    />
                                </div>
                            ) : (
                                // Vidéo fichier avec ReactPlayer
                                <div className={styles['video-wrapper']}>
                                    <ReactPlayer
                                        ref={videoRef}
                                        url={getMediaUrl(currentItem.src)}
                                        className="react-player"
                                        width="100%"
                                        height="100%"
                                        controls={true}
                                        playing={false}
                                        muted={false}
                                        loop={true}
                                        playsinline={true}
                                        config={{
                                            file: {
                                                attributes: {
                                                    controlsList: 'nodownload',
                                                    disablePictureInPicture: false,
                                                },
                                            },
                                        }}
                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    />
                                </div>
                            )
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Overlay transparent pour gérer les clics en dehors */}
                                <div
                                    className="absolute inset-0 z-10"
                                    onClick={onClose}
                                    style={{ cursor: 'pointer' }}
                                />

                                {/* Image avec dimensions responsives */}
                                <div className="relative z-20 w-full h-[85vh] sm:h-[90vh]">
                                    <ProtectedImage
                                        src={getMediaUrl(currentItem.src)}
                                        alt={`Média ${currentIndex + 1}`}
                                        onClick={(e) => e.stopPropagation()}
                                        onOutsideClick={() => onClose()}
                                        className={styles['carousel-image']}
                                        containerClassName={styles['carousel-image-container']}
                                        containerStyle={{ width: '100%', height: '100%' }}
                                        fill
                                        priority
                                        quality={100}
                                        sizes="100vw"
                                        objectFit="contain"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {hasMultipleItems && (
                <button className={`${styles['nav-button']} ${styles['next']}`} onClick={onNext}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            )}

            {selectionEnabled && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50">
                    <motion.button
                        className={`${styles['select-button']} ${
                            selectedItems.has(currentItem.src) ? styles['selected'] : ''
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleItemSelection(currentItem.src);
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        {selectedItems.has(currentItem.src) ? (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span className={styles['select-label']}>Sélectionnée</span>
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                <span className={styles['select-label']}>Sélectionner</span>
                            </>
                        )}
                    </motion.button>
                </div>
            )}

            {showCounter && hasMultipleItems && (
                <div className={styles['counter']}>
                    <motion.div
                        className={styles['counter-badge']}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        <span>
                            {currentIndex + 1} / {media.length}
                        </span>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default ImageCarousel;
