'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import '../styles/header.scss';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Empêcher le défilement du body lorsque le menu mobile est ouvert
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 50;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        // Ajouter l'écouteur d'événement
        window.addEventListener('scroll', handleScroll);

        // Vérifier l'état initial
        handleScroll();

        // Nettoyer l'écouteur d'événement
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrolled]);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <header
            className={`header ${scrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'menu-open' : ''}`}
        >
            <div className="header-backdrop"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
                <div className="flex justify-between items-center">
                    <Link href="/" className="logo text-2xl font-bold">
                        PrimeContent.
                    </Link>

                    {/* Menu desktop */}
                    <div className="hidden md:flex space-x-10 nav-links">
                        <Link
                            href="/photos"
                            className="nav-link hover:translate-y-1 transition-transform duration-300"
                        >
                            Photos
                        </Link>
                        <Link
                            href="/videos"
                            className="nav-link hover:translate-y-1 transition-transform duration-300"
                        >
                            Vidéos
                        </Link>
                        <Link
                            href="/events"
                            className="nav-link hover:translate-y-1 transition-transform duration-300"
                        >
                            Événements
                        </Link>
                        <Link
                            href="/contact"
                            className="nav-link hover:translate-y-1 transition-transform duration-300"
                        >
                            Contact
                        </Link>
                    </div>

                    {/* Bouton hamburger pour mobile */}
                    <button
                        className="md:hidden hamburger-button flex flex-col justify-center items-center w-10 h-10 p-2 rounded-md bg-gray-900 bg-opacity-50"
                        onClick={toggleMobileMenu}
                        aria-label="Menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
                        <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
                        <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
                    </button>
                </div>
            </div>

            {/* Menu mobile */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
                {/* Bouton de fermeture (croix) */}
                <button
                    className="close-button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Fermer le menu"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="mobile-menu-links">
                    <Link
                        href="/"
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Accueil
                    </Link>
                    <Link
                        href="/photos"
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Photos
                    </Link>
                    <Link
                        href="/videos"
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Vidéos
                    </Link>
                    <Link
                        href="/events"
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Événements
                    </Link>
                    <Link
                        href="/contact"
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Contact
                    </Link>
                </div>
            </div>
        </header>
    );
}
