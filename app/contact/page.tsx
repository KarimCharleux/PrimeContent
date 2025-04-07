'use client';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import { ContactInfo } from '../backoffice/models/contactTypes';
import Footer from '../components/Footer';
import Header from '../components/Header';
import './contact.scss';

// Variants pour les animations
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            delay: custom * 0.1,
            ease: [0.25, 0.1, 0.25, 1],
        },
    }),
};

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

export default function ContactPage() {
    // État pour contrôler le démarrage des animations
    const [shouldStartAnimations, setShouldStartAnimations] = useState(false);

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        message: '',
    });

    const [formStatus, setFormStatus] = useState<{
        isSubmitting: boolean;
        isSuccess: boolean;
        isError: boolean;
        message: string;
    }>({
        isSubmitting: false,
        isSuccess: false,
        isError: false,
        message: '',
    });

    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

    // Vérifier si le SplashScreen est terminé ou si on vient d'une autre page
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

    // Récupérer les informations de contact depuis Firestore
    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                const contactInfoDoc = await getDoc(doc(db, 'configuration', 'contact'));

                if (contactInfoDoc.exists()) {
                    setContactInfo(contactInfoDoc.data() as ContactInfo);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des informations de contact:', error);
            }
        };

        fetchContactInfo();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation basique
        if (!formData.nom || !formData.prenom || !formData.email || !formData.message) {
            setFormStatus({
                isSubmitting: false,
                isSuccess: false,
                isError: true,
                message: 'Veuillez remplir tous les champs obligatoires.',
            });
            return;
        }

        try {
            setFormStatus({
                isSubmitting: true,
                isSuccess: false,
                isError: false,
                message: 'Envoi en cours...',
            });

            // Ajout du message à la collection "contacts" dans Firestore
            await addDoc(collection(db, 'contacts'), {
                ...formData,
                status: 'nouveau',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });

            // Réinitialiser le formulaire après soumission
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                message: '',
            });

            setFormStatus({
                isSubmitting: false,
                isSuccess: true,
                isError: false,
                message: 'Votre message a été envoyé avec succès. Nous vous contacterons bientôt.',
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
            setFormStatus({
                isSubmitting: false,
                isSuccess: false,
                isError: true,
                message: "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer.",
            });
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
                            CONTACT
                        </motion.h1>
                    </motion.div>

                    <div className="contact-content">
                        {/* Colonne gauche - Informations de contact */}
                        <motion.div
                            className="contact-info-column"
                            initial="hidden"
                            animate={shouldStartAnimations ? 'visible' : 'hidden'}
                            variants={staggerContainer}
                        >
                            <motion.h2 className="info-title" variants={fadeInUp} custom={0}>
                                Contact Information
                            </motion.h2>

                            <motion.p className="info-subtitle" variants={fadeInUp} custom={1}>
                                Un événement en tête? Contactez-nous!
                            </motion.p>

                            <motion.div className="contact-details" variants={staggerContainer}>
                                <motion.div
                                    className="contact-item"
                                    variants={fadeInUp}
                                    custom={2}
                                    whileHover={{ scale: 1.05, x: 5 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="icon-container">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="contact-icon"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <a
                                        href={`tel:${contactInfo?.telephone || '+33 6 49 09 57 95'}`}
                                        className="contact-link"
                                    >
                                        {contactInfo?.telephone || '+33 6 49 09 57 95'}
                                    </a>
                                </motion.div>

                                <motion.div
                                    className="contact-item"
                                    variants={fadeInUp}
                                    custom={3}
                                    whileHover={{ scale: 1.05, x: 5 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="icon-container">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="contact-icon"
                                        >
                                            <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                                            <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                                        </svg>
                                    </div>
                                    <a
                                        href={`mailto:${contactInfo?.email || 'contact@primecontent.fr'}`}
                                        className="contact-link"
                                    >
                                        {contactInfo?.email || 'contact@primecontent.fr'}
                                    </a>
                                </motion.div>

                                <motion.div
                                    className="contact-item"
                                    variants={fadeInUp}
                                    custom={4}
                                    whileHover={{ scale: 1.05, x: 5 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="icon-container">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="contact-icon"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <a
                                        href="https://maps.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="contact-link"
                                    >
                                        {contactInfo?.adresse || 'Paris, France'}
                                    </a>
                                </motion.div>

                                {/* Réseaux sociaux */}
                                {contactInfo?.reseauxSociaux &&
                                    Object.entries(contactInfo.reseauxSociaux).map(
                                        ([reseau, url]) => {
                                            if (!url) return null;

                                            return (
                                                <motion.div
                                                    key={reseau}
                                                    className="contact-item"
                                                    variants={fadeInUp}
                                                    custom={5}
                                                    whileHover={{ scale: 1.05, x: 5 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="icon-container">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            className="contact-icon"
                                                        >
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 7h-2v-4h-2v-2h4v6z" />
                                                        </svg>
                                                    </div>
                                                    <a
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="contact-link"
                                                    >
                                                        {reseau.charAt(0).toUpperCase() +
                                                            reseau.slice(1)}
                                                    </a>
                                                </motion.div>
                                            );
                                        },
                                    )}
                            </motion.div>

                            {contactInfo?.calendlyUrl && (
                                <motion.div
                                    className="calendly-section"
                                    variants={fadeInUp}
                                    custom={6}
                                    initial="hidden"
                                    animate={shouldStartAnimations ? 'visible' : 'hidden'}
                                    whileHover={{ scale: 1.03 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <a
                                        href={contactInfo.calendlyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="calendly-button"
                                    >
                                        <span className="calendly-icon">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 525.8 535.73"
                                                width="24"
                                                height="24"
                                            >
                                                <defs></defs>
                                                <g id="Layer_2" data-name="Layer 2">
                                                    <g id="Logo_assets" data-name="Logo assets">
                                                        <g id="Brand_mark" data-name="Brand mark">
                                                            <path
                                                                fill="none"
                                                                d="M443.74,337.62l-27.16,47.05a139.52,139.52,0,0,1-120.82,69.75H241.43a139.52,139.52,0,0,1-120.82-69.75L93.45,337.62a139.52,139.52,0,0,1,0-139.51l27.16-47.05A139.53,139.53,0,0,1,241.43,81.3h54.33a139.53,139.53,0,0,1,120.82,69.76l27.16,47.05a139.23,139.23,0,0,1,8.55,17.55c0,.12.09.23.13.35a102.15,102.15,0,0,0,44.33-18.24c0-.14-.08-.28-.13-.43a237.8,237.8,0,0,0-33.29-67.58,240.67,240.67,0,0,0-52-53.48A239.3,239.3,0,0,0,98.65,437.08a239.43,239.43,0,0,0,398-98.69c.05-.15.09-.29.13-.43a102.15,102.15,0,0,0-44.33-18.24c0,.12-.09.23-.13.35A139.23,139.23,0,0,1,443.74,337.62Z"
                                                            ></path>
                                                        </g>
                                                    </g>
                                                </g>
                                            </svg>
                                        </span>
                                        Prendre rendez-vous
                                    </a>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Colonne droite - Formulaire de contact */}
                        <motion.div
                            className="contact-form-column"
                            initial="hidden"
                            animate={shouldStartAnimations ? 'visible' : 'hidden'}
                            variants={staggerContainer}
                        >
                            <motion.h2 variants={fadeInUp} custom={0} className="form-title">
                                {contactInfo?.texteBienvenue || 'Envoyez-nous un message'}
                            </motion.h2>

                            {contactInfo?.texteFormulaire && (
                                <motion.p className="form-subtitle" variants={fadeInUp} custom={1}>
                                    {contactInfo.texteFormulaire}
                                </motion.p>
                            )}

                            {formStatus.isSuccess && (
                                <motion.div
                                    className="p-6 bg-green-50 rounded-lg border border-green-200 text-center mb-6"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex justify-center mb-4">
                                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg
                                                className="h-8 w-8 text-green-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-medium text-green-800 mb-2">
                                        Message envoyé avec succès !
                                    </h3>
                                    <p className="text-green-700">{formStatus.message}</p>
                                </motion.div>
                            )}

                            {formStatus.isError && (
                                <motion.div
                                    className="p-4 bg-red-50 border border-red-200 rounded-md mb-6"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-red-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-800">
                                                {formStatus.message}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <motion.form
                                onSubmit={handleSubmit}
                                variants={fadeInUp}
                                custom={2}
                                className="contact-form"
                            >
                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="prenom"
                                            name="prenom"
                                            placeholder="Prénom *"
                                            value={formData.prenom}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="nom"
                                            name="nom"
                                            placeholder="Nom *"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Email *"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="tel"
                                            id="telephone"
                                            name="telephone"
                                            placeholder="Téléphone"
                                            value={formData.telephone}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        placeholder="Message *"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={formStatus.isSubmitting}
                                >
                                    {formStatus.isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                                </button>
                            </motion.form>

                            {/* Effet de brillance de fond */}
                            <motion.div
                                className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl z-0"
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.2, 0.5, 0.2],
                                }}
                                transition={{
                                    duration: 10,
                                    repeat: Infinity,
                                    repeatType: 'reverse',
                                }}
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer hideCTA={true} />
        </main>
    );
}
