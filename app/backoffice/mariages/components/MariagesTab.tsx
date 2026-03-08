'use client';

// Imports pour drag and drop
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { uploadFileWithUUID } from '../../../utils/uploadUtils';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';
import { type Couple } from '../../models/types';

// Composant pour une carte de couple triable
function SortableCoupleCard({
    couple,
    onEdit,
    onDelete,
    onManageMedia,
}: {
    couple: Couple;
    onEdit: (couple: Couple) => void;
    onDelete: (couple: Couple) => void;
    onManageMedia: (couple: Couple) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: couple.id!,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-medium text-gray-900">
                            {couple.person1Name} & {couple.person2Name}
                        </h4>
                        {couple.password && (
                            <span className="inline-block mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                🔒 Protégé
                            </span>
                        )}
                    </div>
                    <button
                        {...attributes}
                        {...listeners}
                        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing text-lg"
                        title="Glisser pour réorganiser"
                    >
                        ☰
                    </button>
                </div>

                {/* Photos du couple */}
                <div className="flex items-center justify-center mb-4 space-x-4">
                    <div className="flex flex-col items-center">
                        <div className="relative w-16 h-16 mb-2">
                            <Image
                                src={getMediaUrl(couple.person1Image)}
                                alt={couple.person1Name}
                                fill
                                className="object-cover rounded-full"
                            />
                        </div>
                        <p className="text-sm text-gray-600">{couple.person1Name}</p>
                    </div>

                    <div className="flex items-center">
                        <svg
                            className="w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="relative w-16 h-16 mb-2">
                            <Image
                                src={getMediaUrl(couple.person2Image)}
                                alt={couple.person2Name}
                                fill
                                className="object-cover rounded-full"
                            />
                        </div>
                        <p className="text-sm text-gray-600">{couple.person2Name}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onManageMedia(couple)}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                        📁 Médias
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(couple)}
                        className="px-3 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                        title="Modifier"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(couple)}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                        title="Supprimer"
                    >
                        <svg
                            className="h-4 w-4"
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
            </div>
        </div>
    );
}

export default function MariagesTab() {
    const router = useRouter();

    // États pour les couples
    const [couples, setCouples] = useState<Couple[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<Couple | null>(null);
    const [previewPerson1Image, setPreviewPerson1Image] = useState<string | null>(null);
    const [previewPerson2Image, setPreviewPerson2Image] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // État pour les messages de statut
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // Configuration pour le drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // État de visibilité du formulaire
    const [showForm, setShowForm] = useState(false);

    // Formulaire React Hook Form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<Couple>();

    // Chargement des données depuis Firebase
    useEffect(() => {
        const fetchCouples = async () => {
            try {
                setLoading(true);
                const couplesCollection = collection(db, 'couples');
                const couplesSnapshot = await getDocs(couplesCollection);

                if (!couplesSnapshot.empty) {
                    const fetchedCouples = couplesSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Couple[];

                    const sortedCouples = [...fetchedCouples].sort(
                        (a, b) => (a.order || 0) - (b.order || 0),
                    );
                    setCouples(sortedCouples);
                } else {
                    setCouples([]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des couples:', error);
                setStatusMessage({ type: 'error', message: 'Impossible de charger les couples' });
                setCouples([]);
                setLoading(false);
            }
        };

        fetchCouples();
    }, []);

    // Fonction pour gérer la navigation vers la gestion des médias
    const handleManageMedia = (couple: Couple) => {
        const coupleName = `${couple.person1Name}-${couple.person2Name}`
            .toLowerCase()
            .replace(/\s+/g, '-');
        router.push(`/backoffice/mariages/media?name=${coupleName}&id=${couple.id}`);
    };

    // Fonction pour supprimer un fichier média
    const deleteMediaFile = async (fileUrl: string) => {
        if (!fileUrl) return;

        try {
            const fileName = fileUrl.split('/').pop();
            const filePath = fileUrl.substring(1, fileUrl.lastIndexOf('/'));

            if (fileName) {
                const response = await fetch(
                    `/api/delete?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`,
                    {
                        method: 'DELETE',
                    },
                );

                if (!response.ok) {
                    console.error(
                        'Erreur lors de la suppression du fichier:',
                        await response.text(),
                    );
                    return false;
                }
                return true;
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du fichier:', error);
            return false;
        }
        return false;
    };

    // Fonction pour gérer l'upload d'image pour la personne 1
    const handlePerson1ImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const objectUrl = URL.createObjectURL(file);
            setPreviewPerson1Image(objectUrl);

            if (editing?.id && editing.person1Image && editing.person1Image !== '') {
                await deleteMediaFile(editing.person1Image);
            }

            const uploadResult = await uploadFileWithUUID(file, 'mariages', (message) =>
                setStatusMessage({ type: 'success', message }),
            );

            setValue('person1Image', uploadResult.fileUrl, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });

            setStatusMessage({ type: 'success', message: 'Image téléchargée avec succès' });
        } catch (error) {
            console.error("Erreur lors du téléchargement de l'image:", error);
            setStatusMessage({
                type: 'error',
                message: "Erreur lors du téléchargement de l'image",
            });
        }
    };

    // Fonction pour gérer l'upload d'image pour la personne 2
    const handlePerson2ImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const objectUrl = URL.createObjectURL(file);
            setPreviewPerson2Image(objectUrl);

            if (editing?.id && editing.person2Image && editing.person2Image !== '') {
                await deleteMediaFile(editing.person2Image);
            }

            const uploadResult = await uploadFileWithUUID(file, 'mariages', (message) =>
                setStatusMessage({ type: 'success', message }),
            );

            setValue('person2Image', uploadResult.fileUrl, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });

            setStatusMessage({ type: 'success', message: 'Image téléchargée avec succès' });
        } catch (error) {
            console.error("Erreur lors du téléchargement de l'image:", error);
            setStatusMessage({
                type: 'error',
                message: "Erreur lors du téléchargement de l'image",
            });
        }
    };

    // Soumission du formulaire de couple
    const onSubmit = async (data: Couple) => {
        setSaving(true);
        try {
            if (editing?.id) {
                await updateDoc(doc(db, 'couples', editing.id), {
                    person1Name: data.person1Name,
                    person2Name: data.person2Name,
                    person1Image: data.person1Image,
                    person2Image: data.person2Image,
                    coupleDisplayName: `${data.person1Name} & ${data.person2Name}`,
                    order: editing.order || 0,
                    password: data.password || '',
                    updatedAt: new Date(),
                });

                setCouples((prevCouples) =>
                    prevCouples.map((couple) =>
                        couple.id === editing.id
                            ? {
                                  ...data,
                                  id: couple.id,
                                  order: couple.order,
                                  coupleDisplayName: `${data.person1Name} & ${data.person2Name}`,
                              }
                            : couple,
                    ),
                );
                setStatusMessage({ type: 'success', message: 'Couple mis à jour avec succès' });
            } else {
                const maxOrder =
                    couples.length > 0
                        ? Math.max(...couples.map((couple) => couple.order || 0)) + 1
                        : 0;

                const docRef = await addDoc(collection(db, 'couples'), {
                    person1Name: data.person1Name,
                    person2Name: data.person2Name,
                    person1Image: data.person1Image,
                    person2Image: data.person2Image,
                    coupleDisplayName: `${data.person1Name} & ${data.person2Name}`,
                    order: maxOrder,
                    password: data.password || '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                setCouples((prevCouples) => [
                    ...prevCouples,
                    {
                        ...data,
                        id: docRef.id,
                        order: maxOrder,
                        coupleDisplayName: `${data.person1Name} & ${data.person2Name}`,
                    },
                ]);
                setStatusMessage({
                    type: 'success',
                    message: 'Nouveau couple ajouté avec succès',
                });
            }

            reset({
                person1Name: '',
                person2Name: '',
                person1Image: '',
                person2Image: '',
                password: '',
            });
            setEditing(null);
            setPreviewPerson1Image(null);
            setPreviewPerson2Image(null);
            setShowForm(false);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        } finally {
            setSaving(false);
        }
    };

    // Gestion de l'édition d'un couple
    const handleEdit = (couple: Couple) => {
        setEditing(couple);
        reset(couple);
        setPreviewPerson1Image(couple.person1Image);
        setPreviewPerson2Image(couple.person2Image);
        setShowForm(true);
    };

    // Suppression d'un couple
    const handleDelete = async (couple: Couple) => {
        if (!couple.id) return;

        if (
            window.confirm(
                `Êtes-vous sûr de vouloir supprimer le couple "${couple.person1Name} & ${couple.person2Name}" ?`,
            )
        ) {
            try {
                await deleteDoc(doc(db, 'couples', couple.id));

                const imagesToDelete = [
                    { url: couple.person1Image, type: 'Photo personne 1' },
                    { url: couple.person2Image, type: 'Photo personne 2' },
                ];

                for (const image of imagesToDelete) {
                    if (image.url) {
                        await deleteMediaFile(image.url);
                    }
                }

                setCouples((prevCouples) => prevCouples.filter((c) => c.id !== couple.id));
                setStatusMessage({ type: 'success', message: 'Couple supprimé avec succès' });

                if (editing?.id === couple.id) {
                    setEditing(null);
                    reset();
                    setPreviewPerson1Image(null);
                    setPreviewPerson2Image(null);
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                setStatusMessage({ type: 'error', message: 'Erreur lors de la suppression' });
            }
        }
    };

    // Annuler l'édition
    const cancelEdit = () => {
        setEditing(null);
        reset({
            person1Name: '',
            person2Name: '',
            person1Image: '',
            person2Image: '',
            password: '',
        });
        setPreviewPerson1Image(null);
        setPreviewPerson2Image(null);
    };

    // Gérer la fin du drag and drop
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = couples.findIndex((couple) => couple.id === active.id);
            const newIndex = couples.findIndex((couple) => couple.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newCouples = arrayMove(couples, oldIndex, newIndex);

                // Mettre à jour les ordres
                newCouples.forEach((couple, idx) => {
                    couple.order = idx;
                });

                setCouples(newCouples);

                // Sauvegarder en base
                try {
                    await Promise.all(
                        newCouples.map((couple) =>
                            updateDoc(doc(db, 'couples', couple.id!), { order: couple.order }),
                        ),
                    );
                } catch (error) {
                    console.error('Erreur lors de la réorganisation des couples:', error);
                    setStatusMessage({
                        type: 'error',
                        message: 'Erreur lors de la réorganisation des couples',
                    });
                }
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                {statusMessage && (
                    <div
                        className={`p-4 mb-4 rounded-md ${
                            statusMessage.type === 'success'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                        }`}
                    >
                        {statusMessage.message}
                    </div>
                )}

                {/* Formulaire de couple */}
                {(showForm || editing) && (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8"
                    >
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                            {editing
                                ? `Modifier: ${editing.person1Name} & ${editing.person2Name}`
                                : 'Ajouter un nouveau couple'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personne 1 */}
                            <div>
                                <h4 className="text-md font-medium text-gray-800 mb-4">
                                    Personne 1
                                </h4>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        {...register('person1Name', {
                                            required: 'Le prénom est requis',
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {errors.person1Name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.person1Name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Photo de profil
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            {...register('person1Image', {
                                                required: "L'image est requise",
                                            })}
                                            className="hidden"
                                        />
                                        <label className="w-full px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300 text-center border border-gray-300">
                                            {previewPerson1Image
                                                ? 'Changer la photo'
                                                : 'Choisir une photo'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handlePerson1ImageUpload}
                                            />
                                        </label>
                                    </div>
                                    {errors.person1Image && (
                                        <p className="mt-1 text-sm text-red-600">
                                            Une photo est requise
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Prévisualisation
                                    </h4>
                                    <div className="h-40 w-full flex items-center justify-center bg-gray-100 rounded-md">
                                        {previewPerson1Image ? (
                                            <div className="relative h-32 w-32">
                                                <Image
                                                    src={getMediaUrl(previewPerson1Image)}
                                                    alt="Prévisualisation"
                                                    fill
                                                    className="object-cover rounded-full"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-gray-400">
                                                Aucune image sélectionnée
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Personne 2 */}
                            <div>
                                <h4 className="text-md font-medium text-gray-800 mb-4">
                                    Personne 2
                                </h4>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        {...register('person2Name', {
                                            required: 'Le prénom est requis',
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {errors.person2Name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.person2Name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Photo de profil
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            {...register('person2Image', {
                                                required: "L'image est requise",
                                            })}
                                            className="hidden"
                                        />
                                        <label className="w-full px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300 text-center border border-gray-300">
                                            {previewPerson2Image
                                                ? 'Changer la photo'
                                                : 'Choisir une photo'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handlePerson2ImageUpload}
                                            />
                                        </label>
                                    </div>
                                    {errors.person2Image && (
                                        <p className="mt-1 text-sm text-red-600">
                                            Une photo est requise
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Prévisualisation
                                    </h4>
                                    <div className="h-40 w-full flex items-center justify-center bg-gray-100 rounded-md">
                                        {previewPerson2Image ? (
                                            <div className="relative h-32 w-32">
                                                <Image
                                                    src={getMediaUrl(previewPerson2Image)}
                                                    alt="Prévisualisation"
                                                    fill
                                                    className="object-cover rounded-full"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-gray-400">
                                                Aucune image sélectionnée
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mot de passe optionnel */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="text-md font-medium text-gray-800 mb-4">
                                Protection par mot de passe{' '}
                                <span className="text-sm font-normal text-gray-500">
                                    (optionnel)
                                </span>
                            </h4>
                            <div className="max-w-sm">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password')}
                                        placeholder="Laisser vide = accès libre"
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Si renseigné, le couple devra saisir ce mot de passe pour
                                    accéder à ses photos privées.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            {editing && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        cancelEdit();
                                        setShowForm(false);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Annuler
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors disabled:opacity-50 mt-6"
                            >
                                {saving ? (
                                    <Spinner small white />
                                ) : editing ? (
                                    'Mettre à jour'
                                ) : (
                                    'Ajouter'
                                )}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900">
                            Couples existants ({couples.length})
                        </h3>
                        <button
                            onClick={() => {
                                setEditing(null);
                                reset();
                                setPreviewPerson1Image(null);
                                setPreviewPerson2Image(null);
                                setShowForm(true);
                            }}
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors flex items-center space-x-2"
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
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            <span>Nouveau couple</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Spinner />
                        </div>
                    ) : couples.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <div className="text-gray-400 mb-4">
                                <svg
                                    className="mx-auto h-12 w-12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun couple</h3>
                            <p className="text-gray-500 mb-4">
                                Commencez par ajouter votre premier couple
                            </p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={couples.map((couple) => couple.id!)}
                                strategy={rectSortingStrategy}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {couples.map((couple) => (
                                        <SortableCoupleCard
                                            key={couple.id}
                                            couple={couple}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onManageMedia={handleManageMedia}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
}
