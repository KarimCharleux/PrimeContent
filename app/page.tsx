'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from './lib/gsap-config';
import Gallery from './components/Gallery';
import ScrambleText from './components/ScrambleText';

// Importation des styles
import './styles/gallery.scss';
import './styles/home.scss';

export default function Page() {
    // Références pour les éléments à animer
    const heroTitleRef = useRef<HTMLHeadingElement>(null);
    const heroTextRef = useRef<HTMLParagraphElement>(null);
    const heroButtonRef = useRef<HTMLButtonElement>(null);
    
    // Références pour les services
    const servicesRef = useRef<HTMLDivElement>(null);
    const serviceRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Animation des textes du hero
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        
        tl.fromTo(
            heroTitleRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1 }
        )
        .fromTo(
            heroTextRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 },
            '-=0.6' // Commence un peu avant que l'animation précédente ne soit terminée
        )
        .fromTo(
            heroButtonRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 },
            '-=0.4'
        );

        // Animation des services au scroll
        if (servicesRef.current && serviceRefs.current.length > 0) {
            serviceRefs.current.forEach((service, index) => {
                gsap.fromTo(
                    service,
                    { 
                        y: 50, 
                        opacity: 0 
                    },
                    { 
                        y: 0, 
                        opacity: 1, 
                        duration: 0.8,
                        delay: index * 0.2, // Délai progressif pour chaque service
                        scrollTrigger: {
                            trigger: service,
                            start: 'top 80%', // Commence l'animation quand le haut de l'élément atteint 80% de la fenêtre
                            toggleActions: 'play none none none'
                        }
                    }
                );
            });
        }
    }, []);
    
    // Fonction pour ajouter les références aux services
    const addServiceRef = (el: HTMLDivElement | null, index: number) => {
        serviceRefs.current[index] = el;
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation */}
            <nav className="w-full absolute z-50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="text-2xl font-bold">
                            PrimeContent.
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a
                                href="/photos"
                                className="hover:text-purple-400 transition"
                            >
                                Photos
                            </a>
                            <a
                                href="/videos"
                                className="hover:text-purple-400 transition"
                            >
                                Vidéos
                            </a>
                            <a
                                href="/branding"
                                className="hover:text-purple-400 transition"
                            >
                                Événements
                            </a>
                            <a
                                href="/digital"
                                className="hover:text-purple-400 transition"
                            >
                                Mariage
                            </a>
                            <ScrambleText 
                                text="Contact" 
                                href="/contact"
                                className="hover:text-purple-400 transition"
                            />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section avec Galerie */}
            <section className="relative">
                <Gallery />
                <div className="hero-content">
                    <h1 
                        ref={heroTitleRef} 
                        className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl opacity-0"
                    >
                        OÙ LA CRÉATIVITÉ RENCONTRE LA STRATÉGIE
                    </h1>
                    <p 
                        ref={heroTextRef}
                        className="text-lg md:text-xl max-w-2xl mb-8 text-gray-300 opacity-0"
                    >
                        Chaque image devient une œuvre d'art. Nos vidéos, photos et créations
                        graphiques racontent des histoires qui valorisent votre entreprise.
                    </p>
                    <button 
                        ref={heroButtonRef}
                        className="hero-contact-btn px-8 py-4 w-72 bg-white text-black rounded-full transition transform flex items-center justify-center space-x-2"
                    >
                        <ScrambleText text="CONTACTEZ-NOUS" className="inline-block w-40" />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </section>

            {/* Services Section */}
            <div ref={servicesRef} className="max-w-7xl mx-auto px-4 py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div 
                        ref={(el) => addServiceRef(el, 0)}
                        className="group p-8 rounded-2xl bg-gray-900/50 hover:bg-purple-900/20 transition opacity-0"
                    >
                        <div className="w-12 h-12 bg-purple-600 rounded-lg mb-6 flex items-center justify-center">
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
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-4">
                            <ScrambleText text="Production Vidéo" />
                        </h3>
                        <p className="text-gray-400">
                            Création de contenu vidéo professionnel pour tous vos besoins marketing
                            et communication.
                        </p>
                    </div>

                    <div 
                        ref={(el) => addServiceRef(el, 1)}
                        className="group p-8 rounded-2xl bg-gray-900/50 hover:bg-purple-900/20 transition opacity-0"
                    >
                        <div className="w-12 h-12 bg-purple-600 rounded-lg mb-6 flex items-center justify-center">
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
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-4">
                            <ScrambleText text="Photographie" />
                        </h3>
                        <p className="text-gray-400">
                            Photos professionnelles pour vos événements, produits et portraits
                            d'entreprise.
                        </p>
                    </div>

                    <div 
                        ref={(el) => addServiceRef(el, 2)}
                        className="group p-8 rounded-2xl bg-gray-900/50 hover:bg-purple-900/20 transition opacity-0"
                    >
                        <div className="w-12 h-12 bg-purple-600 rounded-lg mb-6 flex items-center justify-center">
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
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-4">
                            <ScrambleText text="Design Digital" />
                        </h3>
                        <p className="text-gray-400">
                            Création d'interfaces web et mobile, branding et gestion des réseaux
                            sociaux.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

