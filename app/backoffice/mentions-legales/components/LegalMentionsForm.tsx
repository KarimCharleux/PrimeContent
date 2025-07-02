'use client';

import { useEffect, useState } from 'react';

import { LegalMentions } from '../../models/legalTypes';

interface LegalMentionsFormProps {
    readonly initialMentions?: LegalMentions;
    readonly onSave: (mentions: LegalMentions) => Promise<void>;
    readonly onCancel?: () => void;
}

export default function LegalMentionsForm({
    initialMentions,
    onSave,
    onCancel,
}: LegalMentionsFormProps) {
    const [formData, setFormData] = useState<LegalMentions>({
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
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    useEffect(() => {
        if (initialMentions) {
            setFormData(initialMentions);
        }
    }, [initialMentions]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;

        // Gérer les champs imbriqués
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof LegalMentions] as any),
                    [child]: value,
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage(null);

        try {
            await onSave(formData);
            setStatusMessage({
                type: 'success',
                message: 'Les mentions légales ont été enregistrées avec succès.',
            });

            // Effacer le message après 5 secondes
            setTimeout(() => {
                setStatusMessage(null);
            }, 5000);
        } catch (error) {
            setStatusMessage({
                type: 'error',
                message: "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
            });
            console.error("Erreur lors de l'enregistrement des mentions légales:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {statusMessage && (
                <div
                    className={`p-4 rounded-md ${
                        statusMessage.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {statusMessage.type === 'success' ? (
                                <svg
                                    className="h-5 w-5 text-green-500"
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
                            ) : (
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
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{statusMessage.message}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    Texte d&apos;introduction
                </h2>
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="textIntroduction"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Texte d&apos;introduction (optionnel)
                        </label>
                        <textarea
                            id="textIntroduction"
                            name="textIntroduction"
                            value={formData.textIntroduction || ''}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Texte d'introduction affiché en haut de la page..."
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    Identification de l&apos;entreprise
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="nomEntreprise"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Nom de l&apos;entreprise *
                        </label>
                        <input
                            type="text"
                            id="nomEntreprise"
                            name="nomEntreprise"
                            value={formData.nomEntreprise}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="formeJuridique"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Forme juridique *
                        </label>
                        <select
                            id="formeJuridique"
                            name="formeJuridique"
                            value={formData.formeJuridique}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Sélectionner...</option>
                            <option value="Micro-entreprise">Micro-entreprise</option>
                            <option value="Auto-entreprise">Auto-entreprise</option>
                            <option value="EURL">EURL</option>
                            <option value="SARL">SARL</option>
                            <option value="SASU">SASU</option>
                            <option value="SAS">SAS</option>
                            <option value="SA">SA</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label
                            htmlFor="adresseSiegeSocial"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Adresse du siège social *
                        </label>
                        <input
                            type="text"
                            id="adresseSiegeSocial"
                            name="adresseSiegeSocial"
                            value={formData.adresseSiegeSocial}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="responsablePublication"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Responsable de la publication *
                        </label>
                        <input
                            type="text"
                            id="responsablePublication"
                            name="responsablePublication"
                            value={formData.responsablePublication}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Coordonnées de contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="coordonneesContact.email"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Email *
                        </label>
                        <input
                            type="email"
                            id="coordonneesContact.email"
                            name="coordonneesContact.email"
                            value={formData.coordonneesContact.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="coordonneesContact.telephone"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Téléphone *
                        </label>
                        <input
                            type="tel"
                            id="coordonneesContact.telephone"
                            name="coordonneesContact.telephone"
                            value={formData.coordonneesContact.telephone}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Informations légales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="numeroSIRET"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Numéro SIRET *
                        </label>
                        <input
                            type="text"
                            id="numeroSIRET"
                            name="numeroSIRET"
                            value={formData.numeroSIRET}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="rcsRm"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            RCS / RM *
                        </label>
                        <input
                            type="text"
                            id="rcsRm"
                            name="rcsRm"
                            value={formData.rcsRm}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label
                            htmlFor="tvaIntracommunautaire"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            TVA intracommunautaire (optionnel)
                        </label>
                        <input
                            type="text"
                            id="tvaIntracommunautaire"
                            name="tvaIntracommunautaire"
                            value={formData.tvaIntracommunautaire || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Si applicable"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Hébergeur du site</h2>
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="hebergeur.nom"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Nom de l&apos;hébergeur *
                        </label>
                        <input
                            type="text"
                            id="hebergeur.nom"
                            name="hebergeur.nom"
                            value={formData.hebergeur.nom}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="hebergeur.adresse"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Adresse de l&apos;hébergeur *
                        </label>
                        <input
                            type="text"
                            id="hebergeur.adresse"
                            name="hebergeur.adresse"
                            value={formData.hebergeur.adresse}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="hebergeur.contact"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Contact de l&apos;hébergeur (email ou téléphone) *
                        </label>
                        <input
                            type="text"
                            id="hebergeur.contact"
                            name="hebergeur.contact"
                            value={formData.hebergeur.contact}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="email@example.com ou +33 1 23 45 67 89"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Annuler
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}
