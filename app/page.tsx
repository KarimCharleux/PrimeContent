'use client';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';

import { db } from './admin/lib/firebase-client';
import AnimatedStat from './components/AnimatedStat';
import BrandLogo from './components/BrandLogo';
import ClientProfile from './components/ClientProfile';
import CustomerReviews from './components/CustomerReviews';
import ExpertiseCard from './components/ExpertiseCard';
import Footer from './components/Footer';
import Gallery from './components/Gallery';
import Header from './components/Header';
import LatestProjects from './components/LatestProjects';
import PortfolioGrid from './components/PortfolioGrid/PortfolioGrid';
import PrimaryButton from './components/PrimaryButton';
import customerReviewsData from './data/customerReviewsData';
import homeBrandsData from './data/homeBrandsData';
import homeClientsData from './data/homeClientsData';
import homePortfolioProjects from './data/homePortfolioData';
import latestProjectsData from './data/latestProjectsData';
import gsap from './lib/gsap-config';
// Firestore

// Importation des styles
import './styles/gallery.scss';
import './styles/home.scss';

// Interface pour les données d'expertise
interface Expertise {
    id?: string;
    title: string;
    description: string;
    backgroundImage: string;
    href: string;
    icon: string;
}

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
    // État pour stocker les expertises récupérées depuis Firestore
    const [expertises, setExpertises] = useState<Expertise[]>([]);

    // Fonction pour obtenir l'icône à partir du nom
    const getIconFromName = (icon: string): React.ReactNode => {
        // Vérifier si c'est un nom d'icône prédéfini
        switch (icon) {
            case 'video':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
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
                );
            case 'photo':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
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
                );
            case 'social':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
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
                );
            case 'branding':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="black"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                        />
                    </svg>
                );
            case 'web':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
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
                );
            default:
                // Si ce n'est pas un nom prédéfini, essayer de traiter comme du SVG brut
                try {
                    if (icon.includes("<svg")) {
                        // Vérifier si on est côté client (typeof window !== 'undefined')
                        if (typeof window !== 'undefined') {
                            // Créer un div temporaire pour parser le SVG
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = icon;
                            
                            // Obtenir l'élément SVG
                            const svgElement = tempDiv.querySelector('svg');
                            
                            if (svgElement) {
                                // Ajouter les classes nécessaires
                                svgElement.classList.add('h-5', 'w-5', 'md:h-7', 'md:w-7');
                                
                                // Retourner le HTML parsé du SVG
                                return <div dangerouslySetInnerHTML={{ __html: svgElement.outerHTML }} />;
                            }
                        }
                        
                        // Solution de secours pour le rendu côté serveur
                        return <div dangerouslySetInnerHTML={{ __html: icon }} className="h-5 w-5 md:h-7 md:w-7" />;
                    }
                    
                    // Fallback - retourner le texte comme composant si tout échoue
                    return <div className="h-5 w-5 md:h-7 md:w-7 text-black text-xs flex items-center justify-center">{icon.substring(0, 3)}</div>;
                } catch (error) {
                    console.error("Erreur de parsing SVG:", error);
                    return <div className="h-5 w-5 md:h-7 md:w-7 text-black text-xs flex items-center justify-center">SVG</div>;
                }
        }
    };

    // Effet pour récupérer les expertises depuis Firestore
    useEffect(() => {
        const fetchExpertises = async () => {
            try {
                const expertisesCollection = collection(db, 'expertises');
                const expertisesSnapshot = await getDocs(expertisesCollection);

                if (!expertisesSnapshot.empty) {
                    const fetchedExpertises = expertisesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Expertise[];
                    setExpertises(fetchedExpertises);
                } else {
                    console.log("Aucune expertise trouvée dans Firestore");
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des expertises:", error);
            }
        };

        fetchExpertises();
    }, []);

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
                        {expertises.map((expertise, index) => (
                            <div 
                                key={expertise.id || index}
                                ref={(el) => addServiceRef(el, index)} 
                                className={`w-[47%] sm:w-[22%] md:w-[22%] lg:w-[18%] min-w-[150px] ${!shouldStartAnimations ? 'opacity-0' : ''}`}
                            >
                                <ExpertiseCard
                                    title={expertise.title}
                                    description={expertise.description}
                                    backgroundImage={expertise.backgroundImage}
                                    icon={getIconFromName(expertise.icon)}
                                    href={expertise.href}
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
