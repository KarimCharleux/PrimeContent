'use client';

import Image from 'next/image';
import { useState } from 'react';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { Evenement, EventType, TarifDegressif } from '../../models/eventTypes';

// Styles pour le toggle switch
import './toggle.scss';

interface EventFormProps {
    readonly formData: Partial<Evenement>;
    readonly setFormData: React.Dispatch<React.SetStateAction<Partial<Evenement>>>;
    readonly handleSubmit: (e: React.FormEvent, data: Partial<Evenement>) => Promise<void>;
    readonly handleCancel: () => void;
    readonly previewImage: string | null;
    readonly handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readonly isEditing: boolean;
    readonly isUploading: boolean;
}

export default function EventForm({
    formData,
    setFormData,
    handleSubmit,
    handleCancel,
    previewImage,
    handleImageFileChange,
    isEditing,
    isUploading,
}: EventFormProps) {
    const [activeTab, setActiveTab] = useState<string>('general');
    const [mdpGenere, setMdpGenere] = useState<string>('');

    // Générer un mot de passe aléatoire
    const genererMotDePasse = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let mdp = '';
        for (let i = 0; i < 8; i++) {
            mdp += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setMdpGenere(mdp);

        // Mettre à jour formData avec le mot de passe généré
        setFormData((prev) => ({
            ...prev,
            protectionMotDePasse: {
                ...(prev.protectionMotDePasse || { actif: true }),
                motDePasse: mdp,
            },
        }));
    };

    // Ajouter un tarif dégressif
    const ajouterTarifDegressif = () => {
        const nouveauTarif: TarifDegressif = {
            quantite: 5,
            pourcentageRemise: 10,
        };

        setFormData((prev) => ({
            ...prev,
            tarifDegressif: [...(prev.tarifDegressif || []), nouveauTarif],
        }));
    };

    // Supprimer un tarif dégressif
    const supprimerTarifDegressif = (index: number) => {
        if (!formData.tarifDegressif) return;

        const nouveauxTarifs = [...formData.tarifDegressif];
        nouveauxTarifs.splice(index, 1);

        setFormData((prev) => ({
            ...prev,
            tarifDegressif: nouveauxTarifs,
        }));
    };

    // Mettre à jour un tarif dégressif
    const updateTarifDegressif = (index: number, field: keyof TarifDegressif, value: number) => {
        if (!formData.tarifDegressif) return;

        const nouveauxTarifs = [...formData.tarifDegressif];
        nouveauxTarifs[index] = {
            ...nouveauxTarifs[index],
            [field]: value,
        };

        setFormData((prev) => ({
            ...prev,
            tarifDegressif: nouveauxTarifs,
        }));
    };

    // Gérer le changement de type d'événement
    const handleTypeChange = (type: EventType) => {
        setFormData((prev) => ({
            ...prev,
            type,
        }));

        // Réinitialiser certains champs en fonction du type
        if (type !== 'selection') {
            setFormData((prev) => ({
                ...prev,
                prixParPhoto: undefined,
                tarifDegressif: undefined,
                demanderInfosUtilisateur: undefined,
                telechargerActif: undefined,
            }));
        }
    };

    // Gérer la protection par mot de passe
    const handleProtectionChange = (actif: boolean) => {
        setFormData((prev) => ({
            ...prev,
            protectionMotDePasse: {
                actif,
                motDePasse: prev.protectionMotDePasse?.motDePasse || '',
            },
        }));
    };

    return (
        <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                {isEditing ? `Modifier: ${formData.titre}` : 'Ajouter un nouvel événement'}
            </h3>

            {/* Tabs de navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'general'
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Informations générales
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('type')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'type'
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Type d&apos;événement
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('protection')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'protection'
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Protection
                    </button>
                </nav>
            </div>

            {/* Contenu des tabs */}
            <div className="mt-8">
                {/* Tab Informations générales */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titre *
                                </label>
                                <input
                                    type="text"
                                    value={formData.titre || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, titre: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Titre de l'événement"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catégorie
                                </label>
                                <input
                                    type="text"
                                    value={formData.categorie || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, categorie: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Catégorie de l'événement"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, date: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lieu
                                </label>
                                <input
                                    type="text"
                                    value={formData.lieu || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, lieu: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Lieu de l'événement"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Visibilité
                                </label>
                                <div className="relative inline-block w-auto mr-2 align-middle select-none">
                                    <input
                                        type="checkbox"
                                        id="toggle-visible"
                                        checked={formData.visible}
                                        onChange={(e) =>
                                            setFormData({ ...formData, visible: e.target.checked })
                                        }
                                        className="toggle-checkbox"
                                    />
                                    <label
                                        htmlFor="toggle-visible"
                                        className={`toggle-label toggle-green`}
                                    ></label>
                                </div>
                                <label
                                    htmlFor="toggle-visible"
                                    className="text-sm text-gray-700 ml-2"
                                >
                                    {formData.visible ? 'Visible' : 'Masqué'}
                                </label>
                                <p className="mt-1 text-xs text-gray-500">
                                    {formData.visible
                                        ? "L'événement sera affiché dans la liste des événements"
                                        : "L'événement sera accessible uniquement par son URL directe"}
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Image principale
                                </label>
                                <div className="flex items-center space-x-2">
                                    <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer">
                                        <span>Parcourir</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageFileChange}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prévisualisation
                                </label>
                                <div className="relative aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden">
                                    {previewImage ? (
                                        <Image
                                            src={getMediaUrl(previewImage)}
                                            alt="Prévisualisation"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-12 w-12 mb-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <span>Aucune image sélectionnée</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (optionnelle)
                                </label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Description de l'événement"
                                    rows={4}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Type d'événement */}
                {activeTab === 'type' && (
                    <div>
                        <div className="mb-6">
                            <h4 className="text-md font-medium mb-3">Type d&apos;événement</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.type === 'visionner' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
                                    onClick={() => handleTypeChange('visionner')}
                                >
                                    <div className="flex items-center mb-2">
                                        <input
                                            type="radio"
                                            checked={formData.type === 'visionner'}
                                            onChange={() => handleTypeChange('visionner')}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <label className="ml-2 block text-sm font-medium text-gray-700">
                                            Visionnage
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">
                                        Les utilisateurs peuvent simplement voir toutes les photos
                                        sans option d&apos;achat.
                                    </p>
                                </div>

                                <div
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.type === 'selection' ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-gray-400'}`}
                                    onClick={() => handleTypeChange('selection')}
                                >
                                    <div className="flex items-center mb-2">
                                        <input
                                            type="radio"
                                            checked={formData.type === 'selection'}
                                            onChange={() => handleTypeChange('selection')}
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                                        />
                                        <label className="ml-2 block text-sm font-medium text-gray-700">
                                            Sélection
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">
                                        Les utilisateurs peuvent sélectionner et acheter des photos
                                        individuellement.
                                    </p>
                                </div>

                                <div
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.type === 'paye' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-gray-400'}`}
                                    onClick={() => handleTypeChange('paye')}
                                >
                                    <div className="flex items-center mb-2">
                                        <input
                                            type="radio"
                                            checked={formData.type === 'paye'}
                                            onChange={() => handleTypeChange('paye')}
                                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                                        />
                                        <label className="ml-2 block text-sm font-medium text-gray-700">
                                            Déjà payé
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">
                                        L&apos;utilisateur a accès au téléchargement de toutes les
                                        photos sans paiement supplémentaire.
                                    </p>
                                </div>

                                <div
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.type === 'non_paye' ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-gray-400'}`}
                                    onClick={() => handleTypeChange('non_paye')}
                                >
                                    <div className="flex items-center mb-2">
                                        <input
                                            type="radio"
                                            checked={formData.type === 'non_paye'}
                                            onChange={() => handleTypeChange('non_paye')}
                                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                                        />
                                        <label className="ml-2 block text-sm font-medium text-gray-700">
                                            Non payé
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">
                                        L&apos;utilisateur doit payer pour télécharger toutes les
                                        photos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Options spécifiques pour le type "Sélection" */}
                        {formData.type === 'selection' && (
                            <>
                                {/* Toggle pour demander les informations utilisateur */}
                                <div className="mt-6 p-4 border border-pink-200 rounded-lg bg-white">
                                    <h5 className="text-sm font-medium text-gray-900 mb-3">
                                        Informations utilisateur
                                    </h5>

                                    <div className="flex items-center">
                                        <div className="relative inline-block w-auto mr-2 align-middle select-none">
                                            <input
                                                type="checkbox"
                                                id="toggle-demander-infos"
                                                checked={formData.demanderInfosUtilisateur || false}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        demanderInfosUtilisateur: e.target.checked,
                                                    })
                                                }
                                                className="toggle-checkbox"
                                            />
                                            <label
                                                htmlFor="toggle-demander-infos"
                                                className={`toggle-label toggle-pink`}
                                            ></label>
                                        </div>
                                        <label
                                            htmlFor="toggle-demander-infos"
                                            className="text-sm text-gray-700 ml-2"
                                        >
                                            {formData.demanderInfosUtilisateur
                                                ? "Demande d'informations activée"
                                                : "Demande d'informations désactivée"}
                                        </label>
                                    </div>

                                    <p className="mt-2 text-xs text-gray-500">
                                        {formData.demanderInfosUtilisateur
                                            ? "Les utilisateurs devront saisir leur email (obligatoire) et Instagram (optionnel) avant d'accéder à l'événement."
                                            : "Les utilisateurs pourront accéder directement à l'événement sans saisir leurs informations."}
                                    </p>
                                </div>

                                {/* Toggle pour activer le téléchargement */}
                                <div className="mt-6 p-4 border border-pink-200 rounded-lg bg-white">
                                    <h5 className="text-sm font-medium text-gray-900 mb-3">
                                        Options de téléchargement
                                    </h5>

                                    <div className="flex items-center">
                                        <div className="relative inline-block w-auto mr-2 align-middle select-none">
                                            <input
                                                type="checkbox"
                                                id="toggle-telecharger"
                                                checked={formData.telechargerActif || false}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        telechargerActif: e.target.checked,
                                                    })
                                                }
                                                className="toggle-checkbox"
                                            />
                                            <label
                                                htmlFor="toggle-telecharger"
                                                className={`toggle-label toggle-pink`}
                                            ></label>
                                        </div>
                                        <label
                                            htmlFor="toggle-telecharger"
                                            className="text-sm text-gray-700 ml-2"
                                        >
                                            {formData.telechargerActif
                                                ? 'Téléchargement activé'
                                                : 'Téléchargement désactivé'}
                                        </label>
                                    </div>

                                    <p className="mt-2 text-xs text-gray-500">
                                        {formData.telechargerActif
                                            ? 'Après confirmation de leur sélection, les utilisateurs pourront télécharger leurs médias.'
                                            : 'Les utilisateurs pourront seulement sélectionner et confirmer leurs médias sans pouvoir les télécharger.'}
                                    </p>
                                </div>

                                <div className="mt-6 p-6 border border-pink-200 rounded-lg bg-pink-50">
                                    <h4 className="text-md font-medium mb-4">
                                        Options de tarification
                                    </h4>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Prix par photo (en €)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.prixParPhoto || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    prixParPhoto:
                                                        e.target.value === ''
                                                            ? undefined
                                                            : parseFloat(e.target.value),
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Prix par photo"
                                        />
                                        {formData.type === 'selection' && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Optionnel pour les sélections. Si laissé vide,
                                                aucune tarification ne sera appliquée et le
                                                téléchargement sera gratuit.
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-2">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tarifs dégressifs
                                            </label>
                                            <button
                                                type="button"
                                                onClick={ajouterTarifDegressif}
                                                className="px-2 py-1 bg-pink-600 text-white rounded-md hover:bg-pink-700 text-xs"
                                            >
                                                Ajouter un palier
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">
                                            Définissez des remises en fonction du nombre de photos
                                            achetées.
                                        </p>

                                        {formData.tarifDegressif &&
                                        formData.tarifDegressif.length > 0 ? (
                                            <div className="space-y-3">
                                                {formData.tarifDegressif.map((tarif, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-pink-100"
                                                    >
                                                        <div className="flex-1">
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                À partir de
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={tarif.quantite}
                                                                onChange={(e) =>
                                                                    updateTarifDegressif(
                                                                        index,
                                                                        'quantite',
                                                                        parseInt(e.target.value),
                                                                    )
                                                                }
                                                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Remise (%)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={tarif.pourcentageRemise}
                                                                onChange={(e) =>
                                                                    updateTarifDegressif(
                                                                        index,
                                                                        'pourcentageRemise',
                                                                        parseInt(e.target.value),
                                                                    )
                                                                }
                                                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                supprimerTarifDegressif(index)
                                                            }
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-5 w-5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 bg-white rounded-lg border border-dashed border-gray-300">
                                                <p className="text-sm text-gray-500">
                                                    Aucun tarif dégressif défini
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Tab Protection */}
                {activeTab === 'protection' && (
                    <div className="p-6 border rounded-lg">
                        <h4 className="text-md font-medium mb-4">Protection par mot de passe</h4>

                        <div className="mb-4">
                            <div className="flex items-center">
                                <div className="relative inline-block w-auto mr-2 align-middle select-none">
                                    <input
                                        type="checkbox"
                                        id="protection"
                                        checked={formData.protectionMotDePasse?.actif || false}
                                        onChange={(e) => handleProtectionChange(e.target.checked)}
                                        className="toggle-checkbox"
                                    />
                                    <label
                                        htmlFor="protection"
                                        className={`toggle-label toggle-yellow`}
                                    ></label>
                                </div>
                                <label htmlFor="protection" className="text-sm text-gray-700 ml-2">
                                    {formData.protectionMotDePasse?.actif
                                        ? 'Protégé'
                                        : 'Non protégé'}
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                {formData.protectionMotDePasse?.actif
                                    ? "L'accès à cet événement nécessitera un mot de passe"
                                    : "L'événement sera accessible sans mot de passe"}
                            </p>
                        </div>

                        {formData.protectionMotDePasse?.actif && (
                            <div className="mt-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mot de passe
                                    </label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={formData.protectionMotDePasse?.motDePasse || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    protectionMotDePasse: {
                                                        ...(formData.protectionMotDePasse || {
                                                            actif: true,
                                                        }),
                                                        motDePasse: e.target.value,
                                                    },
                                                })
                                            }
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Mot de passe"
                                            required={formData.protectionMotDePasse?.actif}
                                        />
                                        <button
                                            type="button"
                                            onClick={genererMotDePasse}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                        >
                                            Générer
                                        </button>
                                    </div>
                                </div>

                                {mdpGenere && (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg
                                                    className="h-5 w-5 text-yellow-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-yellow-700">
                                                    Mot de passe généré :{' '}
                                                    <strong>{mdpGenere}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 p-4 rounded-md">
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                                        Comment ça marche ?
                                    </h5>
                                    <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                                        <li>
                                            L&apos;accès à l&apos;événement nécessitera la saisie du
                                            mot de passe
                                        </li>
                                        <li>
                                            Partagez le mot de passe uniquement avec les personnes
                                            autorisées
                                        </li>
                                        <li>Idéal pour les événements privés ou professionnels</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    disabled={isUploading}
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors flex items-center"
                    disabled={isUploading}
                >
                    {isUploading && (
                        <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    )}
                    {isEditing ? 'Mettre à jour' : 'Ajouter'}
                </button>
            </div>
        </form>
    );
}
