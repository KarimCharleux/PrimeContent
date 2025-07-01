'use client';

import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import AnimatedStat from '../components/AnimatedStat';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { getMediaUrl } from '../utils/mediaUrl';

// Importation des styles
import './reseaux-sociaux.scss';

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

export default function ReseauxSociauxPage() {
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
                const contentCollection = collection(db, 'reseaux-sociaux-content');
                const contentSnapshot = await getDocs(contentCollection);
                if (!contentSnapshot.empty) {
                    const contentDoc = contentSnapshot.docs[0];
                    setContent(contentDoc.data() as ContentData);
                } else {
                    // Valeurs par défaut
                    setContent({
                        title: 'GESTION DES RÉSEAUX SOCIAUX',
                        description:
                            'Nous développons votre présence digitale avec des stratégies sur mesure, du contenu engageant et une gestion complète de vos réseaux sociaux.',
                        processImage:
                            '/home/projects/GROUP PHOTO - CELEBRITES - Â© bastian huber.jpg',
                        processImageAlt: 'Équipe en réunion stratégique',
                    });
                }

                // Récupérer les étapes du processus
                const processCollection = collection(db, 'reseaux-sociaux-process');
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
                            title: 'Découverte',
                            description:
                                'Nous nous rencontrons avec vous pour mieux connaître votre entreprise, vos objectifs et votre public cible.',
                            order: 1,
                        },
                        {
                            number: '02',
                            title: 'Stratégie',
                            description:
                                'Nous élaborons une stratégie marketing sur mesure, adaptée à vos besoins et objectifs uniques.',
                            order: 2,
                        },
                        {
                            number: '03',
                            title: 'Exécution',
                            description:
                                'Nous mettons en œuvre notre stratégie en utilisant les outils et techniques de marketing digital les plus modernes.',
                            order: 3,
                        },
                        {
                            number: '04',
                            title: 'Tracking & Suivi',
                            description:
                                'Nous suivons les résultats de nos campagnes afin de pouvoir apporter des ajustements si nécessaire.',
                            order: 4,
                        },
                    ]);
                }

                // Récupérer les chiffres clés
                const figuresCollection = collection(db, 'reseaux-sociaux-figures');
                const figuresSnapshot = await getDocs(figuresCollection);
                if (!figuresSnapshot.empty) {
                    const figuresData = figuresSnapshot.docs.map((doc) => doc.data() as KeyFigure);
                    figuresData.sort((a, b) => a.order - b.order);
                    setKeyFigures(figuresData);
                } else {
                    // Données par défaut
                    setKeyFigures([
                        {
                            value: 2,
                            suffix: 'M',
                            description: "Taux d'investissement",
                            isPercentage: false,
                            order: 1,
                        },
                        {
                            value: 150,
                            suffix: 'K',
                            description: 'Taux de connexion',
                            isPercentage: false,
                            order: 2,
                        },
                        {
                            value: 5,
                            suffix: 'M',
                            description: "Taux d'acquisition",
                            isPercentage: false,
                            order: 3,
                        },
                        {
                            value: 85,
                            suffix: '%',
                            description: "Taux d'engagement",
                            isPercentage: true,
                            order: 4,
                        },
                        {
                            value: 500,
                            suffix: 'K',
                            description: "Chiffre d'affaires",
                            isPercentage: false,
                            order: 5,
                        },
                    ]);
                }

                // Récupérer les réalisations
                const realisationsCollection = collection(db, 'reseaux-sociaux-realisations');
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
                            date: 'Nov 2024',
                            title: 'Flavor Fusion',
                            category: 'Fitness',
                            description:
                                'Nous avons développé une campagne axée sur le bien-être pour FlavorFit, combinant conseils fitness et solutions de repas sains à travers du contenu engageant sur les réseaux sociaux.',
                            image: '/home/projects/image1.jpg',
                            order: 1,
                        },
                        {
                            date: 'Jan 2024',
                            title: 'Taste the Tradition',
                            category: 'Products',
                            description:
                                "Pour NovoSoft, nous avons mis en valeur l'art derrière chaque produit avec du contenu en coulisses et des témoignages clients, en nous concentrant sur l'héritage et l'artisanat.",
                            image: '/home/projects/image2.jpg',
                            order: 2,
                        },
                        {
                            date: 'Mai 2024',
                            title: 'Fresh & Fabulous',
                            category: 'Products',
                            description:
                                'Nous avons créé une campagne audacieuse pour BuildUp, encourageant les utilisateurs à embrasser leurs caractéristiques à travers des visuels dynamiques.',
                            image: '/home/projects/image3.jpg',
                            order: 3,
                        },
                        {
                            date: 'Déc 2024',
                            title: 'Luma Food',
                            category: 'Food',
                            description:
                                'Pour cette marque alimentaire, nous avons conçu une campagne appétissante qui met en valeur leurs plats signature à travers des visuels vibrants et des recettes engageantes.',
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

        // Activer les animations après un délai
        const animationTimer = setTimeout(() => {
            setShouldStartAnimations(true);
        }, 100);

        return () => clearTimeout(animationTimer);
    }, []);

    if (loading) {
        return (
            <main className="global-main-page reseaux-sociaux-page">
                <Header />
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="global-main-page reseaux-sociaux-page">
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
                                <Image
                                    src={getMediaUrl(
                                        content?.processImage ||
                                            '/home/projects/GROUP PHOTO - CELEBRITES - Â© bastian huber.jpg',
                                    )}
                                    alt={
                                        content?.processImageAlt || 'Équipe en réunion stratégique'
                                    }
                                    width={400}
                                    height={300}
                                    className="rounded-lg"
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
                                        <Image
                                            src={getMediaUrl(realisation.image)}
                                            alt={realisation.title}
                                            width={200}
                                            height={150}
                                            className="rounded-lg"
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
