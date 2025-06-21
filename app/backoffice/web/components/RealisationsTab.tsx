'use client';

import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { db } from '../../lib/firebase-client';

interface Realisation {
    id: string;
    date: string;
    title: string;
    category: string;
    description: string;
    image: string;
    order: number;
}

interface RealisationForm {
    date: string;
    title: string;
    category: string;
    description: string;
    image: string;
}

function SortableItem({
    realisation,
    onEdit,
    onDelete,
}: {
    realisation: Realisation;
    onEdit: (realisation: Realisation) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: realisation.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white border border-gray-200 rounded-lg p-4 mb-4"
        >
            <div className="flex items-start justify-between">
                <div className="flex flex-1 space-x-4">
                    <div className="flex-shrink-0">
                        <Image
                            src={getMediaUrl(realisation.image)}
                            alt={realisation.title}
                            width={120}
                            height={80}
                            className="rounded-lg object-cover"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-3">
                                {realisation.date}
                            </span>
                            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                                {realisation.category}
                            </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{realisation.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                            {realisation.description}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                    <button
                        {...attributes}
                        {...listeners}
                        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                        title="Glisser pour réorganiser"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onEdit(realisation)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifier"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(realisation.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RealisationsTab() {
    const [realisations, setRealisations] = useState<Realisation[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRealisation, setEditingRealisation] = useState<Realisation | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RealisationForm>();

    const watchedImage = watch('image');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => {
        fetchRealisations();
    }, []);

    const fetchRealisations = async () => {
        try {
            const realisationsCollection = collection(db, 'web-realisations');
            const realisationsSnapshot = await getDocs(realisationsCollection);
            const realisationsData = realisationsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Realisation[];

            realisationsData.sort((a, b) => a.order - b.order);
            setRealisations(realisationsData);
        } catch (error) {
            console.error('Erreur lors de la récupération des réalisations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setValue('image', data.path);
            } else {
                alert('Erreur lors de l&apos;upload de l&apos;image');
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            alert('Erreur lors de l&apos;upload de l&apos;image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = realisations.findIndex((realisation) => realisation.id === active.id);
            const newIndex = realisations.findIndex((realisation) => realisation.id === over?.id);

            const newRealisations = arrayMove(realisations, oldIndex, newIndex);
            setRealisations(newRealisations);

            // Mettre à jour l'ordre dans Firebase
            try {
                const updatePromises = newRealisations.map((realisation, index) =>
                    updateDoc(doc(db, 'web-realisations', realisation.id), { order: index + 1 }),
                );
                await Promise.all(updatePromises);
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l&apos;ordre:', error);
                fetchRealisations(); // Recharger en cas d'erreur
            }
        }
    };

    const onSubmit = async (data: RealisationForm) => {
        try {
            if (editingRealisation) {
                // Modification
                await updateDoc(doc(db, 'web-realisations', editingRealisation.id), data as any);
            } else {
                // Ajout
                const newOrder = realisations.length + 1;
                await addDoc(collection(db, 'web-realisations'), {
                    ...data,
                    order: newOrder,
                } as any);
            }

            reset();
            setEditingRealisation(null);
            setShowForm(false);
            fetchRealisations();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde');
        }
    };

    const handleEdit = (realisation: Realisation) => {
        setEditingRealisation(realisation);
        reset({
            date: realisation.date,
            title: realisation.title,
            category: realisation.category,
            description: realisation.description,
            image: realisation.image,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette réalisation ?')) {
            try {
                await deleteDoc(doc(db, 'web-realisations', id));
                fetchRealisations();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    const handleCancel = () => {
        reset();
        setEditingRealisation(null);
        setShowForm(false);
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Réalisations</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Ajouter une réalisation
                </button>
            </div>

            {/* Formulaire */}
            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-4">
                        {/* eslint-disable-next-line react/no-unescaped-entities */}
                        {editingRealisation ? 'Modifier la réalisation' : 'Nouvelle réalisation'}
                    </h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date
                                </label>
                                <input
                                    type="text"
                                    {...register('date', { required: 'La date est requise' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Jan 2025"
                                />
                                {errors.date && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.date.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catégorie
                                </label>
                                <input
                                    type="text"
                                    {...register('category', {
                                        required: 'La catégorie est requise',
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Finance, E-commerce, etc."
                                />
                                {errors.category && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.category.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Titre
                            </label>
                            <input
                                type="text"
                                {...register('title', { required: 'Le titre est requis' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Titre de la réalisation"
                            />
                            {errors.title && (
                                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                {...register('description', {
                                    required: 'La description est requise',
                                })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Description de la réalisation"
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Image
                            </label>

                            {watchedImage && (
                                <div className="mb-4">
                                    <Image
                                        src={getMediaUrl(watchedImage)}
                                        alt="Aperçu de l'image"
                                        width={200}
                                        height={150}
                                        className="rounded-lg object-cover"
                                    />
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {uploadingImage && (
                                <p className="text-blue-500 text-sm mt-1">Upload en cours...</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {editingRealisation ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Liste des réalisations */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={realisations.map((realisation) => realisation.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div>
                        {realisations.map((realisation) => (
                            <SortableItem
                                key={realisation.id}
                                realisation={realisation}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {realisations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                    Aucune réalisation configurée. Cliquez sur "Ajouter une réalisation" pour
                    commencer.
                </div>
            )}
        </div>
    );
}
