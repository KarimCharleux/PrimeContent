'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/contact/contact.scss';

// Variants pour les animations
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
        opacity: 1,
        y: 0,
        transition: { 
            duration: 0.6, 
            delay: custom * 0.1,
            ease: [0.25, 0.1, 0.25, 1]
        }
    })
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.3
        }
    }
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
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logique d'envoi du formulaire à implémenter
        console.log('Formulaire soumis:', formData);
        // Réinitialiser le formulaire après soumission
        setFormData({
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            message: '',
        });
    };

    return (
        <main className="flex flex-col min-h-screen bg-black text-white w-screen">
            <Header />

            <section className="px-4 py-12">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={shouldStartAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
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
                            animate={shouldStartAnimations ? "visible" : "hidden"}
                            variants={staggerContainer}
                        >
                            <motion.h2 
                                className="info-title"
                                variants={fadeInUp}
                                custom={0}
                            >
                                Contact Information
                            </motion.h2>
                            
                            <motion.p 
                                className="info-subtitle"
                                variants={fadeInUp} 
                                custom={1}
                            >
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
                                    <a href="tel:+9779876543210" className="contact-link">
                                        +977-9876543210
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
                                    <a href="mailto:contact@mk.com" className="contact-link">
                                        contact@mk.com
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
                                        Paris, France
                                    </a>
                                </motion.div>
                            </motion.div>

                            <motion.div 
                                className="calendly-section"
                                variants={fadeInUp}
                                custom={6}
                                initial="hidden"
                                animate={shouldStartAnimations ? "visible" : "hidden"}
                                whileHover={{ scale: 1.03 }}
                                transition={{ duration: 0.3 }}
                            >
                                <a
                                    href="https://calendly.com"
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
                                                        <path
                                                            fill="#006bff"
                                                            d="M360.4,347.4c-17,15.09-38.21,33.87-76.78,33.87h-23c-27.88,0-53.23-10.12-71.37-28.49-17.72-17.94-27.48-42.5-27.48-69.16V252.11c0-26.66,9.76-51.22,27.48-69.16,18.14-18.37,43.49-28.49,71.37-28.49h23c38.57,0,59.76,18.78,76.78,33.87,17.65,15.65,32.9,29.16,73.52,29.16a116.05,116.05,0,0,0,18.5-1.48c0-.12-.08-.23-.13-.35a139.23,139.23,0,0,0-8.55-17.55l-27.16-47.05A139.53,139.53,0,0,0,295.76,81.3H241.43a139.53,139.53,0,0,0-120.82,69.76L93.45,198.11a139.52,139.52,0,0,0,0,139.51l27.16,47.05a139.52,139.52,0,0,0,120.82,69.75h54.33a139.52,139.52,0,0,0,120.82-69.75l27.16-47.05a139.23,139.23,0,0,0,8.55-17.55c0-.12.09-.23.13-.35a116.05,116.05,0,0,0-18.5-1.48C393.3,318.24,378.05,331.75,360.4,347.4Z"
                                                        ></path>
                                                        <path
                                                            fill="#006bff"
                                                            d="M283.62,183h-23c-42.42,0-70.3,30.3-70.3,69.09v31.51c0,38.79,27.88,69.09,70.3,69.09h23c61.82,0,57-63,150.3-63a144.19,144.19,0,0,1,26.37,2.41,139.36,139.36,0,0,0,0-48.46,143.32,143.32,0,0,1-26.37,2.42C340.59,246.05,345.44,183,283.62,183Z"
                                                        ></path>
                                                        <path
                                                            fill="#006bff"
                                                            d="M513.91,315.13a130.21,130.21,0,0,0-53.62-23c0,.16-.05.32-.08.47a138.46,138.46,0,0,1-7.79,27.16A102.15,102.15,0,0,1,496.75,338c0,.14-.08.28-.13.43A237.8,237.8,0,0,1,463.33,406a240.67,240.67,0,0,1-52,53.48A239.3,239.3,0,0,1,98.65,98.65a239.43,239.43,0,0,1,398,98.69c.05.15.09.29.13.43A102.15,102.15,0,0,1,452.42,216a139.36,139.36,0,0,1,7.8,27.18c0,.15,0,.3.07.44a129.94,129.94,0,0,0,53.62-23c15.29-11.31,12.33-24.09,10-31.65C490.22,79.52,388.33,0,267.86,0,119.93,0,0,119.93,0,267.86S119.93,535.73,267.86,535.73c120.47,0,222.36-79.52,256-188.94C526.24,339.23,529.2,326.45,513.91,315.13Z"
                                                        ></path>
                                                        <path
                                                            fill="#0ae9ef"
                                                            d="M452.42,216a116.05,116.05,0,0,1-18.5,1.48c-40.62,0-55.87-13.51-73.52-29.16-17-15.09-38.21-33.87-76.78-33.87h-23c-27.88,0-53.23,10.12-71.37,28.49-17.72,17.94-27.48,42.5-27.48,69.16v31.51c0,26.66,9.76,51.22,27.48,69.16,18.14,18.37,43.49,28.49,71.37,28.49h23c38.57,0,59.76-18.78,76.78-33.87,17.65-15.65,32.9-29.16,73.52-29.16a116.05,116.05,0,0,1,18.5,1.48,138.46,138.46,0,0,0,7.79-27.16c0-.15.06-.31.08-.47a144.19,144.19,0,0,0-26.37-2.41c-93.33,0-88.48,63-150.3,63h-23c-42.42,0-70.3-30.3-70.3-69.09V252.11c0-38.79,27.88-69.09,70.3-69.09h23c61.82,0,57,63,150.3,63a143.32,143.32,0,0,0,26.37-2.42c0-.14,0-.29-.07-.44A139.36,139.36,0,0,0,452.42,216Z"
                                                        ></path>
                                                        <path
                                                            fill="#0ae9ef"
                                                            d="M452.42,216a116.05,116.05,0,0,1-18.5,1.48c-40.62,0-55.87-13.51-73.52-29.16-17-15.09-38.21-33.87-76.78-33.87h-23c-27.88,0-53.23,10.12-71.37,28.49-17.72,17.94-27.48,42.5-27.48,69.16v31.51c0,26.66,9.76,51.22,27.48,69.16,18.14,18.37,43.49,28.49,71.37,28.49h23c38.57,0,59.76-18.78,76.78-33.87,17.65-15.65,32.9-29.16,73.52-29.16a116.05,116.05,0,0,1,18.5,1.48,138.46,138.46,0,0,0,7.79-27.16c0-.15.06-.31.08-.47a144.19,144.19,0,0,0-26.37-2.41c-93.33,0-88.48,63-150.3,63h-23c-42.42,0-70.3-30.3-70.3-69.09V252.11c0-38.79,27.88-69.09,70.3-69.09h23c61.82,0,57,63,150.3,63a143.32,143.32,0,0,0,26.37-2.42c0-.14,0-.29-.07-.44A139.36,139.36,0,0,0,452.42,216Z"
                                                        ></path>
                                                    </g>
                                                </g>
                                            </g>
                                        </svg>
                                    </span>
                                    Book a meeting with Calendly
                                </a>
                            </motion.div>
                            
                            {/* Effet de brillance de fond */}
                            <motion.div 
                                className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl z-0"
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{ 
                                    duration: 8, 
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                            />
                        </motion.div>

                        {/* Colonne droite - Formulaire de contact */}
                        <motion.div 
                            className="contact-form-column"
                            initial="hidden"
                            animate={shouldStartAnimations ? "visible" : "hidden"}
                            variants={staggerContainer}
                        >
                            <motion.h2 
                                className="form-title"
                                variants={fadeInUp}
                                custom={0}
                            >
                                Boostez Votre Présence Aujourd&apos;hui !
                            </motion.h2>
                            
                            <motion.p 
                                className="form-subtitle"
                                variants={fadeInUp}
                                custom={1}
                            >
                                Votre image mérite d&apos;être vue, entendue, ressentie. Rejoignez
                                <span className="primecontent-title"> Primecontent. </span> pour propulser votre présence visuelle et numérique au
                                niveau supérieur.
                            </motion.p>

                            <motion.form 
                                onSubmit={handleSubmit} 
                                className="contact-form relative"
                                variants={staggerContainer}
                                initial="hidden"
                                animate={shouldStartAnimations ? "visible" : "hidden"}
                            >
                                <motion.div 
                                    className="form-row"
                                    variants={staggerContainer}
                                >
                                    <motion.div 
                                        className="form-group relative"
                                        variants={fadeInUp}
                                        custom={2}
                                    >
                                        <input
                                            type="text"
                                            id="nom"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            placeholder="Nom *"
                                            required
                                            className="form-input"
                                        />
                                    </motion.div>
                                    
                                    <motion.div 
                                        className="form-group relative"
                                        variants={fadeInUp}
                                        custom={3}
                                    >
                                        <input
                                            type="text"
                                            id="prenom"
                                            name="prenom"
                                            value={formData.prenom}
                                            onChange={handleChange}
                                            placeholder="Prénom *"
                                            required
                                            className="form-input"
                                        />
                                    </motion.div>
                                </motion.div>

                                <motion.div 
                                    className="form-group relative"
                                    variants={fadeInUp}
                                    custom={4}
                                >
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Email *"
                                        required
                                        className="form-input"
                                    />
                                </motion.div>

                                <motion.div 
                                    className="form-group relative"
                                    variants={fadeInUp}
                                    custom={5}
                                >
                                    <input
                                        type="tel"
                                        id="telephone"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        placeholder="Téléphone"
                                        className="form-input"
                                    />
                                </motion.div>

                                <motion.div 
                                    className="form-group relative"
                                    variants={fadeInUp}
                                    custom={6}
                                >
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Message *"
                                        required
                                        className="form-textarea"
                                        rows={5}
                                    ></textarea>
                                </motion.div>
                                <motion.span 
                                    className="font-light text-sm text-gray-500"
                                    variants={fadeInUp}
                                    custom={7}
                                >
                                    * Champs obligatoires
                                </motion.span>

                                <motion.button 
                                    type="submit" 
                                    className="submit-button"
                                    variants={fadeInUp}
                                    custom={8}
                                    whileHover={{ scale: 1.03, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    Contactez-nous <span className="arrow-icon">→</span>
                                </motion.button>
                            </motion.form>
                            
                            {/* Effet de brillance de fond */}
                            <motion.div 
                                className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl z-0"
                                animate={{ 
                                    scale: [1, 1.3, 1],
                                    opacity: [0.2, 0.5, 0.2]
                                }}
                                transition={{ 
                                    duration: 10, 
                                    repeat: Infinity,
                                    repeatType: "reverse"
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
