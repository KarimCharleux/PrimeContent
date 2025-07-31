'use client';

import { useState, useEffect, useRef } from 'react';

import gsap from '../../lib/gsap-config';
import { getMediaUrl } from '../../utils/mediaUrl';
import { VideoProvider, getVideoThumbnail, isExternalVideo } from '../../utils/videoManager';
import ImageCarousel from '../ImageCarousel/ImageCarousel';
import ProtectedImage from '../ProtectedImage';

import styles from './PortfolioGrid.module.scss';

// Types pour les projets
export interface Project {
    title?: string;
    category: string;
    source: string;
    isVideo?: boolean;
    format?: 'paysage' | 'portrait';
    thumbnail?: string; // Miniature optionnelle pour les vidéos
    clientType?: 'marque' | 'celebrite'; // Type de client
    clientName?: string; // Nom du client
    // Propriétés vidéo unifiées
    provider?: VideoProvider; // 'youtube' | 'dailymotion' | 'local'
    videoId?: string; // ID de la vidéo externe
    embedUrl?: string; // URL d'embed
    watchUrl?: string; // URL de visionnage
    // Propriétés de rétrocompatibilité
    isYouTube?: boolean;
    youtubeId?: string;
}

// Interface pour les filtres personnalisés
interface CustomFilter {
    key: string;
    label: string;
}

// Interface pour les données des clients/marques (pour l'affichage avec images)
export interface ClientData {
    name: string;
    imageSrc: string;
    imageBackground?: string;
    type: 'brand' | 'celebrity';
}

interface PortfolioGridProps {
    projects: Project[];
    showFilter?: boolean;
    // Options pour la sélection
    selectionEnabled?: boolean;
    onSelectionChange?: (selectedItems: Set<string>) => void;
    selectedItems?: Set<string>;
    selectionLabel?: string;
    // Support pour les filtres personnalisés
    customFilters?: CustomFilter[];
    activeFilter?: string;
    onFilterChange?: (filter: string) => void;
    // Option pour afficher un dégradé en bas pour inciter à voir plus
    showGradientOverlay?: boolean;
    // Nouvelles options pour l'affichage avec images (page client)
    filterWithImages?: boolean;
    clientData?: { [key: string]: ClientData };
    activeClientType?: 'marques' | 'celebrites';
}

const PortfolioGrid: React.FC<PortfolioGridProps> = ({
    projects,
    showFilter = true,
    selectionEnabled = false,
    onSelectionChange,
    selectedItems: externalSelectedItems,
    selectionLabel = 'Sélectionner',
    customFilters,
    activeFilter: externalActiveFilter,
    onFilterChange,
    showGradientOverlay = false,
    filterWithImages = false,
    clientData,
    activeClientType,
}) => {
    // État pour le filtre actif
    const [internalActiveFilter, setInternalActiveFilter] = useState('Tout');
    // État pour les projets filtrés
    const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
    // État pour la vidéo en cours de lecture
    const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
    // État pour le carrousel d'images
    const [showCarousel, setShowCarousel] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    // État pour les éléments sélectionnés (gestion interne si pas fourni en props)
    const [internalSelectedItems, setInternalSelectedItems] = useState<Set<string>>(new Set());
    // État pour les miniatures Dailymotion récupérées à la volée
    const [dailymotionThumbnails, setDailymotionThumbnails] = useState<{ [key: string]: string }>(
        {},
    );
    // État pour le chargement initial
    const [isLoading, setIsLoading] = useState(true);

    // Utiliser soit le filtre externe soit l'interne
    const activeFilter = externalActiveFilter || internalActiveFilter;

    // Utiliser soit les selectedItems externes soit les internes
    const selectedItems = externalSelectedItems || internalSelectedItems;

    // Références pour les animations
    const projectsContainerRef = useRef<HTMLDivElement>(null);
    const projectRefs = useRef<(HTMLDivElement | null)[]>([]);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    // Fonction pour ajouter les références aux projets
    const addProjectRef = (el: HTMLDivElement | null, index: number) => {
        projectRefs.current[index] = el;
    };

    // Fonction pour ajouter les références aux vidéos
    const addVideoRef = (el: HTMLVideoElement | null, index: number) => {
        videoRefs.current[index] = el;
    };

    // Fonction pour ouvrir le carrousel
    const openCarousel = (index: number) => {
        setCurrentImageIndex(index);
        setShowCarousel(true);
        // Désactiver le défilement de la page
        document.body.style.overflow = 'hidden';
    };

    // Fonction pour fermer le carrousel
    const closeCarousel = () => {
        setShowCarousel(false);
        // Réactiver le défilement de la page
        document.body.style.overflow = 'auto';
    };

    // Fonction pour passer à l'image suivante
    const nextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === filteredProjects.length - 1 ? 0 : prevIndex + 1,
        );
    };

    // Fonction pour passer à l'image précédente
    const prevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? filteredProjects.length - 1 : prevIndex - 1,
        );
    };

    // Fonction pour récupérer la miniature Dailymotion à la volée
    const fetchDailymotionThumbnail = async (videoId: string, videoUrl: string) => {
        try {
            const response = await fetch(
                `/api/video-metadata?url=${encodeURIComponent(videoUrl)}&provider=dailymotion`,
            );

            if (!response.ok) {
                throw new Error('Erreur API');
            }

            const data = await response.json();

            if (data.success && data.metadata.thumbnail) {
                setDailymotionThumbnails((prev) => ({
                    ...prev,
                    [videoId]: data.metadata.thumbnail,
                }));
                return data.metadata.thumbnail;
            }
        } catch (error) {
            console.error('Erreur récupération miniature Dailymotion:', error);
        }
        return null;
    };

    // Fonction pour gérer la sélection d'un projet
    const toggleSelection = (source: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation(); // Empêcher l'ouverture du carrousel lors de la sélection
        }
        if (!selectionEnabled) return;

        const newSelection = new Set(selectedItems);
        if (newSelection.has(source)) {
            newSelection.delete(source);
        } else {
            newSelection.add(source);
        }

        // Si un callback externe a été fourni, l'utiliser
        if (onSelectionChange) {
            onSelectionChange(newSelection);
        } else {
            // Sinon, utiliser l'état interne
            setInternalSelectedItems(newSelection);
        }
    };

    // Fonction pour gérer le changement de filtre
    const handleFilterChange = (filter: string) => {
        if (onFilterChange) {
            onFilterChange(filter);
        } else {
            setInternalActiveFilter(filter);
        }
    };

    // Effet pour gérer l'état de loading
    useEffect(() => {
        // Si nous avons des projets, on n'est plus en chargement
        if (projects && projects.length > 0) {
            setIsLoading(false);
        }
        // Si aucun projet après un délai, considérer que le chargement est terminé
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000); // 3 secondes max

        return () => clearTimeout(timer);
    }, [projects]);

    // Effet pour filtrer les projets quand le filtre change
    useEffect(() => {
        // Si on a des projets, montrer un loading bref pendant le filtrage
        if (projects.length > 0) {
            setIsLoading(true);
        }

        // Filtrer les projets en fonction du filtre actif
        let newFilteredProjects = projects;

        // Si on utilise des filtres personnalisés
        if (customFilters && activeFilter !== 'Tout') {
            const filterKey = activeFilter;
            newFilteredProjects = newFilteredProjects.filter((project) => {
                const clientKey = project.clientName?.toLowerCase().replace(/\s+/g, '-');
                return clientKey === filterKey;
            });
        }
        // Sinon, utiliser le filtrage par catégorie
        else if (!customFilters && activeFilter !== 'Tout') {
            newFilteredProjects = newFilteredProjects.filter(
                (project) => project.category === activeFilter,
            );
        }

        // Trier les projets pour mettre les vidéos YouTube/Dailymotion en haut
        newFilteredProjects = newFilteredProjects.sort((a, b) => {
            // Si les deux sont des vidéos externes ou les deux ne le sont pas, garder l'ordre original
            const aIsExternal =
                a.provider === 'youtube' || a.provider === 'dailymotion' || a.isYouTube;
            const bIsExternal =
                b.provider === 'youtube' || b.provider === 'dailymotion' || b.isYouTube;

            if (aIsExternal && !bIsExternal) return -1; // a en premier
            if (!aIsExternal && bIsExternal) return 1; // b en premier
            return 0; // garder l'ordre original
        });

        // Animation de sortie
        const tl = gsap.timeline();

        // Filtrer les références valides (non nulles)
        const validProjectRefs = projectRefs.current.filter((ref) => ref !== null);

        if (validProjectRefs.length > 0) {
            tl.to(validProjectRefs, {
                opacity: 0,
                y: 20,
                stagger: 0.05,
                duration: 0.3,
                onComplete: () => {
                    // Arrêter toutes les vidéos en cours de lecture
                    if (activeVideoIndex !== null) {
                        const currentVideo = videoRefs.current[activeVideoIndex];
                        if (currentVideo) {
                            currentVideo.pause();
                            currentVideo.currentTime = 0;
                        }
                        setActiveVideoIndex(null);
                    }

                    // Mettre à jour les projets filtrés
                    setFilteredProjects(newFilteredProjects);

                    // Animation d'entrée après mise à jour
                    setTimeout(() => {
                        const portfolioItems = projectsContainerRef.current?.querySelectorAll(
                            `.${styles.portfolioItem}`,
                        );
                        if (portfolioItems && portfolioItems.length > 0) {
                            gsap.fromTo(
                                portfolioItems,
                                {
                                    opacity: 0,
                                    y: 20,
                                },
                                {
                                    opacity: 1,
                                    y: 0,
                                    stagger: 0.05,
                                    duration: 0.5,
                                    onComplete: () => {
                                        // Arrêter le loading une fois l'animation terminée
                                        setIsLoading(false);
                                    },
                                },
                            );
                        } else {
                            // Si pas d'éléments, arrêter le loading immédiatement
                            setIsLoading(false);
                        }
                    }, 50);
                },
            });
        } else {
            // Si pas d'éléments valides, juste mettre à jour les projets filtrés
            setFilteredProjects(newFilteredProjects);
            // Arrêter le loading
            setIsLoading(false);
        }
    }, [activeFilter, projects, activeVideoIndex, customFilters]);

    // Gestion de la lecture des vidéos
    useEffect(() => {
        // Pause toutes les vidéos sauf celle active
        videoRefs.current.forEach((video, idx) => {
            if (video) {
                if (idx === activeVideoIndex) {
                    video.play().catch((err) => console.error('Erreur de lecture vidéo:', err));
                } else {
                    video.pause();
                }
            }
        });
    }, [activeVideoIndex]);

    // Récupérer automatiquement les miniatures Dailymotion manquantes
    useEffect(() => {
        const dailymotionProjectsWithoutThumbnail = projects.filter(
            (project) =>
                project.provider === 'dailymotion' &&
                project.videoId &&
                !project.thumbnail &&
                !dailymotionThumbnails[project.videoId],
        );

        if (dailymotionProjectsWithoutThumbnail.length > 0) {
            dailymotionProjectsWithoutThumbnail.forEach((project) => {
                if (project.videoId) {
                    fetchDailymotionThumbnail(project.videoId, project.source);
                }
            });
        }
    }, [projects, dailymotionThumbnails]);

    // Générer les catégories ou utiliser les filtres personnalisés
    const categories = customFilters
        ? ['Tout', ...customFilters.map((f) => f.key)]
        : [
              'Tout',
              ...Array.from(new Set(projects.map((project) => project.category).filter(Boolean))),
          ];

    const categoryLabels = customFilters
        ? Object.fromEntries([['Tout', 'Tout'], ...customFilters.map((f) => [f.key, f.label])])
        : {};

    // Fonction pour déterminer la classe de taille en fonction du format de l'image
    const getItemSizeClass = (project: Project) => {
        // Utiliser le format spécifié ou le détecter automatiquement
        const format = project.format || detectFormat(project.source);

        switch (format) {
            case 'paysage':
                return styles.portfolioItemPaysage;
            case 'portrait':
                return styles.portfolioItemPortrait;
            default:
                return styles.portfolioItemPaysage; // Par défaut, on utilise le format paysage
        }
    };

    // Fonction pour détecter le format d'une image à partir de son nom de fichier
    const detectFormat = (source: string): 'paysage' | 'portrait' => {
        const filename = source.toLowerCase();

        if (filename.includes('portrait') || filename.includes('vertical')) {
            return 'portrait';
        } else {
            // Par défaut, on considère que c'est un format paysage
            return 'paysage';
        }
    };

    // Fonction pour récupérer la bonne miniature (vidéo externe ou fichier)
    const getProjectThumbnail = (project: Project): string => {
        // ✅ PRIORITÉ 1 : Si on a une miniature sauvegardée, l'utiliser
        if (project.thumbnail) {
            return getMediaUrl(project.thumbnail);
        }

        // ✅ SOLUTION : Utiliser miniature Dailymotion récupérée à la volée
        if (project.provider === 'dailymotion' && project.videoId && !project.thumbnail) {
            // Vérifier si on a déjà récupéré la miniature
            const cachedThumbnail = dailymotionThumbnails[project.videoId];
            if (cachedThumbnail) {
                return cachedThumbnail;
            }

            // Lancer la récupération à la volée (asynchrone)
            fetchDailymotionThumbnail(project.videoId, project.source);

            // En attendant, utiliser placeholder pour éviter les 404
            return '/placeholder-photo.png';
        }

        // ✅ PRIORITÉ 2 : Pour YouTube SEULEMENT (fonctionne bien)
        if (project.provider === 'youtube' && project.videoId) {
            const thumbnailUrl = getVideoThumbnail(project.videoId, 'youtube');
            if (thumbnailUrl) return thumbnailUrl;
        }

        // Rétrocompatibilité : Si c'est YouTube et qu'on a un youtubeId
        if (project.isYouTube && project.youtubeId) {
            const thumbnailUrl = getVideoThumbnail(project.youtubeId, 'youtube');
            if (thumbnailUrl) return thumbnailUrl;
        }

        // ✅ POUR DAILYMOTION : NE PAS générer de miniature (évite les 404)
        // Utiliser directement la source ou placeholder

        // Si on a une source valide, l'utiliser
        if (project.source) {
            return getMediaUrl(project.source);
        }

        // En dernier recours, retourner l'image placeholder
        return '/placeholder-photo.png';
    };

    // Préparation des médias pour le carrousel (images et vidéos)
    const carouselMedia = filteredProjects.map((project) => ({
        src: project.source,
        isVideo: project.isVideo,
        provider: project.provider || (project.isYouTube ? 'youtube' : 'local'),
        videoId: project.videoId || project.youtubeId,
        embedUrl: project.embedUrl,
        watchUrl: project.watchUrl,
        thumbnail: project.thumbnail, // ✅ Passer la miniature sauvegardée au carrousel
        // Rétrocompatibilité
        isYouTube: project.isYouTube,
        youtubeId: project.youtubeId,
    }));

    return (
        <>
            <div className={styles.portfolioContainer}>
                {/* Filtres de catégories */}
                {showFilter && categories.length > 1 && (
                    <div className={styles.filterContainer}>
                        {categories.map((category) => {
                            // Si filterWithImages est activé et qu'on a des données client
                            if (filterWithImages && clientData && category !== 'Tout') {
                                const clientInfo = clientData[category];
                                if (clientInfo) {
                                    return (
                                        <button
                                            key={category}
                                            className={`${styles.filterBtn} ${styles.filterBtnWithImage} ${
                                                activeFilter === category
                                                    ? styles.active
                                                    : styles.inactive
                                            }`}
                                            onClick={() => handleFilterChange(category)}
                                        >
                                            <div className={styles.filterImageContainer}>
                                                {/* Background image si disponible */}
                                                {clientInfo.imageBackground && (
                                                    <div
                                                        className={styles.filterImageBackground}
                                                        style={{
                                                            backgroundImage: `url(${getMediaUrl(clientInfo.imageBackground)})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            backgroundRepeat: 'no-repeat',
                                                        }}
                                                    />
                                                )}
                                                <ProtectedImage
                                                    src={getMediaUrl(clientInfo.imageSrc)}
                                                    alt={clientInfo.name}
                                                    width={32}
                                                    height={32}
                                                    className={`${styles.filterImage} ${
                                                        clientInfo.type === 'celebrity'
                                                            ? styles.filterImageRound
                                                            : styles.filterImageLogo
                                                    }`}
                                                />
                                                {/* Afficher le nom seulement pour les célébrités */}
                                                {clientInfo.type === 'celebrity' && (
                                                    <span className={styles.filterImageLabel}>
                                                        {customFilters
                                                            ? categoryLabels[category] ||
                                                              clientInfo.name
                                                            : clientInfo.name}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                }
                            }

                            // Rendu normal pour les autres cas
                            return (
                                <button
                                    key={category}
                                    className={`${styles.filterBtn} ${
                                        activeFilter === category ? styles.active : styles.inactive
                                    }`}
                                    onClick={() => handleFilterChange(category)}
                                >
                                    {customFilters
                                        ? categoryLabels[category] || category
                                        : category}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Compteur de sélection (si la sélection est activée) */}
                {selectionEnabled && selectedItems.size > 0 && (
                    <div className={styles.selectionCounter}>
                        {selectedItems.size} éléments sélectionnés
                    </div>
                )}

                {/* Container avec dégradé optionnel */}
                <div className="relative">
                    {/* Spinner de chargement */}
                    {isLoading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}>
                                <svg
                                    className={styles.spinnerIcon}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className={styles.spinnerCircle}
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className={styles.spinnerPath}
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            </div>
                            <p className={styles.loadingText}>Chargement des médias...</p>
                        </div>
                    ) : (
                        /* Grille de projets */
                        <div ref={projectsContainerRef} className={styles.portfolioGrid}>
                            {filteredProjects.length > 0 ? (
                                filteredProjects.map((project, index) => (
                                    <div
                                        key={`${project.title || project.category}-${index}`}
                                        ref={(el) => addProjectRef(el, index)}
                                        className={`${styles.portfolioItem} ${getItemSizeClass(project)} ${
                                            selectedItems.has(project.source) ? styles.selected : ''
                                        } group`}
                                        onClick={() => {
                                            if (!project.isVideo || activeVideoIndex !== index) {
                                                // Trouver l'index correct dans le tableau filtré
                                                const mediaIndex = filteredProjects.findIndex(
                                                    (p) => p.source === project.source,
                                                );
                                                openCarousel(mediaIndex);
                                            }
                                        }}
                                    >
                                        {project.isVideo ? (
                                            <div className={styles.portfolioImageContainer}>
                                                {/* Si on a une miniature ou c'est une vidéo externe, utiliser Image */}
                                                {project.thumbnail ||
                                                isExternalVideo(project.source) ||
                                                (project.provider &&
                                                    project.provider !== 'local') ||
                                                project.isYouTube ? (
                                                    <ProtectedImage
                                                        src={getProjectThumbnail(project)}
                                                        alt={project.title ?? ''}
                                                        fill
                                                        sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    // Sinon, utiliser la vidéo comme miniature
                                                    <video
                                                        src={getMediaUrl(project.source)}
                                                        muted
                                                        loop
                                                        playsInline
                                                        style={{
                                                            position: 'absolute',
                                                            height: '100%',
                                                            width: '100%',
                                                            inset: '0px',
                                                            objectFit: 'cover',
                                                        }}
                                                        onLoadedData={(e) => {
                                                            const video =
                                                                e.target as HTMLVideoElement;
                                                            video.currentTime = 1; // Aller à 1 seconde pour éviter le noir
                                                        }}
                                                    />
                                                )}

                                                {/* Badge du fournisseur vidéo supprimé comme demandé */}

                                                <div
                                                    className={`${styles.videoPlayBtn} ${activeVideoIndex === index ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}
                                                >
                                                    <div className={styles.videoPlayIcon}>
                                                        {project.provider === 'youtube' ||
                                                        project.isYouTube ? (
                                                            // Icône YouTube
                                                            <svg
                                                                className="w-8 h-8 text-white"
                                                                viewBox="0 0 24 24"
                                                                fill="currentColor"
                                                            >
                                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                                            </svg>
                                                        ) : project.provider === 'dailymotion' ? (
                                                            // Icône play avec style Dailymotion
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-8 w-8 text-white"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path d="M8 5v10l7-5z" />
                                                            </svg>
                                                        ) : (
                                                            // Icône play normale
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-8 w-8 text-white"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.portfolioImageContainer}>
                                                <ProtectedImage
                                                    src={getMediaUrl(project.source)}
                                                    alt={project.title ?? ''}
                                                    fill
                                                    sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                        )}

                                        {project.category && (
                                            <div className={styles.categoryBadge}>
                                                {project.category}
                                            </div>
                                        )}

                                        {project.title && (
                                            <div
                                                className={`${styles.titleGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                            >
                                                <h3 className={styles.itemTitle}>
                                                    {project.title}
                                                </h3>
                                            </div>
                                        )}

                                        {/* Checkbox de sélection (si la sélection est activée) */}
                                        {selectionEnabled && (
                                            <div
                                                className={styles.selectionCheckbox}
                                                onClick={(e) => toggleSelection(project.source, e)}
                                            >
                                                {selectedItems.has(project.source) && (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4 text-white"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={3}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className={styles.noProjects}>
                                    Aucun projet ne correspond à ces critères.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dégradé en bas pour inciter à voir plus */}
                    {!isLoading && showGradientOverlay && filteredProjects.length > 0 && (
                        <div className="absolute -bottom-2 left-0 right-0 h-[830px] bg-gradient-to-t from-[#060608] to-[#060608]/50 to-transparent pointer-events-none z-10" />
                    )}
                </div>
            </div>

            {/* Carrousel d'images et vidéos */}
            {showCarousel && carouselMedia.length > 0 && (
                <ImageCarousel
                    media={carouselMedia}
                    currentIndex={currentImageIndex}
                    onClose={closeCarousel}
                    onNext={nextImage}
                    onPrev={prevImage}
                    selectionEnabled={selectionEnabled}
                    selectedItems={selectedItems}
                    toggleItemSelection={toggleSelection}
                />
            )}
        </>
    );
};

export default PortfolioGrid;
