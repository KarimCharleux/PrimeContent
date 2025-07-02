'use client';

import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import { LegalMentions } from '../backoffice/models/legalTypes';
import Footer from '../components/Footer';
import Header from '../components/Header';

// Importation des styles
import './mentions-legales.scss';

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

// Structure vide pour initialisation
const emptyLegalMentions: LegalMentions = {
    nomEntreprise: '',
    formeJuridique: '',
    adresseSiegeSocial: '',
    responsablePublication: '',
    coordonneesContact: {
        email: '',
        telephone: '',
    },
    numeroSIRET: '',
    rcsRm: '',
    tvaIntracommunautaire: '',
    hebergeur: {
        nom: '',
        adresse: '',
        contact: '',
    },
    textIntroduction: '',
};

export default function MentionsLegalesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);
    const [legalMentions, setLegalMentions] = useState<LegalMentions>(emptyLegalMentions);

    useEffect(() => {
        // Récupérer les mentions légales depuis Firebase
        const fetchLegalMentions = async () => {
            try {
                setIsLoading(true);
                const legalDoc = await getDoc(doc(db, 'configuration', 'legal-mentions'));

                if (legalDoc.exists()) {
                    setLegalMentions(legalDoc.data() as LegalMentions);
                } else {
                    // Garder la structure vide si aucune donnée
                    setLegalMentions(emptyLegalMentions);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des mentions légales:', error);
                // En cas d'erreur, utiliser la structure vide
                setLegalMentions(emptyLegalMentions);
            } finally {
                // Simuler un délai minimum pour éviter un flash de chargement
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        };

        fetchLegalMentions();

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

    return (
        <main className="global-main-page">
            <Header />

            <section className="px-4 py-16 min-h-screen">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={
                            shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }
                        }
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        className="title-container"
                    >
                        <h1 className="page-title underline-title">MENTIONS LÉGALES</h1>
                    </motion.div>

                    {legalMentions.textIntroduction && (
                        <motion.p
                            initial={{ opacity: 0, y: -20 }}
                            animate={
                                shouldStartAnimations
                                    ? { opacity: 1, y: 0 }
                                    : { opacity: 0, y: -20 }
                            }
                            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                            className="description"
                        >
                            {legalMentions.textIntroduction}
                        </motion.p>
                    )}

                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate={shouldStartAnimations ? 'visible' : 'hidden'}
                            variants={fadeIn}
                            className="legal-content"
                        >
                            <div className="legal-sections">
                                {/* Identification de l'entreprise */}
                                <motion.section variants={fadeInUp} className="legal-section">
                                    <h2>1. Identification de l&apos;entreprise</h2>
                                    <div className="legal-item">
                                        <strong>Nom de l&apos;entreprise :</strong>{' '}
                                        {legalMentions.nomEntreprise}
                                    </div>
                                    <div className="legal-item">
                                        <strong>Forme juridique :</strong>{' '}
                                        {legalMentions.formeJuridique}
                                    </div>
                                    <div className="legal-item">
                                        <strong>Adresse du siège social :</strong>{' '}
                                        {legalMentions.adresseSiegeSocial}
                                    </div>
                                </motion.section>

                                {/* Responsable de la publication */}
                                <motion.section variants={fadeInUp} className="legal-section">
                                    <h2>2. Responsable de la publication</h2>
                                    <div className="legal-item">
                                        <strong>Nom :</strong>{' '}
                                        {legalMentions.responsablePublication}
                                    </div>
                                </motion.section>

                                {/* Coordonnées de contact */}
                                <motion.section variants={fadeInUp} className="legal-section">
                                    <h2>3. Coordonnées de contact</h2>
                                    <div className="legal-item">
                                        <strong>Email :</strong>
                                        <a
                                            href={`mailto:${legalMentions.coordonneesContact.email}`}
                                            className="legal-link"
                                        >
                                            {legalMentions.coordonneesContact.email}
                                        </a>
                                    </div>
                                    <div className="legal-item">
                                        <strong>Téléphone :</strong>
                                        <a
                                            href={`tel:${legalMentions.coordonneesContact.telephone.replace(/\s/g, '')}`}
                                            className="legal-link"
                                        >
                                            {legalMentions.coordonneesContact.telephone}
                                        </a>
                                    </div>
                                </motion.section>

                                {/* Informations légales */}
                                <motion.section variants={fadeInUp} className="legal-section">
                                    <h2>4. Informations légales</h2>
                                    <div className="legal-item">
                                        <strong>Numéro SIRET :</strong> {legalMentions.numeroSIRET}
                                    </div>
                                    <div className="legal-item">
                                        <strong>RCS / RM :</strong> {legalMentions.rcsRm}
                                    </div>
                                    {legalMentions.tvaIntracommunautaire && (
                                        <div className="legal-item">
                                            <strong>TVA intracommunautaire :</strong>{' '}
                                            {legalMentions.tvaIntracommunautaire}
                                        </div>
                                    )}
                                </motion.section>

                                {/* Hébergeur */}
                                <motion.section variants={fadeInUp} className="legal-section">
                                    <h2>5. Hébergeur du site</h2>
                                    <div className="legal-item">
                                        <strong>Nom :</strong> {legalMentions.hebergeur.nom}
                                    </div>
                                    <div className="legal-item">
                                        <strong>Adresse :</strong> {legalMentions.hebergeur.adresse}
                                    </div>
                                    <div className="legal-item">
                                        <strong>Contact :</strong>
                                        {legalMentions.hebergeur.contact.includes('@') ? (
                                            <a
                                                href={`mailto:${legalMentions.hebergeur.contact}`}
                                                className="legal-link"
                                            >
                                                {legalMentions.hebergeur.contact}
                                            </a>
                                        ) : (
                                            <a
                                                href={`tel:${legalMentions.hebergeur.contact.replace(/\s/g, '')}`}
                                                className="legal-link"
                                            >
                                                {legalMentions.hebergeur.contact}
                                            </a>
                                        )}
                                    </div>
                                </motion.section>

                                {/* Protection des données */}
                                <motion.section variants={fadeInUp} className="legal-section">
                                    <h2>6. Protection des données personnelles</h2>
                                    <div className="legal-item">
                                        <p>
                                            Conformément au Règlement Général sur la Protection des
                                            Données (RGPD) et à la loi « Informatique et Libertés »,
                                            vous disposez d&apos;un droit d&apos;accès, de
                                            rectification, de suppression et de portabilité de vos
                                            données personnelles.
                                        </p>
                                        <p>
                                            Pour exercer ces droits, vous pouvez nous contacter à
                                            l&apos;adresse :
                                            <a
                                                href={`mailto:${legalMentions.coordonneesContact.email}`}
                                                className="legal-link"
                                            >
                                                {legalMentions.coordonneesContact.email}
                                            </a>
                                        </p>
                                    </div>
                                </motion.section>

                                {/* Cookies */}
                                <motion.section variants={fadeInUp} className="legal-section">
                                    <h2>7. Cookies</h2>
                                    <div className="legal-item">
                                        <p>
                                            Ce site utilise Google Analytics pour analyser
                                            l&apos;audience et améliorer nos services. Ces outils
                                            déposent des cookies sur votre appareil. Vous pouvez
                                            désactiver ces cookies dans les paramètres de votre
                                            navigateur.
                                        </p>
                                    </div>
                                </motion.section>
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
