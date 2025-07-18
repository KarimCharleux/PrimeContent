'use client';

// Imports pour drag and drop
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
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    updateDoc,
} from 'firebase/firestore';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import CustomerReviews, { Review } from '../../../components/CustomerReviews';
import { getMediaUrl } from '../../../utils/mediaUrl';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

// Étendre l'interface Review pour inclure l'id pour l'administration
interface AdminReview extends Review {
    id?: string;
}

// Composant pour les lignes triables
interface SortableRowProps {
    review: AdminReview;
    onEdit: (review: AdminReview) => void;
    onDelete: (reviewId: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ review, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: review.id!,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <tr ref={setNodeRef} style={style} className={isDragging ? 'shadow-lg' : ''}>
            <td className="px-3 py-4 whitespace-nowrap text-center w-16">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Glisser pour réorganiser"
                >
                    ☰
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {review.imageSrc && (
                    <div className="w-12 h-12 rounded-full overflow-hidden relative">
                        <Image
                            src={getMediaUrl(review.imageSrc)}
                            alt={review.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{review.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{review.role}</td>
            <td className="px-6 py-4 whitespace-nowrap">{review.company}</td>
            <td className="px-6 py-4">
                <div className="max-w-xs truncate">{review.text}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(review)}
                        className="text-indigo-600 hover:text-indigo-900"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-12 12a2 2 0 01-2.828 0 2 2 0 010-2.828l12-12z" />
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-12 12a2 2 0 01-2.828 0 2 2 0 010-2.828l12-12z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(review.id!)}
                        className="text-red-600 hover:text-red-900"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default function HomeTabReviews() {
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingReview, setEditingReview] = useState<AdminReview | null>(null);
    const [formData, setFormData] = useState<AdminReview>({
        name: '',
        role: '',
        company: '',
        text: '',
        imageSrc: '',
        order: 0,
    });
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Configuration des capteurs pour le drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Fonction pour gérer la fin du drag and drop
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!active || !over || active.id === over.id) {
            return;
        }

        const oldIndex = reviews.findIndex((review) => review.id === active.id);
        const newIndex = reviews.findIndex((review) => review.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Réorganiser localement
        const newReviews = arrayMove(reviews, oldIndex, newIndex);

        // Mettre à jour les ordres
        const updatedReviews = newReviews.map((review, index) => ({
            ...review,
            order: index,
        }));

        setReviews(updatedReviews);

        // Sauvegarder en base de données
        try {
            const updatePromises = updatedReviews.map((review) => {
                if (review.id) {
                    return updateDoc(doc(db, 'reviews', review.id), { order: review.order });
                }
                return Promise.resolve();
            });

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la réorganisation:', error);
            // Rollback en cas d'erreur
            fetchReviews();
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const reviewsCollection = collection(db, 'reviews');
            const reviewsQuery = query(reviewsCollection, orderBy('order', 'asc'));
            const reviewsSnapshot = await getDocs(reviewsQuery);

            if (!reviewsSnapshot.empty) {
                const fetchedReviews = reviewsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as AdminReview[];
                setReviews(fetchedReviews);
            } else {
                setReviews([]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des témoignages:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la récupération des témoignages',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingReview?.id) {
                // Pour la modification, on garde l'ordre existant
                const reviewRef = doc(db, 'reviews', editingReview.id);
                await updateDoc(reviewRef, {
                    name: formData.name,
                    role: formData.role,
                    company: formData.company,
                    text: formData.text,
                    imageSrc: formData.imageSrc,
                    order: editingReview.order, // On garde l'ordre existant
                });
                setStatusMessage({ type: 'success', message: 'Témoignage mis à jour avec succès' });
            } else {
                // Pour un nouveau témoignage, on l'ajoute à la fin
                const newReview = {
                    name: formData.name,
                    role: formData.role,
                    company: formData.company,
                    text: formData.text,
                    imageSrc: formData.imageSrc,
                    order: reviews.length, // Automatiquement à la fin
                };
                await addDoc(collection(db, 'reviews'), newReview);
                setStatusMessage({
                    type: 'success',
                    message: 'Nouveau témoignage ajouté avec succès',
                });
            }
            setShowForm(false);
            setEditingReview(null);
            setFormData({
                name: '',
                role: '',
                company: '',
                text: '',
                imageSrc: '',
                order: 0,
            });
            setPreviewImage(null);
            fetchReviews();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du témoignage:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'reviews', reviewId));
            setStatusMessage({ type: 'success', message: 'Témoignage supprimé avec succès' });
            fetchReviews();
        } catch (error) {
            console.error('Erreur lors de la suppression du témoignage:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la suppression' });
        }
    };

    const handleDeleteAllReviews = async () => {
        if (
            !confirm(
                `Êtes-vous sûr de vouloir supprimer tous les témoignages (${reviews.length} témoignages) ? Cette action est irréversible.`,
            )
        ) {
            return;
        }

        try {
            await Promise.all(
                reviews.map((review) =>
                    review.id ? deleteDoc(doc(db, 'reviews', review.id)) : Promise.resolve(),
                ),
            );

            setReviews([]);
            setStatusMessage({
                type: 'success',
                message: `Tous les témoignages (${reviews.length}) ont été supprimés avec succès`,
            });
        } catch (error) {
            console.error('Erreur lors de la suppression des témoignages:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la suppression des témoignages',
            });
        }
    };

    const handleFileUpload = async (files: FileList) => {
        setUploading(true);
        setStatusMessage(null);
        setUploadProgress(0);

        try {
            const file = files[0];
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'home/reviews');
            formData.append('useUuid', 'false');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors du téléchargement de l'image");
            }

            const data = await response.json();
            setFormData((prev) => ({ ...prev, imageSrc: data.fileUrl }));
            setUploadProgress(100);
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            setStatusMessage({
                type: 'error',
                message: "Erreur lors du téléchargement de l'image",
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const cancelEdit = () => {
        setEditingReview(null);
        setFormData({
            name: '',
            role: '',
            company: '',
            text: '',
            imageSrc: '',
            order: 0,
        });
        setPreviewImage(null);
        setShowForm(false);
        setStatusMessage(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner />
            </div>
        );
    }

    return (
        <>
            {/* Section Actions */}
            <div className="p-6 mb-8">
                <div className="flex flex-wrap justify-end gap-4">
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Ajouter un témoignage
                    </button>
                    {reviews.length > 0 && (
                        <button
                            onClick={handleDeleteAllReviews}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Tout supprimer
                        </button>
                    )}
                </div>
            </div>

            {/* Section Formulaire */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingReview ? 'Modifier le témoignage' : 'Ajouter un témoignage'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rôle
                                </label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            role: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Entreprise
                                </label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            company: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Témoignage
                            </label>
                            <textarea
                                value={formData.text}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        text: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                rows={4}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Photo de profil
                            </label>
                            <div>
                                <label className="px-4 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300 transition-colors">
                                    Parcourir
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) =>
                                            e.target.files && handleFileUpload(e.target.files)
                                        }
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Prévisualisation
                            </h4>
                            <div className="w-full max-w-[400px] mx-auto">
                                <CustomerReviews reviews={[formData]} autoplaySpeed={0} />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
                            >
                                {editingReview ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Section Liste des témoignages */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                        Ordre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Photo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nom
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rôle
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Entreprise
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Témoignage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <SortableContext
                                items={reviews.map((review) => review.id!)}
                                strategy={verticalListSortingStrategy}
                            >
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reviews.map((review) => (
                                        <SortableRow
                                            key={review.id}
                                            review={review}
                                            onEdit={() => {
                                                setEditingReview(review);
                                                setFormData(review);
                                                setShowForm(true);
                                            }}
                                            onDelete={handleDeleteReview}
                                        />
                                    ))}
                                </tbody>
                            </SortableContext>
                        </table>
                    </DndContext>
                </div>
            </div>

            {/* Message de statut */}
            {statusMessage && (
                <div
                    className={`fixed bottom-4 right-4 p-4 rounded-md ${
                        statusMessage.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                    }`}
                >
                    {statusMessage.message}
                </div>
            )}
        </>
    );
}
