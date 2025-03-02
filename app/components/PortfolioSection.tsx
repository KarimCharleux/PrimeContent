'use client';
import { useState, useEffect, useRef } from 'react';
import gsap from '../lib/gsap-config';
import ScrambleText from './ScrambleText';

// Types pour les projets
export interface Project {
    title?: string;
    category: string;
    source: string;
    isVideo?: boolean;
    format?: 'carre' | 'paysage' | 'portrait'; // Ajout du format
}

interface PortfolioSectionProps {
    projects: Project[];
    showFilter?: boolean;
}

const PortfolioSection: React.FC<PortfolioSectionProps> = ({
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
                        projectsContainerRef.current?.querySelectorAll('.portfolio-item');
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
            case 'carre':
                return 'portfolio-item-carre';
            case 'paysage':
                return 'portfolio-item-paysage';
            case 'portrait':
                return 'portfolio-item-portrait';
            default:
                return 'portfolio-item-carre'; // Par défaut, on utilise le format carré
        }
    };

    // Fonction pour détecter le format d'une image à partir de son nom de fichier
    // Cette fonction est une heuristique simple, à adapter selon vos conventions de nommage
    const detectFormat = (source: string): 'carre' | 'paysage' | 'portrait' => {
        const filename = source.toLowerCase();

        if (filename.includes('paysage') || filename.includes('landscape')) {
            return 'paysage';
        } else if (filename.includes('portrait') || filename.includes('vertical')) {
            return 'portrait';
        } else {
            // Par défaut, on considère que c'est un format carré
            return 'carre';
        }
    };

    return (
        <div>
            {/* Filtres de catégories */}
            {showFilter && categories.length > 2 && (
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`px-8 py-3 rounded-full filter-btn transition-all ${
                                activeFilter === category
                                    ? 'bg-white text-black'
                                    : 'bg-transparent text-white border border-white/20 hover:bg-white/10'
                            }`}
                            onClick={() => setActiveFilter(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            {/* Grille de projets */}
            <div ref={projectsContainerRef} className="portfolio-grid">
                {filteredProjects.length > 0 ? (
                    filteredProjects.map((project, index) => (
                        <div
                            key={`${project.title || project.category}-${index}`}
                            ref={(el) => addProjectRef(el, index)}
                            className={`portfolio-item group ${getItemSizeClass(project)}`}
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
                                        className={`absolute inset-0 bg-black/30 z-10 flex items-center justify-center cursor-pointer transition-opacity duration-300 ${activeVideoIndex === index ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}
                                        onClick={() => handleVideoPlay(index)}
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
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
                                            className="absolute bottom-4 right-4 z-20 bg-black/70 backdrop-blur-sm p-2 rounded-full cursor-pointer"
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
                                <img
                                    src={project.source}
                                    alt={project.title ?? ''}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            )}

                            <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-sm px-4 py-1 rounded-full text-sm">
                                {project.category}
                            </div>

                            {project.title && (
                                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent pt-10 pb-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <h3 className="text-white text-lg font-medium">
                                        {project.title}
                                    </h3>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-gray-400">
                        Aucun projet ne correspond à ces critères.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioSection;
