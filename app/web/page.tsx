'use client';

import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import AnimatedStat from '../components/AnimatedStat';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProtectedImage from '../components/ProtectedImage';
import { getMediaUrl } from '../utils/mediaUrl';

// Importation des styles
import './web.scss';

// Variants pour les animations
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3,
        },
    },
};

const staggerItem = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
};

// Interfaces
interface ContentData {
    title: string;
    description: string;
    processImage: string;
    processImageAlt: string;
}

interface ProcessStep {
    number: string;
    title: string;
    description: string;
    order: number;
}

interface KeyFigure {
    value: number;
    suffix: string;
    description: string;
    isPercentage: boolean;
    order: number;
}

interface Realisation {
    date: string;
    title: string;
    category: string;
    description: string;
    image: string;
    order: number;
}

export default function WebPage() {
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    const [content, setContent] = useState<ContentData | null>(null);
    const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
    const [keyFigures, setKeyFigures] = useState<KeyFigure[]>([]);
    const [realisations, setRealisations] = useState<Realisation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Récupérer toutes les données depuis Firebase
        const fetchData = async () => {
            try {
                // Récupérer le contenu principal
                const contentCollection = collection(db, 'web-content');
                const contentSnapshot = await getDocs(contentCollection);
                if (!contentSnapshot.empty) {
                    const contentDoc = contentSnapshot.docs[0];
                    setContent(contentDoc.data() as ContentData);
                } else {
                    // Valeurs par défaut
                    setContent({
                        title: 'CONCEPTION INTERFACES MOBILE/WEB',
                        description:
                            "Nous créons des interfaces utilisateur modernes et intuitives pour vos applications mobiles et web, en mettant l'accent sur l'expérience utilisateur et le design responsive.",
                        processImage:
                            '/home/projects/GROUP PHOTO - CELEBRITES - Â© bastian huber.jpg',
                        processImageAlt: 'Équipe travaillant sur des interfaces',
                    });
                }

                // Récupérer les étapes du processus
                const processCollection = collection(db, 'web-process');
                const processSnapshot = await getDocs(processCollection);
                if (!processSnapshot.empty) {
                    const processData = processSnapshot.docs.map(
                        (doc) => doc.data() as ProcessStep,
                    );
                    processData.sort((a, b) => a.order - b.order);
                    setProcessSteps(processData);
                } else {
                    // Données par défaut
                    setProcessSteps([
                        {
                            number: '01',
                            title: 'Découverte Et Planification',
                            description:
                                'Compréhension des besoins du client et identification des objectifs du projet.',
                            order: 1,
                        },
                        {
                            number: '02',
                            title: 'Conception Et Prototypage',
                            description:
                                "Création de maquettes et prototypes pour visualiser le design et l\'expérience utilisateur.",
                            order: 2,
                        },
                        {
                            number: '03',
                            title: 'Démos',
                            description:
                                'Effectuer des tests utilisateurs, recueillir des retours et affiner le design en fonction des résultats.',
                            order: 3,
                        },
                        {
                            number: '04',
                            title: 'Lancement & Suivi',
                            description:
                                'Lancer le produit, suivre ses performances et apporter des améliorations basées sur les retours des utilisateurs.',
                            order: 4,
                        },
                    ]);
                }

                // Récupérer les chiffres clés
                const figuresCollection = collection(db, 'web-figures');
                const figuresSnapshot = await getDocs(figuresCollection);
                if (!figuresSnapshot.empty) {
                    const figuresData = figuresSnapshot.docs.map((doc) => doc.data() as KeyFigure);
                    figuresData.sort((a, b) => a.order - b.order);
                    setKeyFigures(figuresData);
                } else {
                    // Données par défaut
                    setKeyFigures([
                        {
                            value: 0,
                            suffix: '',
                            description: 'Taux de Satisfaction Utilisateur',
                            isPercentage: false,
                            order: 1,
                        },
                        {
                            value: 0,
                            suffix: '',
                            description: 'Temps de Développement',
                            isPercentage: false,
                            order: 2,
                        },
                        {
                            value: 0,
                            suffix: '',
                            description: 'Taux de Rétention',
                            isPercentage: false,
                            order: 3,
                        },
                        {
                            value: 0,
                            suffix: '',
                            description: 'Taux de Conversion',
                            isPercentage: false,
                            order: 4,
                        },
                    ]);
                }

                // Récupérer les réalisations
                const realisationsCollection = collection(db, 'web-realisations');
                const realisationsSnapshot = await getDocs(realisationsCollection);
                if (!realisationsSnapshot.empty) {
                    const realisationsData = realisationsSnapshot.docs.map(
                        (doc) => doc.data() as Realisation,
                    );
                    realisationsData.sort((a, b) => a.order - b.order);
                    setRealisations(realisationsData);
                } else {
                    // Données par défaut
                    setRealisations([
                        {
                            date: 'Jan 2025',
                            title: 'Tableau de Bord Analytique pour une Start-up Technologique',
                            category: 'Finance',
                            description:
                                "Conception d\'un tableau de bord intuitif pour affiner des données en temps réel de sécurité avancé avec une interface dynamique.",
                            image: '/home/projects/image1.jpg',
                            order: 1,
                        },
                        {
                            date: 'Aug 2024',
                            title: 'Gestion de Projets pour Équipes à Distance',
                            category: 'Productivité',
                            description:
                                "Création d\'une plateforme collaborative pour gérer les projets à distance, optimisée pour une expérience utilisateur fluide et efficace.",
                            image: '/home/projects/image2.jpg',
                            order: 2,
                        },
                        {
                            date: 'Apr 2024',
                            title: 'Tableau de Bord pour Plateforme E-commerce',
                            category: 'E-commerce',
                            description:
                                "Développement d\'un tableau de bord pour suivre les performances des ventes en temps réel avec des graphiques interactifs et des alertes personnalisées.",
                            image: '/home/projects/image3.jpg',
                            order: 3,
                        },
                        {
                            date: 'Dec 2024',
                            title: 'Suivi Financier pour Particuliers',
                            category: 'Finance',
                            description:
                                "Conception d\'une interface pour suivre les finances personnelles, incluant des objectifs et priorités à budget avec des rapports visuels.",
                            image: '/home/projects/SIXTY STONES-4.jpg',
                            order: 4,
                        },
                    ]);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Vérifier si le SplashScreen est terminé ou si on vient d'une autre page
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

    if (loading) {
        return (
            <main className="global-main-page web-page">
                <Header />
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="global-main-page web-page">
            <Header />

            {/* Section Hero */}
            <section className="hero-section px-4 py-16">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={
                            shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }
                        }
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        className="title-container"
                    >
                        <h1 className="page-title underline-title">{content?.title}</h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: -20 }}
                        animate={
                            shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }
                        }
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
                        className="description"
                    >
                        {content?.description}
                    </motion.p>
                </div>
            </section>

            {/* Section Processus */}
            <section className="process-section px-4 py-16">
                <div className="container mx-auto">
                    <div className="process-content">
                        <motion.div
                            initial="hidden"
                            animate={shouldStartAnimations ? 'visible' : 'hidden'}
                            variants={fadeInUp}
                            className="process-left"
                        >
                            <h2 className="section-title">NOTRE PROCESS</h2>
                            <div className="process-image">
                                <ProtectedImage
                                    src={getMediaUrl(
                                        content?.processImage ||
                                            '/home/projects/GROUP PHOTO - CELEBRITES - Â© bastian huber.jpg',
                                    )}
                                    alt={
                                        content?.processImageAlt ||
                                        'Équipe travaillant sur des interfaces'
                                    }
                                    width={400}
                                    height={300}
                                    className="rounded-lg"
                                    watermarkPosition="bottom-right"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            animate={shouldStartAnimations ? 'visible' : 'hidden'}
                            variants={staggerContainer}
                            className="process-right"
                        >
                            {processSteps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    variants={staggerItem}
                                    className="process-step"
                                >
                                    <div className="step-number">{step.number}</div>
                                    <div className="step-content">
                                        <h3 className="step-title">{step.title}</h3>
                                        <p className="step-description">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Section Chiffres Clés */}
            <section className="stats-section px-4 py-16">
                <div className="container mx-auto">
                    <motion.div
                        initial="hidden"
                        animate={shouldStartAnimations ? 'visible' : 'hidden'}
                        variants={fadeInUp}
                        className="text-center mb-12"
                    >
                        <h2 className="section-title">QUELQUES CHIFFRES CLEFS</h2>
                    </motion.div>

                    <div className="stats-grid">
                        {keyFigures.map((stat, index) => (
                            <AnimatedStat
                                key={index}
                                value={stat.value}
                                suffix={stat.suffix}
                                description={stat.description}
                                isPercentage={stat.isPercentage}
                                delay={index * 0.2}
                                className="stat-item"
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Section Réalisations */}
            <section className="realisations-section px-4 py-16">
                <div className="container mx-auto">
                    <motion.div
                        initial="hidden"
                        animate={shouldStartAnimations ? 'visible' : 'hidden'}
                        variants={fadeInUp}
                        className="text-center mb-12"
                    >
                        <h2 className="section-title">NOS DERNIÈRES RÉALISATIONS</h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        animate={shouldStartAnimations ? 'visible' : 'hidden'}
                        variants={staggerContainer}
                        className="realisations-grid"
                    >
                        {realisations.map((realisation, index) => (
                            <motion.div
                                key={index}
                                variants={staggerItem}
                                className="realisation-card"
                            >
                                <div className="realisation-date">{realisation.date}</div>
                                <div className="realisation-content">
                                    <div className="realisation-image">
                                        <ProtectedImage
                                            src={getMediaUrl(realisation.image)}
                                            alt={realisation.title}
                                            width={200}
                                            height={150}
                                            className="rounded-lg"
                                            watermarkPosition="center"
                                        />
                                    </div>
                                    <div className="realisation-info">
                                        <h3 className="realisation-title">{realisation.title}</h3>
                                        <span className="realisation-category">
                                            {realisation.category}
                                        </span>
                                        <p className="realisation-description">
                                            {realisation.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
