'use client';
import { useEffect, useRef } from 'react';
import gsap from './lib/gsap-config';
import Gallery from './components/Gallery';
import ScrambleText from './components/ScrambleText';
import ExpertiseCard from './components/ExpertiseCard';
import ClientProfile from './components/ClientProfile';
import InfiniteLogoCarousel from './components/InfiniteLogoCarousel';
import PortfolioSection from './components/PortfolioSection';
import PrimaryButton from './components/PrimaryButton';
import AnimatedStat from './components/AnimatedStat';
import Footer from './components/Footer';
import Header from './components/Header';

// Importation des styles
import './styles/gallery.scss';
import './styles/home.scss';
import homePortfolioProjects from './data/homePortfolioData';

export default function Page() {
    // Références pour les éléments à animer
    const heroTitleRef = useRef<HTMLHeadingElement>(null);
    const heroTextRef = useRef<HTMLParagraphElement>(null);

    // Références pour les services
    const servicesRef = useRef<HTMLDivElement>(null);
    const serviceRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Références pour les clients
    const clientsRef = useRef<HTMLDivElement>(null);
    const clientRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Animation des textes du hero
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.fromTo(
            heroTitleRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1 },
        ).fromTo(
            heroTextRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 },
            '-=0.6', // Commence un peu avant que l'animation précédente ne soit terminée
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
        { name: "Ben & Jerry's", imageSrc: '/images/brands/ben-and-jerrys.png' },
        { name: 'Festival de Monte-Carlo', imageSrc: '/images/brands/festival-monte-carlo.png' },
        { name: "O'Tacos", imageSrc: '/images/brands/o-tacos.png' },
        { name: 'Make-A-Wish', imageSrc: '/images/brands/make-a-wish.png' },
        { name: 'TopModel International', imageSrc: '/images/brands/topmodel-international.png' },
        { name: 'Tellus', imageSrc: '/images/brands/tellus.png' },
        { name: 'Orus Bijoux', imageSrc: '/images/brands/orus-bijoux.png' },
        { name: 'OnePlace', imageSrc: '/images/brands/oneplace.png' },
        { name: 'Neuilly-Poissy', imageSrc: '/images/brands/neuilly-poissy.png' },
        { name: 'Kamera Kastros', imageSrc: '/images/brands/kamera-kastros.png' },
        { name: 'Jamel Comedy Club', imageSrc: '/images/brands/jamel-comedy-club.png' },
    ];

    // Données des clients
    const clients = [
        {
            name: 'Adil Rami',
            domain: 'Football International',
            imageSrc: '/images/clients/adil-rami.png',
            imageBackground: '/images/clients/adil-rami-bg.jpg',
        },
        {
            name: 'Adriana Karembeu',
            domain: 'Mannequin & Actrice',
            imageSrc: '/images/clients/adriana-karembeu.png',
            imageBackground: '/images/clients/adriana-karembeu-bg.jpg',
        },
        {
            name: 'Ricky Whittle',
            domain: 'Acteur',
            imageSrc: '/images/clients/ricky-whittle.png',
            imageBackground: '/images/clients/ricky-whittle-bg.jpg',
        },
        {
            name: 'Maxime Dereymez',
            domain: 'Danseur',
            imageSrc: '/images/clients/maxime-dereymez.png',
            imageBackground: '/images/clients/maxime-dereymez-bg.jpg',
        },
        {
            name: 'Yoann Huget',
            domain: 'Rugby International',
            imageSrc: '/images/clients/yoann-huget.png',
            imageBackground: '/images/clients/yoann-huget-bg.jpg',
        },
        {
            name: 'Éric Judor',
            domain: 'Acteur & Réalisateur',
            imageSrc: '/images/clients/eric-judor.png',
            imageBackground: '/images/clients/eric-judor-bg.jpg',
        },
        {
            name: 'Malik Amraoui',
            domain: 'Acteur',
            imageSrc: '/images/clients/malik-amraoui.png',
            imageBackground: '/images/clients/malik-amraoui-bg.jpg',
        },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <Header />

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
                        className="text-lg md:text-xl max-w-2xl mb-16 text-gray-300 opacity-0"
                    >
                        Chaque image devient une œuvre d'art. Nos vidéos, photos et créations
                        graphiques racontent des histoires qui valorisent votre entreprise.
                    </p>
                    <PrimaryButton 
                        text="CONTACTEZ-NOUS" 
                        href="/contact" 
                        animateOnMount={true} 
                        delay={1.2} // Délai augmenté pour s'assurer que le bouton apparaît après les autres éléments
                    />
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

                    <div
                        ref={servicesRef}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 expertise-grid"
                    >
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
                                backgroundImage="/images/expertises/social-bg.jpg"
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
                                backgroundImage="/images/expertises/web-bg.jpg"
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
                    <div className="mb-16 logo-carousel overflow-hidden">
                        <InfiniteLogoCarousel brands={brands} speed={40} />
                    </div>

                    {/* Profils des clients */}
                    <div
                        ref={clientsRef}
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16"
                    >
                        {clients.map((client, index) => (
                            <div
                                key={`${client.name}-${index}`}
                                ref={(el) => addClientRef(el, index)}
                                className="opacity-0"
                            >
                                <ClientProfile
                                    name={client.name}
                                    domain={client.domain}
                                    imageSrc={client.imageSrc}
                                    imageBackground={client.imageBackground}
                                />
                            </div>
                        ))}
                    </div>

                    <PrimaryButton text="EXPLOREZ PLUS" href="/portfolio" className="mx-auto" />
                </div>
            </section>

            {/* Section PRIMECONTENT EN CHIFFRES */}
            <section className="py-24 bg-black stats-section">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 stats-title">
                            NOS CHIFFRES
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 stats-grid">
                        <AnimatedStat value={70} description="Millions De Vues Sur Les Réseaux" />

                        <AnimatedStat value={70} description="Clients Satisfaits" />

                        <AnimatedStat value={70} description="Projets Réalisés" />

                        <AnimatedStat value={200} description="Abonnés & communautés" />

                        <AnimatedStat value={70} description="Célébrités Dans Notre Réseau" />
                    </div>
                </div>
            </section>

            {/* Section NOS RÉALISATIONS */}
            <section className="py-24 bg-gradient-to-b from-black via-gray-900 to-black portfolio-section">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 portfolio-title">
                            NOS RÉALISATIONS
                        </h2>
                    </div>
                    <PortfolioSection projects={homePortfolioProjects} showFilter={true} />
                </div>
            </section>
            {/* Footer */}
            <Footer />
        </div>
    );
}
