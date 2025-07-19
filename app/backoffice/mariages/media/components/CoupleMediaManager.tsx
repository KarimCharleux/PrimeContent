'use client';

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
import {
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
} from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { getMediaUrl } from '../../../../utils/mediaUrl';
import { uploadFileWithUUID } from '../../../../utils/uploadUtils';
import { Spinner } from '../../../components/Spinner';
import { db } from '../../../lib/firebase-client';

interface CoupleMedia {
    id?: string;
    coupleId: string;
    type: 'photo' | 'video';
    url: string;
    filename: string;
    alt?: string;
    title?: string;
    description?: string;
    category?: string;
    order?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

interface CoupleMediaManagerProps {
    coupleId: string;
    coupleName: string;
    onStatusChange: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

// Composant pour un élément média triable
function SortableMediaItem({
    media,
    onEdit,
    onDelete,
}: {
    media: CoupleMedia;
    onEdit: (media: CoupleMedia) => void;
    onDelete: (media: CoupleMedia) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: media.id!,
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
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                    {media.type === 'photo' ? (
                        <Image
                            src={getMediaUrl(media.url)}
                            alt={media.alt || media.filename}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="relative w-full h-full">
                            <video
                                src={getMediaUrl(media.url)}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                                <svg
                                    className="w-12 h-12 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M8 5v10l8-5-8-5z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h4 className="font-medium text-gray-900 truncate">
                            {media.title || media.filename}
                        </h4>
                        <p className="text-sm text-gray-500">
                            {media.type === 'photo' ? 'Photo' : 'Vidéo'}
                        </p>
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
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(media)}
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
                        onClick={() => onDelete(media)}
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

export default function CoupleMediaManager({
    coupleId,
    coupleName,
    onStatusChange,
}: CoupleMediaManagerProps) {
    const [medias, setMedias] = useState<CoupleMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState<CoupleMedia | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Configuration pour le drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Formulaire React Hook Form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CoupleMedia>();

    const watchedFields = watch();

    // Chargement des médias depuis Firebase
    useEffect(() => {
        const fetchMedias = async () => {
            try {
                setLoading(true);
                const mediasCollection = collection(db, 'coupleMedias');
                const q = query(mediasCollection, where('coupleId', '==', coupleId));
                const mediasSnapshot = await getDocs(q);

                if (!mediasSnapshot.empty) {
                    const fetchedMedias = mediasSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as CoupleMedia[];

                    const sortedMedias = [...fetchedMedias].sort(
                        (a, b) => (a.order || 0) - (b.order || 0),
                    );
                    setMedias(sortedMedias);
                } else {
                    setMedias([]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des médias:', error);
                onStatusChange({ type: 'error', message: 'Impossible de charger les médias' });
                setMedias([]);
                setLoading(false);
            }
        };

        fetchMedias();
    }, [coupleId, onStatusChange]);

    // Fonction pour supprimer un fichier du serveur
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

    // Fonction pour gérer l'upload de média
    const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);

            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            const uploadResult = await uploadFileWithUUID(file, `mariages/${coupleId}`, (message) =>
                onStatusChange({ type: 'success', message }),
            );

            const fileType = file.type.startsWith('video/') ? 'video' : 'photo';

            setValue('url', uploadResult.fileUrl);
            setValue('filename', uploadResult.filename);
            setValue('type', fileType);
            // Ne pas remplir automatiquement le titre - laisser vide par défaut

            onStatusChange({ type: 'success', message: 'Média téléchargé avec succès' });
        } catch (error) {
            console.error('Erreur lors du téléchargement du média:', error);
            onStatusChange({
                type: 'error',
                message: 'Erreur lors du téléchargement du média',
            });
        } finally {
            setUploading(false);
        }
    };

    // Soumission du formulaire
    const onSubmit = async (data: CoupleMedia) => {
        try {
            if (editing?.id) {
                await updateDoc(doc(db, 'coupleMedias', editing.id), {
                    ...data,
                    coupleId,
                    updatedAt: new Date(),
                });

                setMedias((prev) =>
                    prev.map((media) =>
                        media.id === editing.id
                            ? { ...data, id: media.id, coupleId, order: media.order }
                            : media,
                    ),
                );
                onStatusChange({ type: 'success', message: 'Média mis à jour avec succès' });
            } else {
                const maxOrder =
                    medias.length > 0
                        ? Math.max(...medias.map((media) => media.order || 0)) + 1
                        : 0;

                const docRef = await addDoc(collection(db, 'coupleMedias'), {
                    ...data,
                    coupleId,
                    order: maxOrder,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                setMedias((prev) => [
                    ...prev,
                    { ...data, id: docRef.id, coupleId, order: maxOrder },
                ]);
                onStatusChange({ type: 'success', message: 'Nouveau média ajouté avec succès' });
            }

            reset();
            setEditing(null);
            setPreviewUrl(null);
            setShowForm(false);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            onStatusChange({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        }
    };

    // Gestion de l'édition
    const handleEdit = (media: CoupleMedia) => {
        setEditing(media);
        reset(media);
        setPreviewUrl(media.url);
        setShowForm(true);
    };

    // Suppression d'un média
    const handleDelete = async (media: CoupleMedia) => {
        if (!media.id) return;

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce média ?`)) {
            try {
                await deleteDoc(doc(db, 'coupleMedias', media.id));

                if (media.url) {
                    await deleteMediaFile(media.url);
                }

                setMedias((prev) => prev.filter((m) => m.id !== media.id));
                onStatusChange({ type: 'success', message: 'Média supprimé avec succès' });

                if (editing?.id === media.id) {
                    setEditing(null);
                    reset();
                    setPreviewUrl(null);
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                onStatusChange({ type: 'error', message: 'Erreur lors de la suppression' });
            }
        }
    };

    // Gérer la fin du drag and drop
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = medias.findIndex((media) => media.id === active.id);
            const newIndex = medias.findIndex((media) => media.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newMedias = arrayMove(medias, oldIndex, newIndex);

                // Mettre à jour les ordres
                newMedias.forEach((media, idx) => {
                    media.order = idx;
                });

                setMedias(newMedias);

                // Sauvegarder en base
                try {
                    await Promise.all(
                        newMedias.map((media) =>
                            updateDoc(doc(db, 'coupleMedias', media.id!), { order: media.order }),
                        ),
                    );
                } catch (error) {
                    console.error('Erreur lors de la réorganisation des médias:', error);
                    onStatusChange({
                        type: 'error',
                        message: 'Erreur lors de la réorganisation des médias',
                    });
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Bouton d'ajout */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                    Médias du couple ({medias.length})
                </h3>
                <button
                    onClick={() => {
                        setEditing(null);
                        reset();
                        setPreviewUrl(null);
                        setShowForm(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
                    <span>Ajouter un média</span>
                </button>
            </div>

            {/* Formulaire de média */}
            {showForm && (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="bg-white rounded-lg shadow border border-gray-200 p-6"
                >
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                        {editing ? 'Modifier le média' : 'Ajouter un nouveau média'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fichier média
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        {...register('url', { required: 'Le fichier est requis' })}
                                        className="hidden"
                                    />
                                    <label className="w-full px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300 text-center border border-gray-300">
                                        {uploading ? (
                                            <Spinner small />
                                        ) : previewUrl ? (
                                            'Changer le fichier'
                                        ) : (
                                            'Choisir un fichier (photo ou vidéo)'
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,video/*"
                                            onChange={handleMediaUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                {errors.url && (
                                    <p className="mt-1 text-sm text-red-600">
                                        Un fichier est requis
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titre (optionnel)
                                </label>
                                <input
                                    type="text"
                                    {...register('title')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Titre personnalisé pour ce média"
                                />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Prévisualisation
                            </h4>
                            <div className="h-64 w-full flex items-center justify-center bg-gray-100 rounded-md overflow-hidden relative">
                                {previewUrl ? (
                                    watchedFields.type === 'video' ? (
                                        <video
                                            src={getMediaUrl(previewUrl)}
                                            className="w-full h-full object-cover"
                                            controls
                                        />
                                    ) : (
                                        <Image
                                            src={getMediaUrl(previewUrl)}
                                            alt="Prévisualisation"
                                            fill
                                            className="object-cover"
                                        />
                                    )
                                ) : (
                                    <p className="text-gray-400">Aucun média sélectionné</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(null);
                                reset();
                                setPreviewUrl(null);
                                setShowForm(false);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {editing ? 'Mettre à jour' : 'Ajouter'}
                        </button>
                    </div>
                </form>
            )}

            {/* Liste des médias */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            ) : medias.length === 0 ? (
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
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun média</h3>
                    <p className="text-gray-500 mb-4">
                        Commencez par ajouter des photos ou vidéos pour ce couple
                    </p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={medias.map((media) => media.id!)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {medias.map((media) => (
                                <SortableMediaItem
                                    key={media.id}
                                    media={media}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}
