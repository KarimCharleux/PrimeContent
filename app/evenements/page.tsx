'use client';

import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import { Evenement } from '../backoffice/models/eventTypes';
import EventCard from '../components/EventCard/EventCard';
import Footer from '../components/Footer';
import Header from '../components/Header';

// Importation des styles
import './evenements.scss';

// Variants pour les animations
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.3,
        },
    },
};

export default function EvenementsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [evenements, setEvenements] = useState<Evenement[]>([]);
    // État pour contrôler le démarrage des animations
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvenements = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Créer une requête pour récupérer uniquement les événements visibles
                const eventsCollection = collection(db, 'evenements');

                // Solution temporaire: ne filtrer que par date sans where, puis filtrer côté client
                // Cela fonctionne jusqu'à ce que l'index soit créé
                const eventsQuery = query(
                    eventsCollection,
                    where('visible', '==', true),
                    orderBy('date', 'desc'),
                );

                const eventsSnapshot = await getDocs(eventsQuery);

                if (!eventsSnapshot.empty) {
                    const allEvents = eventsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Evenement[];

                    // Filtrer les événements visibles côté client
                    const fetchedEvents = allEvents.filter((event) => event.visible === true);

                    setEvenements(fetchedEvents);
                } else {
                    setEvenements([]);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des événements:', error);
                setError('Impossible de charger les événements. Veuillez réessayer plus tard.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvenements();

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

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';

        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        } catch (error) {
            return dateString;
        }
    };

    return (
        <main className="global-main-page">
            <Header />

            <section className="px-4 py-12 min-h-screen">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={
                            shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }
                        }
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        className="title-container relative overflow-hidden"
                    >
                        <motion.h1
                            className="page-title underline-title"
                            initial={{ opacity: 0 }}
                            animate={shouldStartAnimations ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            ÉVÉNEMENTS
                        </motion.h1>
                    </motion.div>

                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500">{error}</p>
                        </div>
                    ) : evenements.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">
                                Aucun événement disponible pour le moment.
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            className="evenements-grid"
                            initial="hidden"
                            animate={shouldStartAnimations ? 'visible' : 'hidden'}
                            variants={staggerContainer}
                        >
                            {evenements.map((evenement, index) => (
                                <EventCard
                                    key={evenement.id}
                                    href={`/evenements/${evenement.id}`}
                                    imageSrc={evenement.imageSrc}
                                    title={evenement.titre}
                                    date={formatDate(evenement.date)}
                                    location={evenement.lieu}
                                    category={evenement.categorie}
                                    index={index}
                                />
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer hideCTA={false} />
        </main>
    );
}
