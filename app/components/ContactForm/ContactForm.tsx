'use client';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { db } from '../../backoffice/lib/firebase-client';
import { ContactInfo } from '../../backoffice/models/contactTypes';

import './ContactForm.scss';

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

export default function ContactForm() {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        message: '',
    });

    const [formErrors, setFormErrors] = useState<{
        nom?: string;
        prenom?: string;
        email?: string;
        telephone?: string;
        message?: string;
    }>({});

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

    // Fonctions de validation
    const validateField = (name: string, value: string): string | undefined => {
        switch (name) {
            case 'nom':
            case 'prenom':
                if (!value.trim()) {
                    return `Le ${name} est requis`;
                }
                if (value.trim().length < 2) {
                    return `Le ${name} doit contenir au moins 2 caractères`;
                }
                break;

            case 'email':
                if (!value.trim()) {
                    return "L'email est requis";
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return 'Veuillez entrer un email valide';
                }
                break;

            case 'telephone':
                if (value.trim()) {
                    const numbersOnly = value.replace(/\D/g, '');
                    if (numbersOnly.length !== 10) {
                        return 'Le numéro doit contenir 10 chiffres';
                    }
                    if (!numbersOnly.startsWith('0')) {
                        return 'Le numéro doit commencer par 0';
                    }
                }
                break;

            case 'message':
                if (!value.trim()) {
                    return 'Le message est requis';
                }
                if (value.trim().length < 10) {
                    return 'Le message doit contenir au moins 10 caractères';
                }
                break;
        }
        return undefined;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let formattedValue = value;

        // Formatage spécial pour le téléphone
        if (name === 'telephone') {
            // Supprimer tous les caractères non numériques
            const numbersOnly = value.replace(/\D/g, '');

            // Limiter à 10 chiffres maximum
            const limitedNumbers = numbersOnly.substring(0, 10);

            // Formatter avec des espaces toutes les 2 positions
            formattedValue = limitedNumbers.replace(/(\d{2})(?=\d)/g, '$1 ');
        }

        setFormData((prev) => ({
            ...prev,
            [name]: formattedValue,
        }));

        // Validation en temps réel (seulement si le champ a déjà été touché)
        if (formErrors[name as keyof typeof formErrors]) {
            const error = validateField(name, formattedValue);
            setFormErrors((prev) => ({
                ...prev,
                [name]: error,
            }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setFormErrors((prev) => ({
            ...prev,
            [name]: error,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation complète de tous les champs
        const errors: typeof formErrors = {};
        Object.keys(formData).forEach((key) => {
            const error = validateField(key, formData[key as keyof typeof formData]);
            if (error) {
                errors[key as keyof typeof formErrors] = error;
            }
        });

        // Vérifier les champs obligatoires
        if (!formData.nom.trim()) errors.nom = 'Le nom est requis';
        if (!formData.prenom.trim()) errors.prenom = 'Le prénom est requis';
        if (!formData.email.trim()) errors.email = "L'email est requis";
        if (!formData.message.trim()) errors.message = 'Le message est requis';

        setFormErrors(errors);

        // Si il y a des erreurs, arrêter la soumission
        if (Object.keys(errors).length > 0) {
            setFormStatus({
                isSubmitting: false,
                isSuccess: false,
                isError: true,
                message: 'Veuillez corriger les erreurs dans le formulaire.',
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

            // Réinitialiser les erreurs
            setFormErrors({});

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
        <section id="contact" className="contact-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="title-container relative overflow-hidden"
                >
                    <motion.h2
                        className="page-title underline-title"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        CONTACTEZ-NOUS
                    </motion.h2>
                </motion.div>

                <div className="contact-content">
                    {/* Colonne gauche - Informations de contact */}
                    <motion.div
                        className="contact-info-column"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.h3 className="info-title" variants={fadeInUp} custom={0}>
                            Nos coordonnées
                        </motion.h3>

                        <motion.p className="info-subtitle" variants={fadeInUp} custom={1}>
                            Parlons de votre projet !
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
                        </motion.div>

                        {contactInfo?.calendlyUrl && (
                            <motion.div
                                className="calendly-section"
                                variants={fadeInUp}
                                custom={6}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
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
                                                            fill="white"
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
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.h3 variants={fadeInUp} custom={0} className="form-title">
                            {contactInfo?.texteBienvenue || 'Votre message'}
                        </motion.h3>

                        <motion.p className="form-subtitle" variants={fadeInUp} custom={1}>
                            {contactInfo?.texteFormulaire ||
                                'Remplissez le formulaire ci-dessous et nous vous recontacterons rapidement.'}
                        </motion.p>

                        {formStatus.isSuccess && (
                            <motion.div
                                className="success-message"
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
                                <h4 className="text-xl font-medium text-green-800 mb-2">
                                    Message envoyé avec succès !
                                </h4>
                                <p className="text-green-700">{formStatus.message}</p>
                            </motion.div>
                        )}

                        {formStatus.isError && (
                            <motion.div
                                className="error-message"
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
                                        <p className="text-sm text-red-800">{formStatus.message}</p>
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
                                    <div
                                        className={`input-container ${formErrors.prenom ? 'error' : ''}`}
                                    >
                                        <svg
                                            className="input-icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        <input
                                            type="text"
                                            id="prenom"
                                            name="prenom"
                                            placeholder="Prénom *"
                                            value={formData.prenom}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`form-input ${formErrors.prenom ? 'error' : ''}`}
                                            required
                                        />
                                    </div>
                                    {formErrors.prenom && (
                                        <div className="field-error">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            {formErrors.prenom}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <div
                                        className={`input-container ${formErrors.nom ? 'error' : ''}`}
                                    >
                                        <svg
                                            className="input-icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        <input
                                            type="text"
                                            id="nom"
                                            name="nom"
                                            placeholder="Nom *"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`form-input ${formErrors.nom ? 'error' : ''}`}
                                            required
                                        />
                                    </div>
                                    {formErrors.nom && (
                                        <div className="field-error">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            {formErrors.nom}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <div
                                        className={`input-container ${formErrors.email ? 'error' : ''}`}
                                    >
                                        <svg
                                            className="input-icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Email *"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`form-input ${formErrors.email ? 'error' : ''}`}
                                            required
                                        />
                                    </div>
                                    {formErrors.email && (
                                        <div className="field-error">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            {formErrors.email}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <div
                                        className={`input-container ${formErrors.telephone ? 'error' : ''}`}
                                    >
                                        <svg
                                            className="input-icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                            />
                                        </svg>
                                        <input
                                            type="tel"
                                            id="telephone"
                                            name="telephone"
                                            placeholder="Téléphone"
                                            value={formData.telephone}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`form-input ${formErrors.telephone ? 'error' : ''}`}
                                        />
                                    </div>
                                    {formErrors.telephone && (
                                        <div className="field-error">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            {formErrors.telephone}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <div
                                    className={`input-container ${formErrors.message ? 'error' : ''}`}
                                >
                                    <svg
                                        className="input-icon textarea-icon"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        placeholder="Message *"
                                        value={formData.message}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`form-textarea ${formErrors.message ? 'error' : ''}`}
                                        required
                                    />
                                </div>
                                {formErrors.message && (
                                    <div className="field-error">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {formErrors.message}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={formStatus.isSubmitting}
                            >
                                {formStatus.isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                                <svg
                                    className="arrow-icon ml-2 w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    />
                                </svg>
                            </button>
                        </motion.form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
