'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Footer from './components/Footer';
import Header from './components/Header';
import PrimaryButton from './components/PrimaryButton';

export default function NotFound() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="global-main-page">
            <Header />
            <div className="min-h-screen w-full flex flex-col items-center justify-center text-white p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h1 className="text-7xl md:text-9xl font-bold mb-4">404</h1>

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mb-8 relative h-40 md:h-56 w-full max-w-lg mx-auto"
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-white/20"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-[#090B14] px-8 py-3 text-xl md:text-2xl font-light tracking-wider">
                                PAGE NON TROUVÉE
                            </span>
                        </div>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg mx-auto"
                    >
                        La page que vous recherchez n&apos;existe pas ou a été déplacée.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                        className="flex justify-center"
                    >
                        <PrimaryButton
                            text="Retour à l'accueil"
                            href="/"
                            animateOnMount={true}
                            delay={0.2}
                        />
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 1.2, duration: 1 }}
                    className="mt-12 text-sm text-gray-500"
                >
                    © Prime Content
                </motion.div>
            </div>

            <Footer hideCTA={true} />
        </main>
    );
}
