'use client';

import { useEffect, useState } from 'react';

import { ContactInfo } from '../../models/contactTypes';

interface ContactInfoFormProps {
    readonly initialInfo?: ContactInfo;
    readonly onSave: (info: ContactInfo) => Promise<void>;
    readonly onCancel?: () => void;
}

export default function ContactInfoForm({ initialInfo, onSave, onCancel }: ContactInfoFormProps) {
    const [formData, setFormData] = useState<ContactInfo>({
        telephone: '',
        email: '',
        adresse: '',
        reseauxSociaux: {
            instagram: '',
            facebook: '',
            twitter: '',
            linkedin: '',
            tiktok: '',
        },
        calendlyUrl: '',
        texteBienvenue: "Boostez Votre Présence Aujourd'hui !",
        texteFormulaire:
            "Votre image mérite d'être vue, entendue, ressentie. Rejoignez Primecontent pour propulser votre présence visuelle et numérique au niveau supérieur.",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    useEffect(() => {
        if (initialInfo) {
            setFormData({
                ...initialInfo,
                reseauxSociaux: {
                    instagram: initialInfo.reseauxSociaux?.instagram || '',
                    facebook: initialInfo.reseauxSociaux?.facebook || '',
                    twitter: initialInfo.reseauxSociaux?.twitter || '',
                    linkedin: initialInfo.reseauxSociaux?.linkedin || '',
                    tiktok: initialInfo.reseauxSociaux?.tiktok || '',
                },
            });
        }
    }, [initialInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof ContactInfo] as Record<string, any>),
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
                message: 'Les informations de contact ont été enregistrées avec succès.',
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
            console.error("Erreur lors de l'enregistrement des infos de contact:", error);
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

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informations principales</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="telephone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Téléphone
                        </label>
                        <input
                            type="tel"
                            id="telephone"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label
                        htmlFor="adresse"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Adresse
                    </label>
                    <input
                        type="text"
                        id="adresse"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                        required
                    />
                </div>

                <div className="mt-4">
                    <label
                        htmlFor="calendlyUrl"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        URL Calendly
                    </label>
                    <input
                        type="url"
                        id="calendlyUrl"
                        name="calendlyUrl"
                        value={formData.calendlyUrl}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                        placeholder="https://calendly.com/votre-compte"
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Réseaux sociaux</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="reseauxSociaux.instagram"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Instagram
                        </label>
                        <input
                            type="url"
                            id="reseauxSociaux.instagram"
                            name="reseauxSociaux.instagram"
                            value={formData.reseauxSociaux?.instagram}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                            placeholder="https://instagram.com/votre-compte"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="reseauxSociaux.facebook"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Facebook
                        </label>
                        <input
                            type="url"
                            id="reseauxSociaux.facebook"
                            name="reseauxSociaux.facebook"
                            value={formData.reseauxSociaux?.facebook}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                            placeholder="https://facebook.com/votre-page"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="reseauxSociaux.twitter"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Twitter
                        </label>
                        <input
                            type="url"
                            id="reseauxSociaux.twitter"
                            name="reseauxSociaux.twitter"
                            value={formData.reseauxSociaux?.twitter}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                            placeholder="https://twitter.com/votre-compte"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="reseauxSociaux.linkedin"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            LinkedIn
                        </label>
                        <input
                            type="url"
                            id="reseauxSociaux.linkedin"
                            name="reseauxSociaux.linkedin"
                            value={formData.reseauxSociaux?.linkedin}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                            placeholder="https://linkedin.com/in/votre-compte"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="reseauxSociaux.tiktok"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            TikTok
                        </label>
                        <input
                            type="url"
                            id="reseauxSociaux.tiktok"
                            name="reseauxSociaux.tiktok"
                            value={formData.reseauxSociaux?.tiktok}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                            placeholder="https://tiktok.com/@votre-compte"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Textes de la page</h3>

                <div>
                    <label
                        htmlFor="texteBienvenue"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Titre d&apos;accueil
                    </label>
                    <input
                        type="text"
                        id="texteBienvenue"
                        name="texteBienvenue"
                        value={formData.texteBienvenue}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                    />
                </div>

                <div className="mt-4">
                    <label
                        htmlFor="texteFormulaire"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Texte du formulaire
                    </label>
                    <textarea
                        id="texteFormulaire"
                        name="texteFormulaire"
                        value={formData.texteFormulaire}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Annuler
                    </button>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}
