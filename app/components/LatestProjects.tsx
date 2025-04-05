'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

import gsap from '../lib/gsap-config';
import { getMediaUrl } from '../utils/mediaUrl';

interface Project {
  id: string;
  title: string;
  imageSrc: string;
  videoSrc?: string;
  link: string;
}

interface LatestProjectsProps {
  projects: Project[];
}

export default function LatestProjects({ projects }: LatestProjectsProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const projectRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current || projectRefs.current.length === 0) return;

    // Animation des projets au scroll
    projectRefs.current.forEach((project, index) => {
      if (!project) return;
      
      gsap.fromTo(
        project,
        {
          y: 50,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: index * 0.2,
          scrollTrigger: {
            trigger: project,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        },
      );
    });
  }, []);

  // Fonction pour ajouter les références aux projets
  const addProjectRef = (el: HTMLDivElement | null, index: number) => {
    projectRefs.current[index] = el;
  };

  return (
    <div ref={sectionRef} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {projects.map((project, index) => (
          <div 
            key={project.id} 
            ref={(el) => addProjectRef(el, index)}
            className="relative aspect-video overflow-hidden rounded-lg opacity-0 group"
          >
            <Link href={project.link}>
              <div className="relative w-full h-full">
                <Image 
                  src={getMediaUrl(project.imageSrc)} 
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay sombre */}
                <div className="absolute inset-0 bg-black bg-opacity-30 transition-opacity duration-300 group-hover:bg-opacity-20"></div>
                
                {/* Bouton de lecture */}
                <div
                    className={`absolute inset-0 bg-black/30 z-10 flex items-center justify-center cursor-pointer transition-opacity duration-300 opacity-100 group-hover:opacity-0'}`}
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
                
                {/* Titre du projet */}
                {project.title && (
                    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent pt-10 pb-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="text-white text-lg font-medium">
                            {project.title}
                        </h3>
                    </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 