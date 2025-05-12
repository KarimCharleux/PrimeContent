'use client';

import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import ExpertiseCard from '../../../components/ExpertiseCard';
import { getMediaUrl } from '../../../utils/mediaUrl';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface Expertise {
    id?: string;
    title: string;
    description: string;
    backgroundImage: string;
    href: string;
    icon: string;
    order?: number;
}

export default function HomeTabExpertises() {
    const [expertises, setExpertises] = useState<Expertise[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [editingExpertise, setEditingExpertise] = useState<Expertise | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<Expertise>();
    const watchedValues = watch();

    // Charger les expertises depuis Firestore ou utiliser les données par défaut
    useEffect(() => {
        const fetchExpertises = async () => {
            try {
                const expertisesCollection = collection(db, 'expertises');
                const expertisesSnapshot = await getDocs(expertisesCollection);

                if (expertisesSnapshot.empty) {
                    // Expertises vide
                    setExpertises([]);
                } else {
                    const fetchedExpertises = expertisesSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Expertise[];

                    // Vérifier si les expertises ont déjà un ordre défini
                    const hasOrderProperty = fetchedExpertises.some(
                        (exp) => exp.order !== undefined,
                    );

                    if (!hasOrderProperty) {
                        // Initialiser les ordres si pas définis
                        const expertisesWithOrder = fetchedExpertises.map((exp, index) => ({
                            ...exp,
                            order: index,
                        }));
                        setExpertises(expertisesWithOrder);

                        // Mettre à jour dans Firestore
                        for (const expertise of expertisesWithOrder) {
                            if (expertise.id) {
                                await updateDoc(doc(db, 'expertises', expertise.id), {
                                    order: expertise.order,
                                });
                            }
                        }
                    } else {
                        // Trier par ordre si déjà défini
                        const sortedExpertises = [...fetchedExpertises].sort(
                            (a, b) => (a.order || 0) - (b.order || 0),
                        );
                        setExpertises(sortedExpertises);
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des expertises:', error);
                setStatusMessage({
                    type: 'error',
                    message: 'Impossible de charger les expertises',
                });
                setExpertises([]);
            } finally {
                setLoading(false);
            }
        };

        fetchExpertises();
    }, []);

    // Fonction pour obtenir l'icône à partir du nom
    const getIconFromName = (icon: string): React.ReactNode => {
        // Vérifier si c'est un nom d'icône prédéfini
        switch (icon) {
            case 'video':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="black"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                );
            case 'photo':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="black"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                    </svg>
                );
            case 'social':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="black"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                );
            case 'branding':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="black"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                        />
                    </svg>
                );
            case 'web':
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-7 md:w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="black"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                );
            default:
                // Si ce n'est pas un nom prédéfini, essayer de traiter comme du SVG brut
                try {
                    if (icon.includes('<svg')) {
                        // Vérifier si on est côté client (typeof window !== 'undefined')
                        if (typeof window !== 'undefined') {
                            // Créer un div temporaire pour parser le SVG
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = icon;

                            // Obtenir l'élément SVG
                            const svgElement = tempDiv.querySelector('svg');

                            if (svgElement) {
                                // Ajouter les classes nécessaires
                                svgElement.classList.add('h-5', 'w-5', 'md:h-7', 'md:w-7');

                                // Retourner le HTML parsé du SVG
                                return (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: svgElement.outerHTML }}
                                    />
                                );
                            }
                        }

                        // Solution de secours pour le rendu côté serveur
                        return (
                            <div
                                dangerouslySetInnerHTML={{ __html: icon }}
                                className="h-5 w-5 md:h-7 md:w-7"
                            />
                        );
                    }

                    // Fallback - retourner le texte comme composant si tout échoue
                    return (
                        <div className="h-5 w-5 md:h-7 md:w-7 text-black text-xs flex items-center justify-center">
                            {icon.substring(0, 3)}
                        </div>
                    );
                } catch (error) {
                    console.error('Erreur de parsing SVG:', error);
                    return (
                        <div className="h-5 w-5 md:h-7 md:w-7 text-black text-xs flex items-center justify-center">
                            SVG
                        </div>
                    );
                }
        }
    };

    // Fonction pour gérer le changement d'ordre d'une expertise
    const handleReorder = async (expertiseId: string | undefined, direction: 'up' | 'down') => {
        if (!expertiseId) return;

        try {
            // Trier les expertises par ordre
            const sortedExpertises = [...expertises].sort(
                (a, b) => (a.order || 0) - (b.order || 0),
            );

            // Trouver l'index actuel de l'expertise
            const currentIndex = sortedExpertises.findIndex((exp) => exp.id === expertiseId);
            if (currentIndex === -1) return;

            // Déterminer le nouvel index en fonction de la direction
            const newIndex =
                direction === 'up'
                    ? Math.max(0, currentIndex - 1)
                    : Math.min(sortedExpertises.length - 1, currentIndex + 1);

            // Si l'index ne change pas (déjà en haut ou en bas), ne rien faire
            if (newIndex === currentIndex) return;

            // Échanger les ordres entre les deux expertises
            const targetExpertise = sortedExpertises[newIndex];
            const currentExpertise = sortedExpertises[currentIndex];

            const currentOrder = currentExpertise.order || 0;
            const targetOrder = targetExpertise.order || 0;

            // Mettre à jour les ordres
            const updatedExpertises = sortedExpertises.map((exp) => {
                if (exp.id === expertiseId) {
                    return { ...exp, order: targetOrder };
                } else if (exp.id === targetExpertise.id) {
                    return { ...exp, order: currentOrder };
                }
                return exp;
            });

            // Mettre à jour l'état local
            setExpertises(updatedExpertises);

            // Mettre à jour Firestore
            if (currentExpertise.id) {
                await updateDoc(doc(db, 'expertises', currentExpertise.id), {
                    order: targetOrder,
                });
            }

            if (targetExpertise.id) {
                await updateDoc(doc(db, 'expertises', targetExpertise.id), {
                    order: currentOrder,
                });
            }

            setStatusMessage({
                type: 'success',
                message: 'Ordre modifié avec succès',
            });
        } catch (error) {
            console.error('Erreur lors de la réorganisation:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la réorganisation des expertises',
            });
        }
    };

    const onSubmit = async (data: Expertise) => {
        setSaving(true);
        try {
            if (editingExpertise?.id) {
                // Mise à jour d'une expertise existante
                await updateDoc(doc(db, 'expertises', editingExpertise.id), {
                    title: data.title,
                    description: data.description,
                    backgroundImage: data.backgroundImage,
                    href: data.href,
                    icon: data.icon,
                    order: editingExpertise.order || 0, // Conserver l'ordre existant
                });

                setExpertises((prevExpertises) =>
                    prevExpertises.map((exp) =>
                        exp.id === editingExpertise.id
                            ? { ...data, id: exp.id, order: exp.order }
                            : exp,
                    ),
                );
                setStatusMessage({ type: 'success', message: 'Expertise mise à jour avec succès' });
                setEditingExpertise(null);
                reset();
                setPreviewImage(null);
            } else {
                // Ajout d'une nouvelle expertise
                // Trouver l'ordre le plus élevé et ajouter 1
                const maxOrder =
                    expertises.length > 0
                        ? Math.max(...expertises.map((exp) => exp.order || 0)) + 1
                        : 0;

                const docRef = await addDoc(collection(db, 'expertises'), {
                    title: data.title,
                    description: data.description,
                    backgroundImage: data.backgroundImage,
                    href: data.href,
                    icon: data.icon,
                    order: maxOrder, // Assigner le nouvel ordre
                });

                setExpertises((prevExpertises) => [
                    ...prevExpertises,
                    { ...data, id: docRef.id, order: maxOrder },
                ]);
                setStatusMessage({
                    type: 'success',
                    message: 'Nouvelle expertise ajoutée avec succès',
                });
            }

            setEditingExpertise(null);
            reset({
                title: '',
                description: '',
                backgroundImage: '',
                href: '',
                icon: '',
            });
            setPreviewImage(null);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage({ type: 'success', message: 'Chargement de l&apos;image...' });

            // Créer un objet URL pour la prévisualisation locale
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);

            // Créer un FormData pour l'upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'home/expertises');

            // Faire une requête fetch à notre API locale pour sauvegarder le fichier
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement de l&apos;image');
            }

            const data = await response.json();

            // Mettre à jour le formulaire avec l'URL
            setValue('backgroundImage', data.fileUrl, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });

            // Mettre à jour le message de statut pour confirmer que l'image est chargée
            setStatusMessage({ type: 'success', message: 'Image téléchargée avec succès' });
        } catch (error) {
            console.error('Erreur lors du téléchargement de l&apos;image:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors du téléchargement de l&apos;image',
            });
        }
    };

    const handleEditExpertise = (expertise: Expertise) => {
        setEditingExpertise(expertise);
        reset(expertise);
        setPreviewImage(expertise.backgroundImage);

        // Faire défiler la page jusqu'au formulaire
        setTimeout(() => {
            const formElement = document.querySelector('form');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const handleDeleteExpertise = async (expertise: Expertise) => {
        if (!expertise.id) return;

        if (
            window.confirm(
                `Êtes-vous sûr de vouloir supprimer l&apos;expertise "${expertise.title}" ?`,
            )
        ) {
            try {
                // Supprimer l&apos;expertise de Firestore
                await deleteDoc(doc(db, 'expertises', expertise.id));

                // Supprimer l&apos;image d&apos;arrière-plan si elle existe
                if (expertise.backgroundImage) {
                    // Extraire le nom du fichier à partir de l&apos;URL
                    const fileName = expertise.backgroundImage.split('/').pop();
                    const filePath = expertise.backgroundImage.substring(
                        1,
                        expertise.backgroundImage.lastIndexOf('/'),
                    );

                    if (fileName) {
                        try {
                            const response = await fetch(
                                `/api/delete?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`,
                                {
                                    method: 'DELETE',
                                },
                            );

                            if (!response.ok) {
                                console.error(
                                    'Erreur lors de la suppression de l&apos;image:',
                                    await response.text(),
                                );
                            }
                        } catch (imageError) {
                            console.error(
                                'Erreur lors de la suppression de l&apos;image:',
                                imageError,
                            );
                        }
                    }
                }

                setExpertises((prevExpertises) =>
                    prevExpertises.filter((exp) => exp.id !== expertise.id),
                );
                setStatusMessage({ type: 'success', message: 'Expertise supprimée avec succès' });

                // Si l&apos;expertise en cours d&apos;édition est supprimée, réinitialiser le formulaire
                if (editingExpertise?.id === expertise.id) {
                    setEditingExpertise(null);
                    reset();
                    setPreviewImage(null);
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                setStatusMessage({ type: 'error', message: 'Erreur lors de la suppression' });
            }
        }
    };

    const cancelEdit = () => {
        setEditingExpertise(null);
        reset({
            title: '',
            description: '',
            backgroundImage: '',
            href: '',
            icon: '',
        });
        setPreviewImage(null);
        setStatusMessage(null);
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Gestion des Expertises</h2>
                    <div className="flex space-x-2">
                        {editingExpertise && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Nouvelle expertise
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setPreviewMode(!previewMode)}
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
                        >
                            {previewMode ? 'Mode Édition' : 'Mode Prévisualisation'}
                        </button>
                    </div>
                </div>

                {statusMessage && (
                    <div
                        className={`p-4 mb-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                    >
                        {statusMessage.message}
                    </div>
                )}

                {previewMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {expertises.map((expertise) => (
                            <ExpertiseCard
                                key={expertise.id}
                                title={expertise.title}
                                description={expertise.description}
                                icon={getIconFromName(expertise.icon)}
                                backgroundImage={expertise.backgroundImage}
                                href={expertise.href}
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-8">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                {editingExpertise
                                    ? `Modifier: ${editingExpertise.title}`
                                    : 'Ajouter une nouvelle expertise'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Titre
                                        </label>
                                        <input
                                            type="text"
                                            {...register('title', {
                                                required: 'Le titre est requis',
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errors.title && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.title.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            {...register('description', {
                                                required: 'La description est requise',
                                            })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.description.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lien (href)
                                        </label>
                                        <input
                                            type="text"
                                            {...register('href', {
                                                required: 'Le lien est requis',
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errors.href && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.href.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Type d&apos;icône
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                                            value={
                                                watchedValues.icon &&
                                                [
                                                    'video',
                                                    'photo',
                                                    'social',
                                                    'branding',
                                                    'web',
                                                ].includes(watchedValues.icon)
                                                    ? watchedValues.icon
                                                    : ''
                                            }
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setValue('icon', e.target.value, {
                                                        shouldValidate: true,
                                                    });
                                                }
                                            }}
                                        >
                                            <option value="">
                                                Sélectionnez un type d&apos;icône prédéfini
                                            </option>
                                            <option value="video">Vidéo</option>
                                            <option value="photo">Photo</option>
                                            <option value="social">Réseaux Sociaux</option>
                                            <option value="branding">Branding</option>
                                            <option value="web">Création Web</option>
                                        </select>

                                        <textarea
                                            {...register('icon', {
                                                required: 'L&apos;icône est requise',
                                                validate: (value) => {
                                                    // Si la valeur est l'un des types prédéfinis, c'est valide
                                                    if (
                                                        [
                                                            'video',
                                                            'photo',
                                                            'social',
                                                            'branding',
                                                            'web',
                                                        ].includes(value)
                                                    ) {
                                                        return true;
                                                    }
                                                    // Sinon, vérifier si c'est un SVG valide
                                                    return (
                                                        value.includes('<svg') ||
                                                        'Le code SVG doit contenir une balise <svg>'
                                                    );
                                                },
                                            })}
                                            rows={6}
                                            placeholder="Ou collez ici le code SVG personnalisé de l'icône"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                                        />
                                        {errors.icon && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.icon.message}
                                            </p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                            Vous pouvez choisir un type prédéfini dans la liste ou
                                            coller un code SVG personnalisé ci-dessous
                                        </p>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Prévisualisation de l&apos;icône
                                            </label>
                                            <div className="w-16 h-16 bg-gradient-to-br from-white to-blue-100 rounded-lg flex items-center justify-center">
                                                {watchedValues.icon &&
                                                    getIconFromName(watchedValues.icon)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Image d&apos;arrière-plan
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                {...register('backgroundImage', {
                                                    required:
                                                        'L&apos;URL de l&apos;image est requise',
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="URL de l'image"
                                            />
                                            <label className="px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300">
                                                Parcourir
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                        </div>
                                        {errors.backgroundImage && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.backgroundImage.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                            Prévisualisation de la carte
                                        </h4>
                                        <div className="h-[280px] w-full">
                                            {watchedValues.title &&
                                                watchedValues.description &&
                                                watchedValues.icon &&
                                                previewImage && (
                                                    <ExpertiseCard
                                                        title={watchedValues.title}
                                                        description={watchedValues.description}
                                                        icon={getIconFromName(watchedValues.icon)}
                                                        backgroundImage={previewImage}
                                                        href={watchedValues.href || '#'}
                                                    />
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                {editingExpertise && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Spinner small white />
                                    ) : editingExpertise ? (
                                        'Mettre à jour'
                                    ) : (
                                        'Ajouter'
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                                Expertises existantes
                            </h3>
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner />
                                </div>
                            ) : (
                                <div className="overflow-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Ordre
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Titre
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Description
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Image
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {expertises
                                                .sort((a, b) => (a.order || 0) - (b.order || 0)) // Trier par ordre
                                                .map((expertise) => (
                                                    <tr key={expertise.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col items-center">
                                                                <button
                                                                    onClick={() =>
                                                                        handleReorder(
                                                                            expertise.id,
                                                                            'up',
                                                                        )
                                                                    }
                                                                    disabled={expertise.order === 0}
                                                                    className={`text-gray-500 hover:text-gray-700 mb-1 ${
                                                                        expertise.order === 0
                                                                            ? 'opacity-30 cursor-not-allowed'
                                                                            : ''
                                                                    }`}
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
                                                                            d="M5 15l7-7 7 7"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                                <span className="text-sm font-medium">
                                                                    {expertise.order !== undefined
                                                                        ? expertise.order
                                                                        : '?'}
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        handleReorder(
                                                                            expertise.id,
                                                                            'down',
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        expertise.order ===
                                                                        expertises.length - 1
                                                                    }
                                                                    className={`text-gray-500 hover:text-gray-700 mt-1 ${
                                                                        expertise.order ===
                                                                        expertises.length - 1
                                                                            ? 'opacity-30 cursor-not-allowed'
                                                                            : ''
                                                                    }`}
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
                                                                            d="M19 9l-7 7-7-7"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {expertise.title}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="max-w-xs truncate">
                                                                {expertise.description}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="h-10 w-10 relative overflow-hidden rounded">
                                                                <Image
                                                                    src={getMediaUrl(
                                                                        expertise.backgroundImage,
                                                                    )}
                                                                    alt={expertise.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleEditExpertise(expertise)
                                                                }
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                Modifier
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteExpertise(expertise)
                                                                }
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Supprimer
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
