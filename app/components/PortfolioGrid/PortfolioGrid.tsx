'use client';
import { log } from 'console';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

import gsap from '../../lib/gsap-config';
import { getMediaUrl } from '../../utils/mediaUrl';
import ImageCarousel from '../ImageCarousel/ImageCarousel';

import styles from './PortfolioGrid.module.scss';

// Types pour les projets
export interface Project {
    title?: string;
    category: string;
    source: string;
    isVideo?: boolean;
    format?: 'paysage' | 'portrait';
    thumbnail?: string; // Miniature optionnelle pour les vidéos
}

interface PortfolioGridProps {
    projects: Project[];
    showFilter?: boolean;
    // Options pour la sélection
    selectionEnabled?: boolean;
    onSelectionChange?: (selectedItems: Set<string>) => void;
    selectedItems?: Set<string>;
    selectionLabel?: string;
}

const PortfolioGrid: React.FC<PortfolioGridProps> = ({
    projects,
    showFilter = true,
    selectionEnabled = false,
    onSelectionChange,
    selectedItems: externalSelectedItems,
    selectionLabel = 'Sélectionner',
}) => {
    // État pour le filtre actif
    const [activeFilter, setActiveFilter] = useState('Tout');
    // État pour les projets filtrés
    const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
    // État pour la vidéo en cours de lecture
    const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
    // État pour le carrousel d'images
    const [showCarousel, setShowCarousel] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    // État pour les éléments sélectionnés (gestion interne si pas fourni en props)
    const [internalSelectedItems, setInternalSelectedItems] = useState<Set<string>>(new Set());

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

    // Effet pour filtrer les projets quand le filtre change
    useEffect(() => {
        // Filtrer les projets en fonction du filtre actif
        let newFilteredProjects = projects;

        // Filtrer par catégorie si ce n'est pas "Tout"
        if (activeFilter !== 'Tout') {
            newFilteredProjects = newFilteredProjects.filter(
                (project) => project.category === activeFilter,
            );
        }

        // Animation de sortie
        const tl = gsap.timeline();

        tl.to(projectRefs.current, {
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
                            },
                        );
                    }
                }, 50);
            },
        });
    }, [activeFilter, projects, activeVideoIndex]);

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

    // Extraire les catégories uniques des projets
    const categories = [
        'Tout',
        ...Array.from(new Set(projects.map((project) => project.category).filter(Boolean))),
    ];

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

    // Préparation des médias pour le carrousel (images et vidéos)
    const carouselMedia = filteredProjects.map((project) => ({
        src: project.source,
        isVideo: project.isVideo,
    }));

    return (
        <>
            <div className={styles.portfolioContainer}>
                {/* Filtres de catégories */}
                {showFilter && categories.length > 1 && (
                    <div className={styles.filterContainer}>
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={`${styles.filterBtn} ${
                                    activeFilter === category ? styles.active : styles.inactive
                                }`}
                                onClick={() => setActiveFilter(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                )}

                {/* Compteur de sélection (si la sélection est activée) */}
                {selectionEnabled && selectedItems.size > 0 && (
                    <div className={styles.selectionCounter}>
                        {selectedItems.size} éléments sélectionnés
                    </div>
                )}

                {/* Grille de projets */}
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
                                    <>
                                        {project.thumbnail ? (
                                            <div className={styles.portfolioImageContainer}>
                                                <Image
                                                    src={getMediaUrl(project.thumbnail)}
                                                    alt={project.title ?? ''}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                                <div
                                                    className={`${styles.videoPlayBtn} ${activeVideoIndex === index ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}
                                                >
                                                    <div className={styles.videoPlayIcon}>
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
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <video
                                                    ref={(el) => addVideoRef(el, index)}
                                                    src={getMediaUrl(project.source)}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    loop
                                                    muted
                                                    playsInline
                                                />
                                                <div
                                                    className={`${styles.videoPlayBtn} ${activeVideoIndex === index ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}
                                                >
                                                    <div className={styles.videoPlayIcon}>
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
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className={styles.portfolioImageContainer}>
                                        <Image
                                            src={getMediaUrl(project.source)}
                                            alt={project.title ?? ''}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                {project.category && (
                                    <div className={styles.categoryBadge}>{project.category}</div>
                                )}

                                {project.title && (
                                    <div
                                        className={`${styles.titleGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                    >
                                        <h3 className={styles.itemTitle}>{project.title}</h3>
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
