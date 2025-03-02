'use client';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/contact/contact.scss';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        message: '',
    });

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

    // Animation au chargement de la page
    useEffect(() => {
        // Simuler un chargement progressif des éléments
        const timer1 = setTimeout(() => {
            const title = document.querySelector('.contact-title');
            if (title) title.classList.add('fade-in');
        }, 300);

        const timer2 = setTimeout(() => {
            const columns = document.querySelectorAll('.contact-info-column, .contact-form-column');
            columns.forEach((col, index) => {
                setTimeout(() => {
                    col.classList.add('fade-in');
                }, index * 200);
            });
        }, 500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <main className="contact-page">
            <Header />

            <section className="contact-hero">
                <div className="container">
                    <h1 className="contact-title">CONTACT</h1>

                    <div className="contact-content">
                        {/* Colonne gauche - Informations de contact */}
                        <div className="contact-info-column">
                            <h2 className="info-title">Contact Information</h2>
                            <p className="info-subtitle">Un événement en tête? Contactez-nous!</p>

                            <div className="contact-details">
                                <div className="contact-item">
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
                                </div>

                                <div className="contact-item">
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
                                </div>

                                <div className="contact-item">
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
                                </div>
                            </div>

                            <div className="calendly-section">
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
                            </div>
                        </div>

                        {/* Colonne droite - Formulaire de contact */}
                        <div className="contact-form-column">
                            <h2 className="form-title">Boostez Votre Présence Aujourd&apos;hui !</h2>
                            <p className="form-subtitle">
                                Votre image mérite d&apos;être vue, entendue, ressentie. Rejoignez
                                PrimeContent pour propulser votre présence visuelle et numérique au
                                niveau supérieur.
                            </p>

                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-row">
                                    <div className="form-group">
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
                                    </div>
                                    <div className="form-group">
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
                                    </div>
                                </div>

                                <div className="form-group">
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
                                </div>

                                <div className="form-group">
                                    <input
                                        type="tel"
                                        id="telephone"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        placeholder="Téléphone"
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
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
                                </div>
                                <span className="font-light text-sm text-gray-500">* Champs obligatoires</span>

                                <button type="submit" className="submit-button">
                                    Contactez-nous <span className="arrow-icon">→</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <Footer hideCTA={true} />
        </main>
    );
}
