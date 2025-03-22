'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from './lib/gsap-config';
import Gallery from './components/Gallery';
import ExpertiseCard from './components/ExpertiseCard';
import ClientProfile from './components/ClientProfile';
import PortfolioGrid from './components/PortfolioGrid/PortfolioGrid';
import PrimaryButton from './components/PrimaryButton';
import AnimatedStat from './components/AnimatedStat';
import Footer from './components/Footer';
import Header from './components/Header';
import expertiseData from './data/homeExpertiseData';
import BrandLogo from './components/BrandLogo';
import homeBrandsData from './data/homeBrandsData';
import homeClientsData from './data/homeClientsData';
import LatestProjects from './components/LatestProjects';
import latestProjectsData from './data/latestProjectsData';
import CustomerReviews from './components/CustomerReviews';
import customerReviewsData from './data/customerReviewsData';

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

    // Références pour les logos des marques
    const brandRefs = useRef<(HTMLDivElement | null)[]>([]);
    const mobileBrandRefs = useRef<(HTMLDivElement | null)[]>([]);

    // État pour contrôler le démarrage des animations
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);

    useEffect(() => {
        // Vérifie si le splash screen est terminé via le localStorage
        const checkSplashScreen = () => {
            const splashScreenComplete = localStorage.getItem('splashScreenComplete');
            
            // Si on vient du SplashScreen
            if (splashScreenComplete === 'true') {
                setShouldStartAnimations(true);
                localStorage.removeItem('splashScreenComplete');
                // Réinitialiser la position de défilement à 0
                window.scrollTo(0, 0);
            }
            // Si on vient d'une autre page (pas de SplashScreen)
            else if (splashScreenComplete !== 'waiting') {
                // On active les animations après un petit délai pour laisser la page se charger
                setTimeout(() => {
                    setShouldStartAnimations(true);
                }, 100);
            }
        };

        // Vérifie immédiatement et toutes les 100ms si le splash screen est terminé
        checkSplashScreen();
        const interval = setInterval(checkSplashScreen, 100);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!shouldStartAnimations) return;

        // Animation des mots du titre
        const words = gsap.utils.toArray<HTMLElement>('.hero-word');
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Réinitialise les états initiaux - assurons-nous qu'ils sont visibles si shouldStartAnimations est vrai
        if (words.length > 0) {
            words.forEach(word => {
                gsap.set(word, {
                    yPercent: 100,
                    opacity: 0,
                    filter: 'blur(10px)',
                    visibility: 'visible'
                });
            });

            // Animation des mots - toujours animer pour garantir la visibilité
            words.forEach((word, index) => {
                tl.to(
                    word,
                    {
                        yPercent: 0,
                        opacity: 1,
                        filter: 'blur(0px)',
                        duration: 1,
                        visibility: 'visible'
                    },
                    index * 0.2
                );
            });
        }

        if (heroTextRef.current) {
            gsap.set(heroTextRef.current, {
                yPercent: 100,
                opacity: 0,
                filter: 'blur(10px)',
                visibility: 'visible'
            });

            // Animation du texte du hero
            tl.to(
                heroTextRef.current,
                { 
                    yPercent: 0,
                    opacity: 1,
                    filter: 'blur(0px)',
                    duration: 1,
                    visibility: 'visible'
                },
                '-=0.4'
            );
        }

        // Animation des services au scroll
        if (serviceRefs.current.length > 0) {
            serviceRefs.current.forEach((service, index) => {
                if (service) {
                    gsap.set(service, {
                        y: 50,
                        opacity: 0,
                        scale: 0.9
                    });
                    
                    gsap.to(
                        service,
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 0.8,
                            delay: index * 0.15,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: service,
                                start: 'top 85%',
                                toggleActions: 'play none none none',
                            },
                        },
                    );
                }
            });
        }

        // Animation des clients au scroll
        if (clientRefs.current.length > 0) {
            clientRefs.current.forEach((client, index) => {
                if (client) {
                    gsap.set(client, {
                        y: 30,
                        opacity: 0,
                        scale: 0.95
                    });
                    
                    gsap.to(
                        client,
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 0.7,
                            delay: 0.05 + (index % 6) * 0.1, // Grouper les animations par lignes de 6 max
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: client,
                                start: 'top 85%',
                                toggleActions: 'play none none none',
                            },
                        },
                    );
                }
            });
        }

        // Animation des logos des marques au scroll
        if (brandRefs.current.length > 0) {
            brandRefs.current.forEach((brand, index) => {
                if (brand) {
                    gsap.set(brand, {
                        scale: 0.8,
                        opacity: 0,
                    });
                    
                    gsap.to(
                        brand,
                        {
                            scale: 1,
                            opacity: 1,
                            duration: 0.5,
                            delay: 0.1 + index * 0.1,
                            ease: "back.out(1.5)",
                            scrollTrigger: {
                                trigger: brand,
                                start: 'top 85%',
                                toggleActions: 'play none none none',
                            },
                        },
                    );
                }
            });
        }
        
        // Animation des logos des marques sur mobile
        if (mobileBrandRefs.current.length > 0) {
            mobileBrandRefs.current.forEach((brand, index) => {
                if (brand) {
                    gsap.set(brand, {
                        scale: 0.8,
                        opacity: 0,
                    });
                    
                    gsap.to(
                        brand,
                        {
                            scale: 1,
                            opacity: 1,
                            duration: 0.5,
                            delay: 0.1 + index * 0.08,
                            ease: "back.out(1.5)",
                            scrollTrigger: {
                                trigger: brand,
                                start: 'top 85%',
                                toggleActions: 'play none none none',
                            },
                        },
                    );
                }
            });
        }
    }, [shouldStartAnimations]);

    // Fonction pour ajouter les références aux services
    const addServiceRef = (el: HTMLDivElement | null, index: number) => {
        serviceRefs.current[index] = el;
    };

    // Fonction pour ajouter les références aux clients
    const addClientRef = (el: HTMLDivElement | null, index: number) => {
        clientRefs.current[index] = el;
    };

    // Fonction pour ajouter les références aux logos desktop
    const addBrandRef = (el: HTMLDivElement | null, index: number) => {
        brandRefs.current[index] = el;
    };

    // Fonction pour ajouter les références aux logos mobile
    const addMobileBrandRef = (el: HTMLDivElement | null, index: number) => {
        mobileBrandRefs.current[index] = el;
    };

    return (
        <main className="min-h-screen bg-black text-white">
            <Header />
            {/* Hero Section avec Galerie */}
            <section className="relative">
                <Gallery />
                <div className="hero-content">
                    <h1
                        ref={heroTitleRef}
                        className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl"
                    >
                        <span className="hero-word" style={{ display: 'inline-block', transform: 'translateY(0px)' }}>OÙ</span>{' '}
                        <span className="hero-word" style={{ display: 'inline-block', transform: 'translateY(0px)' }}>LA</span>{' '}
                        <span className="hero-word" style={{ display: 'inline-block', transform: 'translateY(0px)' }}>CRÉATIVITÉ</span>{' '}
                        <span className="hero-word" style={{ display: 'inline-block', transform: 'translateY(0px)' }}>RENCONTRE</span>{' '}
                        <span className="hero-word" style={{ display: 'inline-block', transform: 'translateY(0px)' }}>LA</span>{' '}
                        <span className="hero-word" style={{ display: 'inline-block', transform: 'translateY(0px)' }}>STRATÉGIE</span>
                    </h1>
                    <p
                        ref={heroTextRef}
                        className="text-lg md:text-xl max-w-2xl mb-16 text-gray-300 opacity-0"
                    >
                        Chaque image devient une œuvre d&apos;art. Nos vidéos, photos et créations
                        graphiques racontent des histoires qui valorisent votre entreprise.
                    </p>
                    <PrimaryButton 
                        text="Contactez-nous" 
                        href="/contact" 
                        animateOnMount={true} 
                        delay={1.2} // Délai augmenté pour s'assurer que le bouton apparaît après les autres éléments
                    />
                </div>
            </section>

            {/* Section Expertises */}
            <section className="py-12 md:py-24 bg-gradient-to-b from-black to-gray-900 expertise-section">
                <div className="mx-auto px-4">
                    <div className="text-center mb-8 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            NOS EXPERTISES
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
                            Nous combinons créativité et stratégie pour donner vie à vos projets.
                            Découvrez nos services spécialisés pour valoriser votre marque.
                        </p>
                    </div>

                    <div
                        ref={servicesRef}
                        className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-5"
                    >
                        {expertiseData.map((expertise, index) => (
                            <div 
                                key={expertise.title}
                                ref={(el) => addServiceRef(el, index)} 
                                className={`w-[47%] sm:w-[22%] md:w-[22%] lg:w-[18%] min-w-[150px] ${!shouldStartAnimations ? 'opacity-0' : ''}`}
                            >
                                <ExpertiseCard
                                    title={expertise.title}
                                    description={expertise.description}
                                    backgroundImage={expertise.backgroundImage}
                                    icon={expertise.icon}
                                    className="expertise-card"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section Ils nous ont fait confiance */}
            <section className="py-24 bg-gradient-to-b from-gray-900 to-black trust-section">
                <div className="mx-auto px-7">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            ILS NOUS ONT FAIT CONFIANCE
                        </h2>
                    </div>

                    <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-center gap-4 2xl:gap-6">
                        {/* Marques à gauche - visible uniquement sur desktop */}
                        <div className="hidden 2xl:grid grid-cols-2 gap-6 w-[350px]">
                            {homeBrandsData.slice(0, 4).map((brand, index) => (
                                <div key={brand.name} className={`aspect-square ${!shouldStartAnimations ? 'opacity-0' : ''}`} ref={(el) => addBrandRef(el, index)}>
                                    <BrandLogo name={brand.name} imageSrc={brand.imageSrc} />
                                </div>
                            ))}
                            <div className="aspect-square"></div>
                            {homeBrandsData.slice(4, 5).map((brand, index) => (
                                <div key={brand.name} className={`aspect-square ${!shouldStartAnimations ? 'opacity-0' : ''}`} ref={(el) => addBrandRef(el, index + 4)}>
                                    <BrandLogo name={brand.name} imageSrc={brand.imageSrc} />
                                </div>
                            ))}
                        </div>

                        {/* Marques en haut - visible uniquement sur mobile */}
                        <div className="flex flex-wrap justify-center gap-4 mb-8 2xl:hidden">
                            {homeBrandsData.slice(0, 5).map((brand, index) => (
                                <div key={brand.name} className={`aspect-square w-1/6 max-md:w-1/5 max-sm:w-1/4 ${!shouldStartAnimations ? 'opacity-0' : ''}`} ref={(el) => addMobileBrandRef(el, index)}>
                                    <BrandLogo name={brand.name} imageSrc={brand.imageSrc} />
                                </div>
                            ))}
                        </div>

                        {/* Profils des clients au centre sur desktop */}
                        <div className="hidden 2xl:flex flex-col items-center w-full 2xl:max-w-4xl">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full mb-4 md:mb-6">
                                {homeClientsData.slice(0, 4).map((client, index) => (
                                    <div
                                        key={`${client.name}-${index}`}
                                        ref={(el) => addClientRef(el, index)}
                                        className={`h-[200px] md:h-[250px] ${!shouldStartAnimations ? 'opacity-0' : ''}`}
                                    >
                                        <ClientProfile
                                            name={client.name}
                                            domain={client.domain}
                                            imageSrc={client.imageSrc}
                                            imageBackground={client.imageBackground}
                                            className="h-full"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                {homeClientsData.slice(4).map((client, index) => (
                                    <div
                                        key={`${client.name}-${index + 4}`}
                                        ref={(el) => addClientRef(el, index + 4)}
                                        className={`h-[200px] md:h-[250px] ${!shouldStartAnimations ? 'opacity-0' : ''}`}
                                    >
                                        <ClientProfile
                                            name={client.name}
                                            domain={client.domain}
                                            imageSrc={client.imageSrc}
                                            imageBackground={client.imageBackground}
                                            className="h-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                
                        {/* Profils des clients au centre sur mobile */}
                        <div className="flex flex-wrap justify-center gap-4 mb-8 2xl:hidden">
                            {homeClientsData.map((client, index) => (
                                <div 
                                    key={`${client.name}-${index}`} 
                                    className={`h-[150px] md:h-[250px] ${!shouldStartAnimations ? 'opacity-0' : ''}`}
                                    ref={(el) => addClientRef(el, index + homeClientsData.length)}
                                >
                                    <ClientProfile 
                                        name={client.name} 
                                        domain={client.domain} 
                                        imageSrc={client.imageSrc} 
                                        imageBackground={client.imageBackground} 
                                        className="h-full" 
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Marques à droite - visible uniquement sur desktop */}
                        <div className="hidden 2xl:grid grid-cols-2 gap-6 w-[350px]">
                            {homeBrandsData.slice(5, 10).map((brand, index) => (
                                <div key={brand.name} className={`aspect-square ${!shouldStartAnimations ? 'opacity-0' : ''}`} ref={(el) => addBrandRef(el, index + 5)}>
                                    <BrandLogo name={brand.name} imageSrc={brand.imageSrc} />
                                </div>
                            ))}
                        </div>

                        {/* Marques en bas - visible uniquement sur mobile */}
                        <div className="flex flex-wrap justify-center gap-4 mt-8 2xl:hidden">
                            {homeBrandsData.slice(5).map((brand, index) => (
                                <div key={brand.name} className={`aspect-square w-1/6 max-md:w-1/5 max-sm:w-1/4 ${!shouldStartAnimations ? 'opacity-0' : ''}`} ref={(el) => addMobileBrandRef(el, index + 5)}>
                                    <BrandLogo name={brand.name} imageSrc={brand.imageSrc} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-16 mx-auto w-fit">
                        <PrimaryButton 
                        text="Explorez plus" 
                        href="/portfolio" 
                        animateOnMount={true}
                        delay={0.5}/>
                    </div>
                </div>
            </section>

            {/* Section PRIMECONTENT EN CHIFFRES */}
            <section className="py-24 bg-black stats-section">
                <div className="mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            NOS CHIFFRES
                        </h2>
                    </div>

                    <div className="flex flex-row flex-wrap justify-center gap-8 stats-grid">
                        <AnimatedStat 
                            value={70} 
                            description="Millions De Vues Sur Les Réseaux" 
                            delay={0}
                        />

                        <AnimatedStat 
                            value={150} 
                            description="Clients Satisfaits" 
                            delay={0.2}
                        />

                        <AnimatedStat 
                            value={200} 
                            description="Projets Réalisés" 
                            delay={0.4}
                        />

                        <AnimatedStat 
                            value={10} 
                            description="Abonnés & communautés" 
                            isPercentage={true} 
                            delay={0.6}
                        />

                        <AnimatedStat 
                            value={50} 
                            description="Célébrités Dans Notre Réseau" 
                            delay={0.8}
                        />
                    </div>
                </div>
            </section>

            {/* Section NOS RÉALISATIONS */}
            <section className="py-24 bg-gradient-to-b from-black via-gray-900 to-black">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            NOS RÉALISATIONS
                        </h2>
                    </div>
                    <PortfolioGrid projects={homePortfolioProjects} showFilter={true} />
                </div>
            </section>

            {/* Section NOS DERNIÈRES RÉALISATIONS */}
            <section className="py-24 bg-black latest-projects-section">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            NOS DERNIÈRES RÉALISATIONS
                        </h2>
                    </div>
                    <LatestProjects projects={latestProjectsData} />
                </div>
            </section>

            {/* Section CE QUE NOS CLIENTS DISENT DE NOUS */}
            <section className="py-24 bg-gradient-to-b from-black via-gray-900 to-black reviews-section">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                        CE QUE NOS CLIENTS DISENT DE NOUS
                    </h2>
                </div>
                <CustomerReviews reviews={customerReviewsData} autoplaySpeed={13000} />
            </section>

            <Footer />
        </main>
    );
}
