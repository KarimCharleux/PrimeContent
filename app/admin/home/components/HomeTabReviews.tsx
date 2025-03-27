'use client';

import { addDoc, collection, deleteDoc, doc, getDocs, query, orderBy, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { Spinner } from '@/app/admin/components/Spinner';
import { db } from '@/app/admin/lib/firebase-client';
import CustomerReviews, { Review } from '@/app/components/CustomerReviews';

export default function HomeTabReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [formData, setFormData] = useState<Review>({
        name: '',
        role: '',
        company: '',
        text: '',
        imageSrc: '',
        order: 0,
    });
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const reviewsCollection = collection(db, 'reviews');
            const reviewsQuery = query(reviewsCollection, orderBy('order', 'asc'));
            const reviewsSnapshot = await getDocs(reviewsQuery);

            if (!reviewsSnapshot.empty) {
                const fetchedReviews = reviewsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Review[];
                setReviews(fetchedReviews);
            } else {
                setReviews([]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des témoignages:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la récupération des témoignages' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingReview?.id) {
                const reviewRef = doc(db, 'reviews', editingReview.id);
                await updateDoc(reviewRef, {
                    name: formData.name,
                    role: formData.role,
                    company: formData.company,
                    text: formData.text,
                    imageSrc: formData.imageSrc,
                    order: formData.order,
                });
                setStatusMessage({ type: 'success', message: 'Témoignage mis à jour avec succès' });
            } else {
                const newReview = {
                    name: formData.name,
                    role: formData.role,
                    company: formData.company,
                    text: formData.text,
                    imageSrc: formData.imageSrc,
                    order: reviews.length,
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
        if (!confirm(`Êtes-vous sûr de vouloir supprimer tous les témoignages (${reviews.length} témoignages) ? Cette action est irréversible.`)) {
            return;
        }

        try {
            await Promise.all(reviews.map(review => 
                deleteDoc(doc(db, 'reviews', review.id!))
            ));

            setReviews([]);
            setStatusMessage({
                type: 'success',
                message: `Tous les témoignages (${reviews.length}) ont été supprimés avec succès`
            });
        } catch (error) {
            console.error('Erreur lors de la suppression des témoignages:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la suppression des témoignages'
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
                throw new Error('Erreur lors du téléchargement de l\'image');
            }

            const data = await response.json();
            setFormData(prev => ({ ...prev, imageSrc: data.fileUrl }));
            setUploadProgress(100);
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors du téléchargement de l\'image',
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleReorder = async (reviewId: string, newOrder: number) => {
        try {
            await updateDoc(doc(db, 'reviews', reviewId), { order: newOrder });
            fetchReviews();
        } catch (error) {
            console.error('Erreur lors du réordonnancement:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors du réordonnancement' });
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
            {/* Section Statistiques */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Statistiques des Témoignages</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total des témoignages</p>
                        <p className="text-2xl font-bold">{reviews.length}</p>
                    </div>
                </div>
            </div>

            {/* Section Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Ajouter un témoignage
                    </button>
                    {reviews.length > 0 && (
                        <button
                            onClick={handleDeleteAllReviews}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ordre
                                </label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            order: parseInt(e.target.value),
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
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={formData.imageSrc}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            imageSrc: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="URL de l'image"
                                />
                                <label className="px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300">
                                    Parcourir
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
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
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reviews.map((review) => (
                                <tr key={review.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={review.order}
                                            onChange={(e) =>
                                                handleReorder(review.id!, parseInt(e.target.value))
                                            }
                                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {review.imageSrc && (
                                            <div className="w-12 h-12 rounded-full overflow-hidden relative">
                                                <Image
                                                    src={review.imageSrc}
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
                                                onClick={() => {
                                                    setEditingReview(review);
                                                    setFormData(review);
                                                    setShowForm(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-12 12a2 2 0 01-2.828 0 2 2 0 010-2.828l12-12z" />
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-12 12a2 2 0 01-2.828 0 2 2 0 010-2.828l12-12z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteReview(review.id!)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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