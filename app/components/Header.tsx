'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import '../styles/header.scss';
import { motion } from 'framer-motion';
import { useAnimationControl } from '../hooks/useAnimationControl';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const shouldAnimate = useAnimationControl();
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
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const headerVariants = {
        hidden: {
            y: -100,
            opacity: 0
        },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.2,
                ease: "easeOut",
            }
        }
    };

    const navItems = [
        { name: 'Photos', href: '/photos' },
        { name: 'Vidéos', href: '/videos' },
        { name: 'Événements', href: '/evenements' },
        { name: 'Mariages', href: '/mariages' },
        { name: 'Contact', href: '/contact' }
    ];

    // Items supplémentaires pour mobile uniquement
    const mobileOnlyItems = [
        { name: 'Accueil', href: '/' }
    ];

    // Tous les items pour l'affichage mobile
    const allMobileItems = [...mobileOnlyItems, ...navItems];

    return (
        <motion.header
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            variants={headerVariants}
            className={`fixed w-full z-50 transition-all duration-300 top-0 ${
                isScrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                <Link href="/" className="font-bold text-xl">
                    <span className="text-white">Prime</span><span className="text-gray-400">content.</span>
                </Link>

                {/* Navigation Desktop */}
                <nav className="hidden md:block">
                    <ul className="flex space-x-8">
                        {navItems.map((item, index) => (  
                            <motion.li
                                key={item.name}
                                initial={{ opacity: 0, y: -20 }}
                                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                                transition={{
                                    duration: 0.3,
                                    delay: 0.3 + index * 0.1
                                }}
                            >
                                <Link
                                    href={item.href}
                                    className="text-white hover:text-gray-300 transition-colors duration-300"
                                >
                                    {item.name}
                                </Link>
                            </motion.li>
                        ))}
                    </ul>
                </nav>

                {/* Bouton Menu Mobile */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={toggleMobileMenu}
                    aria-label="Menu"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>
            </div>

            {/* Menu Mobile */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-95 z-50 transform transition-transform duration-300 h-screen md:hidden ${
                    mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Bouton de fermeture */}
                    <button
                        className="absolute top-6 right-6 text-white p-2"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Fermer le menu"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
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
                    </button>

                    {/* Liens du menu mobile */}
                    <nav className="flex flex-col items-center justify-center h-full">
                        {allMobileItems.map((item, index) => (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={mobileMenuOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                transition={{
                                    duration: 0.3,
                                    delay: 0.1 * index
                                }}
                                className="mb-8"
                            >
                                <Link
                                    href={item.href}
                                    className="text-white text-2xl hover:text-gray-300 transition-colors duration-300"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            </motion.div>
                        ))}
                    </nav>
                </div>
            </div>
        </motion.header>
    );
}
