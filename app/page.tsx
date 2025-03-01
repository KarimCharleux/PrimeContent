'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from './lib/gsap-config';
import Gallery from './components/Gallery';
import ScrambleText from './components/ScrambleText';
import ExpertiseCard from './components/ExpertiseCard';
import ClientProfile from './components/ClientProfile';
import BrandLogo from './components/BrandLogo';
import InfiniteLogoCarousel from './components/InfiniteLogoCarousel';

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

    // Références pour les clients
    const clientsRef = useRef<HTMLDivElement>(null);
    const clientRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Animation des textes du hero
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.fromTo(heroTitleRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1 })
            .fromTo(
                heroTextRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                '-=0.6', // Commence un peu avant que l'animation précédente ne soit terminée
            )
            .fromTo(
                heroButtonRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6 },
                '-=0.4',
            );

        // Animation des services au scroll
        if (servicesRef.current && serviceRefs.current.length > 0) {
            serviceRefs.current.forEach((service, index) => {
                gsap.fromTo(
                    service,
                    {
                        y: 50,
                        opacity: 0,
                    },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        delay: index * 0.2, // Délai progressif pour chaque service
                        scrollTrigger: {
                            trigger: service,
                            start: 'top 80%', // Commence l'animation quand le haut de l'élément atteint 80% de la fenêtre
                            toggleActions: 'play none none none',
                        },
                    },
                );
            });
        }

        // Animation des clients au scroll
        if (clientsRef.current && clientRefs.current.length > 0) {
            clientRefs.current.forEach((client, index) => {
                gsap.fromTo(
                    client,
                    {
                        y: 30,
                        opacity: 0,
                    },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.6,
                        delay: index * 0.1,
                        scrollTrigger: {
                            trigger: client,
                            start: 'top 80%',
                            toggleActions: 'play none none none',
                        },
                    },
                );
            });
        }
    }, []);

    // Fonction pour ajouter les références aux services
    const addServiceRef = (el: HTMLDivElement | null, index: number) => {
        serviceRefs.current[index] = el;
    };

    // Fonction pour ajouter les références aux clients
    const addClientRef = (el: HTMLDivElement | null, index: number) => {
        clientRefs.current[index] = el;
    };

    // Données des marques
    const brands = [
        { name: 'Ben & Jerry\'s', imageSrc: '/images/brands/ben-and-jerrys.png' },
        { name: 'Festival de Monte-Carlo', imageSrc: '/images/brands/festival-monte-carlo.png' },
        { name: 'O\'Tacos', imageSrc: '/images/brands/o-tacos.png' },
        { name: 'Make-A-Wish', imageSrc: '/images/brands/make-a-wish.png' },
        { name: 'TopModel International', imageSrc: '/images/brands/topmodel-international.png' },
        { name: 'Tellus', imageSrc: '/images/brands/tellus.png' },
        { name: 'Orus Bijoux', imageSrc: '/images/brands/orus-bijoux.png' },
        { name: 'OnePlace', imageSrc: '/images/brands/oneplace.png' },
        { name: 'Neuilly-Poissy', imageSrc: '/images/brands/neuilly-poissy.png' },
        { name: 'Kamera Kastros', imageSrc: '/images/brands/kamera-kastros.png' }
    ];

    // Données des clients
    const clients = [
        { name: 'Adil Rami', imageSrc: '/images/clients/adil-rami.jpg' },
        { name: 'Adriana Karembeu', imageSrc: '/images/clients/adriana-karembeu.jpg' },
        { name: 'Ricky Whittle', imageSrc: '/images/clients/ricky-whittle.jpg' },
        { name: 'Maxim Derimez', imageSrc: '/images/clients/maxim-derimez.jpg' },
        { name: 'Yoann Huget', imageSrc: '/images/clients/yoann-huget.jpg' },
        { name: 'Eric Judor', imageSrc: '/images/clients/eric-judor.jpg' },
        { name: 'Malik Amraoui', imageSrc: '/images/clients/malik-amraoui.jpg' }
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation */}
            <nav className="w-full absolute z-50">
                <div className="max-w-7xl mx-auto px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="text-2xl font-bold">PrimeContent.</div>
                        <div className="hidden md:flex space-x-10">
                            <a
                                href="/photos"
                                className="hover:translate-y-1 transition-transform duration-300"
                            >
                                Photos
                            </a>
                            <a
                                href="/videos"
                                className="hover:translate-y-1 transition-transform duration-300"
                            >
                                Vidéos
                            </a>
                            <a
                                href="/events"
                                className="hover:translate-y-1 transition-transform duration-300"
                            >
                                Événements
                            </a>
                            <a
                                href="/contact"
                                className="hover:translate-y-1 transition-transform duration-300"
                            >
                                Contact
                            </a>
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

            {/* Section Expertises */}
            <section className="py-24 bg-gradient-to-b from-black to-gray-900 expertise-section">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 expertise-title">
                            NOS EXPERTISES
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Nous combinons créativité et stratégie pour donner vie à vos projets.
                            Découvrez nos services spécialisés pour valoriser votre marque.
                        </p>
                    </div>

                    <div ref={servicesRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 expertise-grid">
                        <div ref={(el) => addServiceRef(el, 0)} className="opacity-0">
                            <ExpertiseCard
                                title="Production Vidéo"
                                description="Captez l'attention avec des vidéos percutantes qui racontent votre histoire et valorisent votre marque."
                                backgroundImage="/images/expertises/video-bg.jpg"
                                className="expertise-card"
                                icon={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-7 w-7"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="black"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                }
                            />
                        </div>

                        <div ref={(el) => addServiceRef(el, 1)} className="opacity-0">
                            <ExpertiseCard
                                title="Photographie"
                                description="Sublimez votre image avec des photographies qui capturent l'essence de votre marque et valorisent vos produits."
                                backgroundImage="/images/expertises/photo-bg.jpg"
                                className="expertise-card"
                                icon={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-7 w-7"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="black"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                        />
                                    </svg>
                                }
                            />
                        </div>

                        <div ref={(el) => addServiceRef(el, 2)} className="opacity-0">
                            <ExpertiseCard
                                title="Stratégie Digitale"
                                description="Renforcez votre présence en ligne avec une stratégie cohérente de branding et gestion des réseaux sociaux."
                                backgroundImage="/images/expertises/social-bg.jpeg"
                                className="expertise-card"
                                icon={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-7 w-7"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="black"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                }
                            />
                        </div>

                        <div ref={(el) => addServiceRef(el, 3)} className="opacity-0">
                            <ExpertiseCard
                                title="Création Web"
                                description="Démarquez-vous avec des interfaces web et mobile innovantes, intuitives et esthétiques."
                                backgroundImage="/images/expertises/web-bg.jpeg"
                                className="expertise-card"
                                icon={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-7 w-7"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="black"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Ils nous ont fait confiance */}
            <section className="py-24 bg-gradient-to-b from-gray-900 to-black trust-section">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 trust-title">
                            ILS NOUS ONT FAIT CONFIANCE
                        </h2>
                    </div>

                    {/* Carrousel de logos */}
                    <div className="mb-16 logo-carousel">
                        <InfiniteLogoCarousel brands={brands} speed={40} />
                    </div>

                    {/* Profils des clients */}
                    <div ref={clientsRef} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16">
                        {clients.map((client, index) => (
                            <div key={index} ref={(el) => addClientRef(el, index)} className="opacity-0">
                                <ClientProfile 
                                    name={client.name} 
                                    imageSrc={`/images/clients/${client.name.toLowerCase().replace(/[^\w]/g, '-')}.jpg`} 
                                />
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <button className="px-8 py-4 bg-white text-black rounded-full hover:bg-gray-200 transition duration-300">
                            Explorer davantage
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
