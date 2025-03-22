'use client';
import { useState, useEffect, useRef } from 'react';
import gsap from '../../lib/gsap-config';
import Image from 'next/image';
import styles from './PortfolioGrid.module.scss';

// Types pour les projets
export interface Project {
    title?: string;
    category: string;
    source: string;
    isVideo?: boolean;
    format?: 'paysage' | 'portrait';
}

interface PortfolioGridProps {
    projects: Project[];
    showFilter?: boolean;
}

const PortfolioGrid: React.FC<PortfolioGridProps> = ({
    projects,
    showFilter = true,
}) => {
    // État pour le filtre actif
    const [activeFilter, setActiveFilter] = useState('Tout');
    // État pour les projets filtrés
    const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
    // État pour la vidéo en cours de lecture
    const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);

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

    // Fonction pour gérer la lecture des vidéos
    const handleVideoPlay = (index: number) => {
        // Si une vidéo est déjà en cours de lecture, on l'arrête
        if (activeVideoIndex !== null && activeVideoIndex !== index) {
            const currentVideo = videoRefs.current[activeVideoIndex];
            if (currentVideo) {
                currentVideo.pause();
                currentVideo.currentTime = 0;
            }
        }

        const video = videoRefs.current[index];
        if (video) {
            if (video.paused) {
                video.play();
                setActiveVideoIndex(index);
            } else {
                video.pause();
                setActiveVideoIndex(null);
            }
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
                    const portfolioItems =
                        projectsContainerRef.current?.querySelectorAll(`.${styles.portfolioItem}`);
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
    }, [activeFilter, projects]);

    // Gestion de la lecture des vidéos
    useEffect(() => {
        // Pause toutes les vidéos sauf celle active
        videoRefs.current.forEach((video, idx) => {
            if (video) {
                if (idx === activeVideoIndex) {
                    video.play().catch(err => console.error('Erreur de lecture vidéo:', err));
                } else {
                    video.pause();
                }
            }
        });
    }, [activeVideoIndex]);

    // Extraire les catégories uniques des projets
    const categories = [
        'Tout',
        ...Array.from(new Set(projects.map((project) => project.category))),
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

    return (
        <div className={styles.portfolioContainer}>
            {/* Filtres de catégories */}
            {showFilter && categories.length > 2 && (
                <div className={styles.filterContainer}>
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`${styles.filterBtn} ${
                                activeFilter === category
                                    ? styles.active
                                    : styles.inactive
                            }`}
                            onClick={() => setActiveFilter(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            {/* Grille de projets */}
            <div ref={projectsContainerRef} className={styles.portfolioGrid}>
                {filteredProjects.length > 0 ? (
                    filteredProjects.map((project, index) => (
                        <div
                            key={`${project.title || project.category}-${index}`}
                            ref={(el) => addProjectRef(el, index)}
                            className={`${styles.portfolioItem} ${getItemSizeClass(project)} group`}
                        >
                            {project.isVideo ? (
                                <>
                                    <video
                                        ref={(el) => addVideoRef(el, index)}
                                        src={project.source}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loop
                                        muted
                                        playsInline
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleVideoPlay(index);
                                        }}
                                    />
                                    <div
                                        className={`${styles.videoPlayBtn} ${activeVideoIndex === index ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}
                                        onClick={() => handleVideoPlay(index)}
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
                                    {activeVideoIndex === index && (
                                        <div
                                            className={styles.videoPauseBtn}
                                            onClick={() => handleVideoPlay(index)}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-6 w-6 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className={styles.portfolioImageContainer}>
                                    <Image
                                        src={project.source}
                                        alt={project.title ?? ''}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                            )}

                            <div className={styles.categoryBadge}>
                                {project.category}
                            </div>

                            {project.title && (
                                <div className={`${styles.titleGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                                    <h3 className={styles.itemTitle}>
                                        {project.title}
                                    </h3>
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
    );
};

export default PortfolioGrid; 