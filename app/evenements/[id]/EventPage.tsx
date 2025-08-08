'use client';

import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

import { Evenement, EventMediaItem } from '../../backoffice/models/eventTypes';
import PortfolioGrid from '../../components/PortfolioGrid/PortfolioGrid';
import PrimaryButton from '../../components/PrimaryButton';
import { useSelectionPersistence } from '../../hooks/useSelectionPersistence';
import { getMediaUrl } from '../../utils/mediaUrl';

// Variants pour les animations
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            delay: custom * 0.1,
            ease: [0.25, 0.1, 0.25, 1],
        },
    }),
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.3,
        },
    },
};

interface EventPageProps {
    readonly evenement: Evenement;
}

export default function EventPage({ evenement }: EventPageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [loadedMedia, setLoadedMedia] = useState<EventMediaItem[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadedCountState, setLoadedCountState] = useState(0);
    const [isDownloadingZip, setIsDownloadingZip] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    // Utiliser une ref pour suivre si le chargement initial a été fait
    const initialLoadDone = useRef(false);

    // État pour le carrousel
    const [isCarouselOpen, setIsCarouselOpen] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);

    // Calculer le prix total en fonction des sélections et des remises
    const calculateTotalPrice = () => {
        if (evenement.type === 'selection' && evenement.prixParPhoto) {
            const selectedCount = selectedItems.size;
            let remisePercent = 0;

            // Vérifier si des remises par quantité existent
            if (evenement.tarifDegressif && evenement.tarifDegressif.length > 0) {
                // Trier les tarifs dégressifs par quantité décroissante
                const sortedTarifs = [...evenement.tarifDegressif].sort(
                    (a, b) => b.quantite - a.quantite,
                );

                // Trouver la remise applicable
                for (const tarif of sortedTarifs) {
                    if (selectedCount >= tarif.quantite) {
                        remisePercent = tarif.pourcentageRemise;
                        break;
                    }
                }
            }

            const basePrice = selectedCount * evenement.prixParPhoto;
            const discount = basePrice * (remisePercent / 100);
            return basePrice - discount;
        }
        return 0;
    };

    const {
        userId,
        selection,
        loading: selectionLoading,
        saveSelection,
    } = useSelectionPersistence(evenement.id!);

    // Synchronise la sélection Firestore avec l'état local au chargement
    useEffect(() => {
        if (
            evenement.type === 'selection' &&
            selection &&
            selection.medias &&
            JSON.stringify(Array.from(selectedItems)) !== JSON.stringify(selection.medias)
        ) {
            setSelectedItems(new Set(selection.medias));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [evenement.type, selection]);

    // Sauvegarde la sélection à chaque modification
    useEffect(() => {
        if (
            evenement.type === 'selection' &&
            userId &&
            !selectionLoading &&
            selection &&
            JSON.stringify(Array.from(selectedItems)) !== JSON.stringify(selection.medias)
        ) {
            saveSelection(Array.from(selectedItems));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedItems]);

    useEffect(() => {
        // Réinitialiser l'état lors du changement d'événement
        setIsLoading(true);
        setLoadedMedia([]);
        setLoadingProgress(0);
        setLoadedCountState(0);
        setSelectedItems(new Set());
        setErrorMessage(null);
        // Réinitialiser le flag de chargement initial
        initialLoadDone.current = false;

        // Activer les animations
        setTimeout(() => {
            setShouldStartAnimations(true);
        }, 100);

        // Vérifier si l'événement a des médias
        if (!evenement.images || evenement.images.length === 0) {
            setErrorMessage("Aucun média n'a été trouvé pour cet événement.");
            setIsLoading(false);
            return;
        }

        // Si le chargement initial a déjà été fait, ne pas continuer
        if (initialLoadDone.current) {
            setIsLoading(false);
            return;
        }

        // Précharger les médias pour suivre la progression
        const totalMedia = evenement.images?.length || 0;
        let loadedCount = 0;

        // Fonction pour précharger une image
        const preloadImage = (mediaItem: EventMediaItem) => {
            return new Promise<EventMediaItem>((resolve, reject) => {
                const img = new window.Image();
                img.src = getMediaUrl(mediaItem.path);
                img.onload = () => {
                    loadedCount++;
                    setLoadingProgress(Math.round((loadedCount / totalMedia) * 100));
                    setLoadedCountState(loadedCount);
                    resolve(mediaItem);
                };
                img.onerror = () => {
                    // Compter quand même pour ne pas bloquer la progression
                    loadedCount++;
                    setLoadingProgress(Math.round((loadedCount / totalMedia) * 100));
                    setLoadedCountState(loadedCount);
                    // Résoudre avec l'item pour l'afficher ensuite (chargement normal par le composant)
                    reject(mediaItem);
                };
            });
        };

        // Précharger tous les médias
        const preloadAllMedia = async () => {
            // S'assurer que le tableau de médias est vide avant de commencer
            setLoadedMedia([]);

            const validMedia: EventMediaItem[] = [];

            if (evenement.images && evenement.images.length > 0) {
                for (const media of evenement.images) {
                    try {
                        if (media.path) {
                            if (media.isVideo) {
                                // Pour les vidéos, nous ne préchargeons pas, nous les ajoutons directement
                                validMedia.push(media);
                                loadedCount++;
                                setLoadingProgress(Math.round((loadedCount / totalMedia) * 100));
                                setLoadedCountState(loadedCount);
                            } else {
                                // Pour les images, nous les préchargeons
                                const loadedMedia = await preloadImage(media);
                                validMedia.push(loadedMedia);
                            }
                        }
                    } catch (error) {
                        // Ne pas bloquer le flux: on ajoute quand même le média
                        console.warn(`Préchargement échoué, média ajouté: ${media.path}`);
                        validMedia.push(media);
                    }
                }
            }

            if (validMedia.length === 0) {
                setErrorMessage("Aucun média n'a pu être chargé pour cet événement.");
            }

            // Mettre à jour les médias en une seule fois avec un tableau complet
            setLoadedMedia(validMedia);
            setIsLoading(false);
            // Assurons-nous que les animations sont activées une fois les médias chargés
            setShouldStartAnimations(true);
            // Marquer le chargement initial comme terminé
            initialLoadDone.current = true;
        };

        preloadAllMedia();
    }, [evenement]);

    // Gestion de la sélection d'items
    const handleSelectionChange = (newSelection: Set<string>) => {
        setSelectedItems(newSelection);
    };

    // Gérer le paiement des photos sélectionnées
    const handlePaySelectedPhotos = () => {
        // Vérifier si des photos sont sélectionnées
        if (selectedItems.size === 0) {
            alert('Veuillez sélectionner au moins une photo.');
            return;
        }
        alert(
            `Redirection vers la page de paiement pour ${selectedItems.size} photos (Total: ${calculateTotalPrice().toFixed(2)}€)...`,
        );
    };

    // Utiliser notre API proxy pour éviter les problèmes CORS
    const buildDownloadUrl = (path: string): string => {
        if (!path) return '';
        if (path.startsWith('blob:')) {
            return path;
        }
        // Utiliser notre route API proxy
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `/api/download-media?path=${encodeURIComponent('/' + cleanPath)}`;
    };

    // Gérer le téléchargement de toutes les photos
    const handleDownloadAllPhotos = () => {
        if (isDownloadingZip) return;
        try {
            const imageItems = (evenement.images || []).filter((m) => m.path && !m.isVideo);
            if (imageItems.length === 0) {
                alert('Aucune photo à télécharger.');
                return;
            }

            const startDownload = async () => {
                setIsDownloadingZip(true);
                setDownloadProgress(0);

                const zip = new JSZip();
                const folder = zip.folder('photos');
                let completed = 0;

                // Téléchargement séquentiel pour éviter de saturer le réseau/appareils mobiles
                for (const media of imageItems) {
                    try {
                        const url = buildDownloadUrl(media.path);
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const blob = await response.blob();
                        const nameFromPath =
                            media.originalName || media.path.split('/').pop() || `${media.id}.jpg`;
                        folder?.file(nameFromPath, blob);
                    } catch (e) {
                        // Continuer malgré l'erreur sur un fichier
                        console.error('Erreur téléchargement media:', media.path, e);
                    } finally {
                        completed += 1;
                        setDownloadProgress(Math.round((completed / imageItems.length) * 100));
                    }
                }

                // Générer le ZIP
                const safeTitle = (evenement.titre || 'evenement')
                    .toString()
                    .normalize('NFD')
                    .replace(/[^\w\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-')
                    .toLowerCase();

                const content = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 },
                });

                saveAs(content, `${safeTitle}-photos.zip`);
            };

            void startDownload().finally(() => {
                setIsDownloadingZip(false);
                setDownloadProgress(0);
            });
        } catch (err) {
            console.error('Erreur lors du téléchargement des photos:', err);
            setIsDownloadingZip(false);
            setDownloadProgress(0);
            alert('Erreur lors du téléchargement des photos.');
        }
    };

    // Gérer le téléchargement des médias sélectionnés
    const handleDownloadSelectedMedia = () => {
        if (isDownloadingZip) return;
        try {
            const selectedMediaPaths = Array.from(selectedItems);
            const selectedMediaItems = (evenement.images || []).filter(
                (m) => selectedMediaPaths.includes(m.path) && !m.isVideo,
            );

            if (selectedMediaItems.length === 0) {
                alert('Aucun média sélectionné à télécharger.');
                return;
            }

            const startDownload = async () => {
                setIsDownloadingZip(true);
                setDownloadProgress(0);

                const zip = new JSZip();
                const folder = zip.folder('medias-selectionnes');
                let completed = 0;

                // Téléchargement séquentiel pour éviter de saturer le réseau
                for (const media of selectedMediaItems) {
                    try {
                        const url = buildDownloadUrl(media.path);
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const blob = await response.blob();
                        const nameFromPath =
                            media.originalName || media.path.split('/').pop() || `${media.id}.jpg`;
                        folder?.file(nameFromPath, blob);
                    } catch (e) {
                        // Continuer malgré l'erreur sur un fichier
                        console.error('Erreur téléchargement media:', media.path, e);
                    } finally {
                        completed += 1;
                        setDownloadProgress(
                            Math.round((completed / selectedMediaItems.length) * 100),
                        );
                    }
                }

                // Générer le ZIP
                const safeTitle = (evenement.titre || 'evenement')
                    .toString()
                    .normalize('NFD')
                    .replace(/[^\w\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-')
                    .toLowerCase();

                const content = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 },
                });

                saveAs(content, `${safeTitle}-selection.zip`);
            };

            void startDownload().finally(() => {
                setIsDownloadingZip(false);
                setDownloadProgress(0);
            });
        } catch (err) {
            console.error('Erreur lors du téléchargement des médias sélectionnés:', err);
            setIsDownloadingZip(false);
            setDownloadProgress(0);
            alert('Erreur lors du téléchargement des médias sélectionnés.');
        }
    };

    // Gérer le paiement pour télécharger toutes les photos
    const handlePayForAllPhotos = () => {
        alert(
            `Redirection vers la page de paiement pour toutes les photos (${evenement.prixParPhoto}€)...`,
        );
    };

    // Fonction pour rendre le bouton approprié selon le type d'événement
    const renderActionButton = () => {
        switch (evenement.type) {
            case 'selection':
                if (selectedItems.size === 0) return null;

                // Si le prix par photo n'est pas défini, téléchargement gratuit
                if (!evenement.prixParPhoto) {
                    return (
                        <PrimaryButton
                            text={
                                isDownloadingZip
                                    ? `Téléchargement... ${downloadProgress}%`
                                    : `Télécharger ma sélection (${selectedItems.size} média${selectedItems.size > 1 ? 's' : ''})`
                            }
                            onClick={handleDownloadSelectedMedia}
                            animateOnMount={true}
                            delay={0.5}
                        />
                    );
                }

                // Sinon, paiement requis
                return (
                    <PrimaryButton
                        text={`Payer mes medias (${calculateTotalPrice().toFixed(2)}€)`}
                        onClick={handlePaySelectedPhotos}
                        animateOnMount={true}
                        delay={0.5}
                    />
                );
            case 'paye':
                return (
                    <PrimaryButton
                        text={
                            isDownloadingZip
                                ? `Téléchargement... ${downloadProgress}%`
                                : 'Télécharger toutes mes photos'
                        }
                        onClick={handleDownloadAllPhotos}
                        animateOnMount={true}
                        delay={0.5}
                    />
                );
            case 'non_paye':
                return (
                    <PrimaryButton
                        text={`Payer toutes les medias (${evenement.prixParPhoto}€)`}
                        onClick={handlePayForAllPhotos}
                        animateOnMount={true}
                        delay={0.5}
                    />
                );
            default:
                return null;
        }
    };

    // Fonction pour afficher les infos sur les remises (pour le mode sélection)
    const renderDiscountInfo = () => {
        if (
            evenement.type !== 'selection' ||
            !evenement.tarifDegressif ||
            evenement.tarifDegressif.length === 0
        ) {
            return null;
        }

        // Trier les tarifs par quantité croissante
        const sortedTarifs = [...evenement.tarifDegressif].sort((a, b) => a.quantite - b.quantite);

        return (
            <motion.div
                className="discount-info"
                initial={{ opacity: 0, y: 20 }}
                animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.35 }}
            >
                <div className="info-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                    </svg>
                </div>
                <div className="info-text">
                    <strong>Remises disponibles :</strong>
                    <ul className="discount-list">
                        {sortedTarifs.map((tarif, index) => (
                            <li key={index}>
                                {tarif.quantite}+ photos : {tarif.pourcentageRemise}% de remise
                            </li>
                        ))}
                    </ul>
                </div>
            </motion.div>
        );
    };

    // Convertir les médias EventMediaItem en format Project pour PortfolioGrid
    const convertMediaToProjects = () => {
        return loadedMedia.map((media) => ({
            title: media.title || '',
            category: media.category || '',
            source: media.source || media.path,
            isVideo: media.isVideo,
            format: media.format,
            thumbnail: media.thumbnail,
            // Support des vidéos externes
            provider: media.provider || 'local',
            videoId: media.videoId,
            embedUrl: media.embedUrl,
            watchUrl: media.watchUrl,
            // Rétrocompatibilité
            isYouTube: media.isYouTube,
            youtubeId: media.youtubeId,
        }));
    };

    return (
        <div className="container">
            <div className="event-header">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="title-container relative overflow-hidden !m-0"
                >
                    <motion.h2
                        className="evenement-page-title underline-title"
                        initial={{ opacity: 0 }}
                        animate={shouldStartAnimations ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Link href="/evenements">Événements</Link> / {evenement.titre}
                    </motion.h2>
                </motion.div>

                {/* Description de l'événement si elle existe */}
                {evenement.description && (
                    <motion.div
                        className="w-full flex justify-center text-gray-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={
                            shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                        }
                        transition={{ duration: 0.6, delay: 0.25 }}
                    >
                        <p>{evenement.description}</p>
                    </motion.div>
                )}
            </div>

            {/* Info prix par photo (mode sélection) */}
            {evenement.prixParPhoto && evenement.type === 'selection' ? (
                <motion.div
                    className="info-box flex gap-4 my-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <div className="info-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </div>
                    <div className="info-text">
                        Sélectionnez vos photos préférées ({evenement.prixParPhoto}€ par photo),
                        puis procédez au paiement pour pouvoir les télécharger.
                    </div>
                </motion.div>
            ) : null}

            {/* Informations sur les remises (mode sélection uniquement) */}
            {renderDiscountInfo()}

            {/* Compteur de sélection et bouton d'action */}
            <motion.div
                className="pb-5"
                initial={{ opacity: 0, y: 20 }}
                animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                {evenement.type === 'selection' && selectedItems.size > 0 ? (
                    <div className="counter-text">
                        {evenement.tarifDegressif &&
                        evenement.tarifDegressif.length > 0 &&
                        evenement.prixParPhoto ? (
                            <span className="price-text">
                                Total: {calculateTotalPrice().toFixed(2)}€
                            </span>
                        ) : null}
                    </div>
                ) : null}
                <div className="w-full flex justify-center">{renderActionButton()}</div>
            </motion.div>

            {isLoading ? (
                <motion.div
                    className="photos-loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="loader-spinner"></div>
                    <div className="loading-progress">
                        <div className="progress-count">
                            {loadedCountState}/{evenement.images.length}
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                        <div className="progress-text">
                            Chargement des médias: {loadingProgress}%
                        </div>
                    </div>
                </motion.div>
            ) : errorMessage ? (
                <motion.div
                    className="error-message"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>{errorMessage}</p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <PortfolioGrid
                        projects={convertMediaToProjects()}
                        showFilter={false}
                        selectionEnabled={evenement.type === 'selection'}
                        selectedItems={selectedItems}
                        onSelectionChange={handleSelectionChange}
                        selectionLabel="Sélectionner cette photo"
                    />
                </motion.div>
            )}
        </div>
    );
}
