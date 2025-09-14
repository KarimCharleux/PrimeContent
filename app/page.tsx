'use client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';

import { db } from './backoffice/lib/firebase-client';
import AboutUsSection from './components/AboutUsSection';
import AnimatedStat from './components/AnimatedStat';
import BrandLogo from './components/BrandLogo';
import ClientProfile from './components/ClientProfile';
import CustomerReviews from './components/CustomerReviews';
import ExpertiseCard from './components/ExpertiseCard';
import Footer from './components/Footer';
import Gallery from './components/Gallery';
import Header from './components/Header';
import PortfolioGrid from './components/PortfolioGrid/PortfolioGrid';
import PrimaryButton from './components/PrimaryButton';
import gsap from './lib/gsap-config';
// Firestore

// Importation des styles
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

// Interface pour les marques
interface Brand {
    id?: string;
    name: string;
    imageSrc: string;
    order?: number;
}

// Interface pour les clients
interface Client {
    id?: string;
    name: string;
    domain: string;
    imageSrc: string;
    imageBackground: string;
    order?: number;
}

// Interface pour les chiffres clés
interface KeyFigure {
    id?: string;
    value: number;
    prefix?: string;
    suffix?: string;
    description: string;
    isPercentage?: boolean;
    order: number;
}

// Interface pour les projets du portfolio
interface PortfolioProject {
    id?: string;
    title: string;
    category: string;
    source: string;
    isVideo?: boolean;
    format: 'portrait' | 'paysage';
    order: number;
    isLatest?: boolean;
    link?: string;
    thumbnail?: string;
}

// Interface pour les reviews
interface Review {
    id: string;
    name: string;
    role: string;
    company: string;
    text: string;
    imageSrc?: string;
    order: number;
}

export default function Page() {
    // Références pour les éléments à animer
    const heroTitleRef = useRef<HTMLHeadingElement>(null);

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

    // États pour stocker les données récupérées depuis Firestore
    const [expertises, setExpertises] = useState<Expertise[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [keyFigures, setKeyFigures] = useState<KeyFigure[]>([]);
    const [projects, setProjects] = useState<PortfolioProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Review[]>([]);

    // État pour gérer le switch entre marques et talents
    const [showBrands, setShowBrands] = useState(true);

    // Calculer la division des marques en deux groupes
    const halfBrandsCount = Math.ceil(brands.length / 2);
    const firstHalfBrands = brands.slice(0, halfBrandsCount);
    const secondHalfBrands = brands.slice(halfBrandsCount);

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
                    if (icon.includes('<svg')) {
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
                                return (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: svgElement.outerHTML }}
                                    />
                                );
                            }
                        }

                        // Solution de secours pour le rendu côté serveur
                        return (
                            <div
                                dangerouslySetInnerHTML={{ __html: icon }}
                                className="h-5 w-5 md:h-7 md:w-7"
                            />
                        );
                    }

                    // Fallback - retourner le texte comme composant si tout échoue
                    return (
                        <div className="h-5 w-5 md:h-7 md:w-7 text-black text-xs flex items-center justify-center">
                            {icon.substring(0, 3)}
                        </div>
                    );
                } catch (error) {
                    console.error('Erreur de parsing SVG:', error);
                    return (
                        <div className="h-5 w-5 md:h-7 md:w-7 text-black text-xs flex items-center justify-center">
                            SVG
                        </div>
                    );
                }
        }
    };

    // Effet pour récupérer les données depuis Firestore
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Récupérer les expertises
                const expertisesCollection = collection(db, 'expertises');
                const expertisesQuery = query(expertisesCollection, orderBy('order', 'asc'));
                const expertisesSnapshot = await getDocs(expertisesQuery);

                if (!expertisesSnapshot.empty) {
                    const fetchedExpertises = expertisesSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Expertise[];
                    setExpertises(fetchedExpertises);
                } else {
                    console.log('Aucune expertise trouvée dans Firestore');
                }

                // Récupérer les marques
                const brandsCollection = collection(db, 'brands');
                const brandsQuery = query(brandsCollection, orderBy('order', 'asc'));
                const brandsSnapshot = await getDocs(brandsQuery);

                if (!brandsSnapshot.empty) {
                    const fetchedBrands = brandsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Brand[];
                    setBrands(fetchedBrands);
                } else {
                    console.log('Aucune marque trouvée dans Firestore');
                    setBrands([]);
                }

                // Récupérer les clients
                const clientsCollection = collection(db, 'clients');
                const clientsQuery = query(clientsCollection, orderBy('order', 'asc'));
                const clientsSnapshot = await getDocs(clientsQuery);

                if (!clientsSnapshot.empty) {
                    const fetchedClients = clientsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Client[];
                    setClients(fetchedClients);
                } else {
                    console.log('Aucun client trouvé dans Firestore');
                    setClients([]);
                }

                // Récupérer les chiffres clés
                const keyFiguresCollection = collection(db, 'keyFigures');
                const keyFiguresSnapshot = await getDocs(keyFiguresCollection);

                if (!keyFiguresSnapshot.empty) {
                    const fetchedKeyFigures = keyFiguresSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as KeyFigure[];
                    // Trier par ordre
                    fetchedKeyFigures.sort((a, b) => a.order - b.order);
                    setKeyFigures(fetchedKeyFigures);
                } else {
                    console.log('Aucun chiffre clé trouvé dans Firestore');
                    setKeyFigures([]);
                }

                // Récupérer les projets
                const projectsCollection = collection(db, 'projects');
                const projectsQuery = query(projectsCollection, orderBy('order', 'asc'));
                const projectsSnapshot = await getDocs(projectsQuery);

                if (!projectsSnapshot.empty) {
                    const fetchedProjects = projectsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as PortfolioProject[];
                    setProjects(fetchedProjects);
                } else {
                    console.log('Aucun projet trouvé dans Firestore');
                    setProjects([]);
                }

                // Récupérer les reviews
                const reviewsCollection = collection(db, 'reviews');
                const reviewsQuery = query(reviewsCollection, orderBy('order', 'asc'));
                const reviewsSnapshot = await getDocs(reviewsQuery);

                if (!reviewsSnapshot.empty) {
                    const fetchedReviews = reviewsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Review[];
                    setReviews(fetchedReviews);
                } else {
                    console.log('Aucun témoignage trouvé dans Firestore');
                    setReviews([]);
                }

                setLoading(false);
            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        // Import des utilitaires de détection d'appareils
        const { getOptimizedLimits } = require('./utils/deviceDetection');

        const limits = getOptimizedLimits();

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
                // Vérification pour éviter les boucles sur iOS
                const hasVisited = sessionStorage.getItem('hasVisitedHome');
                if (!hasVisited) {
                    sessionStorage.setItem('hasVisitedHome', 'true');
                    setTimeout(() => {
                        setShouldStartAnimations(true);
                    }, 100);
                } else {
                    // Si déjà visité, activer immédiatement
                    setShouldStartAnimations(true);
                }
            }
        };

        // Vérifie immédiatement
        checkSplashScreen();

        // Utilisation des intervalles optimisés
        const interval = setInterval(checkSplashScreen, limits.checkInterval);

        // Timeout de sécurité optimisé
        const safetyTimeout = setTimeout(() => {
            setShouldStartAnimations(true);
            clearInterval(interval);
        }, limits.safetyTimeout);

        return () => {
            clearInterval(interval);
            clearTimeout(safetyTimeout);
        };
    }, []);

    useEffect(() => {
        if (!shouldStartAnimations) return;

        // Animation des mots du titre
        const words = gsap.utils.toArray<HTMLElement>('.hero-word');
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Réinitialise les états initiaux - assurons-nous qu'ils sont visibles si shouldStartAnimations est vrai
        if (words.length > 0) {
            words.forEach((word) => {
                gsap.set(word, {
                    yPercent: 100,
                    opacity: 0,
                    filter: 'blur(10px)',
                    visibility: 'visible',
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
                        visibility: 'visible',
                    },
                    index * 0.2,
                );
            });
        }

        // Animation des services au scroll
        if (serviceRefs.current.length > 0) {
            serviceRefs.current.forEach((service, index) => {
                if (service) {
                    gsap.set(service, {
                        y: 50,
                        opacity: 0,
                        scale: 0.9,
                    });

                    gsap.to(service, {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.8,
                        delay: index * 0.15,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: service,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        },
                    });
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
                        scale: 0.95,
                    });

                    gsap.to(client, {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.7,
                        delay: 0.05 + (index % 6) * 0.1, // Grouper les animations par lignes de 6 max
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: client,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        },
                    });
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

                    gsap.to(brand, {
                        scale: 1,
                        opacity: 1,
                        duration: 0.5,
                        delay: 0.1 + index * 0.1,
                        ease: 'back.out(1.5)',
                        scrollTrigger: {
                            trigger: brand,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        },
                    });
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

                    gsap.to(brand, {
                        scale: 1,
                        opacity: 1,
                        duration: 0.5,
                        delay: 0.1 + index * 0.08,
                        ease: 'back.out(1.5)',
                        scrollTrigger: {
                            trigger: brand,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        },
                    });
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
                        <span
                            className="hero-word"
                            style={{ display: 'inline-block', transform: 'translateY(0px)' }}
                        >
                            OÙ
                        </span>{' '}
                        <span
                            className="hero-word"
                            style={{ display: 'inline-block', transform: 'translateY(0px)' }}
                        >
                            LA
                        </span>{' '}
                        <span
                            className="hero-word"
                            style={{ display: 'inline-block', transform: 'translateY(0px)' }}
                        >
                            CRÉATIVITÉ
                        </span>{' '}
                        <span
                            className="hero-word"
                            style={{ display: 'inline-block', transform: 'translateY(0px)' }}
                        >
                            RENCONTRE
                        </span>{' '}
                        <span
                            className="hero-word"
                            style={{ display: 'inline-block', transform: 'translateY(0px)' }}
                        >
                            LA
                        </span>{' '}
                        <span
                            className="hero-word"
                            style={{ display: 'inline-block', transform: 'translateY(0px)' }}
                        >
                            STRATÉGIE
                        </span>
                    </h1>
                    <PrimaryButton
                        text="Contactez-nous"
                        onClick={() => {
                            const contactSection = document.getElementById('contact');
                            if (contactSection) {
                                contactSection.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start',
                                });
                            }
                        }}
                        animateOnMount={true}
                        delay={1.2} // Délai augmenté pour s'assurer que le bouton apparaît après les autres éléments
                    />
                </div>
            </section>

            {/* Section Expertises */}
            <section className="py-12 md:py-16 bg-gradient-to-b from-[#010305] to-gray-900 expertise-section">
                <div className="mx-auto px-4">
                    <div className="text-center mb-8 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            NOS EXPERTISES
                        </h2>
                    </div>

                    <div
                        ref={servicesRef}
                        className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-6 mx-auto"
                    >
                        {expertises.map((expertise, index) => (
                            <div
                                key={expertise.id || index}
                                ref={(el) => addServiceRef(el, index)}
                                className={`aspect-square w-[30%] md:w-[25%] lg:w-[18%] ${!shouldStartAnimations ? 'opacity-0' : ''}`}
                            >
                                <ExpertiseCard
                                    title={expertise.title}
                                    description={expertise.description}
                                    backgroundImage={expertise.backgroundImage}
                                    icon={getIconFromName(expertise.icon)}
                                    href={expertise.href}
                                    className="expertise-card h-full"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {keyFigures.length > 0 && (
                <>
                    {/* Section PRIMECONTENT EN CHIFFRES */}
                    <section className="py-16 max-sm:py-8 bg-gradient-to-b from-gray-900 to-black stats-section">
                        <div className="mx-auto px-4">
                            <div className="text-center mb-16 max-sm:mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                                    NOS CHIFFRES
                                </h2>
                            </div>

                            {loading ? (
                                <div className="flex justify-center items-center py-16">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-8">
                                    {/* Affichage desktop - ligne unique */}
                                    <div className="hidden md:flex flex-row flex-wrap justify-center gap-8 stats-grid">
                                        {keyFigures.map((figure, index) => (
                                            <AnimatedStat
                                                key={figure.id || index}
                                                value={figure.value}
                                                description={figure.description}
                                                prefix={figure.prefix}
                                                suffix={figure.suffix}
                                                isPercentage={figure.isPercentage}
                                                delay={index * 0.2}
                                            />
                                        ))}
                                    </div>

                                    {/* Affichage mobile - 2 lignes */}
                                    <div className="md:hidden flex flex-col gap-6 w-full max-sm:gap-0">
                                        {/* Première ligne - 3 chiffres */}
                                        <div className="grid grid-cols-3 gap-4">
                                            {keyFigures.slice(0, 3).map((figure, index) => (
                                                <AnimatedStat
                                                    key={figure.id || index}
                                                    value={figure.value}
                                                    description={figure.description}
                                                    prefix={figure.prefix}
                                                    suffix={figure.suffix}
                                                    isPercentage={figure.isPercentage}
                                                    delay={index * 0.2}
                                                    className="text-center"
                                                />
                                            ))}
                                        </div>

                                        {/* Deuxième ligne - 2 chiffres centrés */}
                                        {keyFigures.length > 3 && (
                                            <div className="flex justify-center gap-8">
                                                {keyFigures.slice(3, 5).map((figure, index) => (
                                                    <div
                                                        key={figure.id || index + 3}
                                                        className="flex-1 max-w-[40%]"
                                                    >
                                                        <AnimatedStat
                                                            value={figure.value}
                                                            description={figure.description}
                                                            prefix={figure.prefix}
                                                            suffix={figure.suffix}
                                                            isPercentage={figure.isPercentage}
                                                            delay={(index + 3) * 0.2}
                                                            className="text-center"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}

            {/* Section Ils nous ont fait confiance */}
            <section className="py-16 bg-gradient-to-b from-black to-gray-900 trust-section">
                <div className="mx-auto px-7">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            ILS NOUS ONT FAIT CONFIANCE
                        </h2>

                        {/* Switch entre Marques et Talents */}
                        <div className="client-toggle">
                            <div className="toggle-container">
                                <button
                                    className={`toggle-btn ${showBrands ? 'active' : ''}`}
                                    onClick={() => setShowBrands(true)}
                                >
                                    Marques
                                </button>
                                <button
                                    className={`toggle-btn ${!showBrands ? 'active' : ''}`}
                                    onClick={() => setShowBrands(false)}
                                >
                                    Talents
                                </button>
                                <div
                                    className={`toggle-slider ${!showBrands ? 'right' : 'left'}`}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <>
                            {/* Affichage des marques */}
                            {showBrands ? (
                                <div className="w-full">
                                    {/* Logos des marques avec grille optimisée */}
                                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6 w-full max-w-6xl mx-auto">
                                        {brands.map((brand, index) => (
                                            <div
                                                key={brand.id || brand.name}
                                                className={`aspect-square ${!shouldStartAnimations ? 'opacity-0' : ''}`}
                                                ref={(el) => addBrandRef(el, index)}
                                            >
                                                <BrandLogo
                                                    name={brand.name}
                                                    imageSrc={brand.imageSrc}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Affichage des talents (clients) */
                                <div className="w-full">
                                    {/* Profils des talents au centre sur desktop */}
                                    <div className="hidden 2xl:flex flex-col items-center w-full 2xl:max-w-6xl mx-auto">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full mb-4 md:mb-6">
                                            {clients.slice(0, 4).map((client, index) => (
                                                <div
                                                    key={client.id || `${client.name}-${index}`}
                                                    ref={(el) => addClientRef(el, index)}
                                                    className={`h-[250px] md:h-[300px] ${!shouldStartAnimations ? 'opacity-0' : ''}`}
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
                                        <div className="grid grid-cols-4 gap-4 md:gap-6">
                                            {clients.slice(4).map((client, index) => (
                                                <div
                                                    key={client.id || `${client.name}-${index + 4}`}
                                                    ref={(el) => addClientRef(el, index + 4)}
                                                    className={`h-[250px] md:h-[300px] ${!shouldStartAnimations ? 'opacity-0' : ''}`}
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

                                    {/* Profils des talents au centre sur mobile */}
                                    <div className="flex flex-wrap justify-center gap-4 2xl:hidden max-sm:grid max-sm:grid-cols-4 max-sm:gap-4">
                                        {clients.map((client, index) => (
                                            <div
                                                key={client.id || `${client.name}-${index}`}
                                                className={`h-[180px] md:h-[300px] max-sm:h-auto max-sm:w-full ${!shouldStartAnimations ? 'opacity-0' : ''}`}
                                                ref={(el) =>
                                                    addClientRef(el, index + clients.length)
                                                }
                                            >
                                                <ClientProfile
                                                    name={client.name}
                                                    domain={client.domain}
                                                    imageSrc={client.imageSrc}
                                                    imageBackground={client.imageBackground}
                                                    className="h-full max-sm:h-auto"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="mt-16 mx-auto w-fit">
                        <PrimaryButton
                            text="Explorez plus"
                            href="/clients"
                            animateOnMount={true}
                            delay={0.5}
                        />
                    </div>
                </div>
            </section>

            {/* Section NOS DERNIÈRES RÉALISATIONS */}
            <section className="py-16 bg-gradient-to-b from-black to-gray-900 latest-projects-section">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            NOS DERNIÈRES RÉALISATIONS
                        </h2>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <PortfolioGrid
                            projects={projects.filter((p) => p.isLatest)}
                            showFilter={false}
                        />
                    )}
                </div>
            </section>

            {/* Section NOS RÉALISATIONS */}
            <section className="py-16 max-sm:py-8 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16 max-sm:mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            NOS RÉALISATIONS
                        </h2>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <>
                            <PortfolioGrid
                                projects={projects.filter((p) => !p.isLatest)}
                                showFilter={true}
                                showGradientOverlay={true}
                            />
                            <div className="mt-16 mx-auto w-fit">
                                <PrimaryButton
                                    text="Explorer plus"
                                    href="/realisations"
                                    animateOnMount={true}
                                    delay={0.5}
                                />
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Section CE QUE NOS CLIENTS DISENT DE NOUS */}
            {reviews.length > 0 && (
                <section className="py-16 bg-gradient-to-b from-black via-gray-900 to-black reviews-section">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            MERCI POUR VOS RETOURS
                        </h2>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <CustomerReviews reviews={reviews} autoplaySpeed={13000} />
                    )}
                </section>
            )}

            {/* Section À PROPOS DE NOUS */}
            <AboutUsSection />

            <Footer />
        </main>
    );
}
