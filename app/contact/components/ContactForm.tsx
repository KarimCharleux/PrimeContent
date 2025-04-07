'use client';

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { db } from '@/app/backoffice/lib/firebase-client';
import { ContactMessage } from '@/app/backoffice/models/contactTypes';

export default function ContactForm() {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        message: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        try {
            // Create contact message object
            const contactMessage: ContactMessage = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                telephone: formData.telephone,
                message: formData.message,
                createdAt: Timestamp.now(),
                status: 'nouveau',
                notes: '',
            };

            // Add to Firestore
            await addDoc(collection(db, 'contacts'), contactMessage);

            // Reset the form
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                message: '',
            });

            setFormSubmitted(true);

            // Reset the success message after 5 seconds
            setTimeout(() => {
                setFormSubmitted(false);
            }, 5000);
        } catch (error) {
            console.error('Error submitting contact form:', error);
            setFormError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-8"
        >
            {formSubmitted ? (
                <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center">
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
                    <p className="text-green-700">
                        Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold mb-6 text-center">Contactez-nous</h2>

                    {formError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
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
                                    <p className="text-sm text-red-800">{formError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            <input
                                type="text"
                                name="nom"
                                required
                                value={formData.nom}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                                placeholder="Votre nom"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom
                            </label>
                            <input
                                type="text"
                                name="prenom"
                                required
                                value={formData.prenom}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                                placeholder="Votre prénom"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                                placeholder="votre@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Téléphone
                            </label>
                            <input
                                type="tel"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                                placeholder="Votre numéro de téléphone"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message
                        </label>
                        <textarea
                            name="message"
                            required
                            value={formData.message}
                            onChange={handleChange}
                            rows={5}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                            placeholder="Votre message..."
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                    </motion.button>
                </form>
            )}
        </motion.div>
    );
}
