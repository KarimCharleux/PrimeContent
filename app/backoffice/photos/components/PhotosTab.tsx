'use client';

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    addDoc,
} from 'firebase/firestore';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface Photo {
    id?: string;
    title?: string;
    category: string;
    source: string;
    format: 'portrait' | 'paysage';
    order: number;
}

interface PhotoStats {
    totalPhotos: number;
    totalSize: number;
    averageLoadTime: number;
}

interface PhotosTabProps {
    onStatusChange?: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function PhotosTab({ onStatusChange }: PhotosTabProps) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [stats, setStats] = useState<PhotoStats>({
        totalPhotos: 0,
        totalSize: 0,
        averageLoadTime: 0,
    });
    const [formData, setFormData] = useState<Partial<Photo>>({
        title: '',
        category: '',
        source: '',
        format: 'portrait',
        order: 0,
    });

    // Extraire les catégories uniques des photos
    const categories = Array.from(new Set(photos.map((photo) => photo.category))).filter(Boolean);

    // Fonction pour formater la taille en ko, Mo ou Go
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) {
            return bytes + ' octets';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' Ko';
        } else if (bytes < 1024 * 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
        } else {
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
        }
    };

    // Fonction pour formater le temps de chargement
    const formatLoadTime = (ms: number): string => {
        if (ms < 1000) {
            return ms.toFixed(0) + ' ms';
        } else {
            return (ms / 1000).toFixed(2) + ' s';
        }
    };

    // Fonction pour calculer les statistiques
    const calculateStats = useCallback(async () => {
        let totalSize = 0;
        let totalLoadTime = 0;

        for (const photo of photos) {
            try {
                const response = await fetch(photo.source, { method: 'HEAD' });
                const contentLength = response.headers.get('content-length');

                if (contentLength) {
                    const size = parseInt(contentLength);
                    totalSize += size;
                }

                // Estimation du temps de chargement (basé sur une connexion moyenne de 15 Mbps)
                const loadTime = ((parseInt(contentLength || '0') * 8) / (15 * 1024 * 1024)) * 1000;
                totalLoadTime += loadTime;
            } catch (error) {
                console.error(`Erreur lors de l'analyse de ${photo.source}:`, error);
            }
        }

        setStats({
            totalPhotos: photos.length,
            totalSize,
            averageLoadTime: totalLoadTime / photos.length,
        });
    }, [photos]);

    useEffect(() => {
        fetchPhotos();
    }, []);

    useEffect(() => {
        if (photos.length > 0) {
            calculateStats();
        }
    }, [photos, calculateStats]);

    // Mettre à jour le statut pour le composant parent
    useEffect(() => {
        onStatusChange && onStatusChange(statusMessage);
    }, [statusMessage, onStatusChange]);

    // Fermer et réinitialiser le formulaire
    const resetForm = () => {
        setShowForm(false);
        setEditingPhoto(null);
        setFormData({
            title: '',
            category: '',
            source: '',
            format: 'portrait',
            order: 0,
        });
        setPreviewImage(null);
        setStatusMessage(null);
    };

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const photosCollection = collection(db, 'photos');
            const photosQuery = query(photosCollection, orderBy('order', 'asc'));
            const photosSnapshot = await getDocs(photosQuery);

            if (!photosSnapshot.empty) {
                const fetchedPhotos = photosSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Photo[];
                setPhotos(fetchedPhotos);
            } else {
                setPhotos([]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des photos:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la récupération des photos',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPhoto?.id) {
                const photoRef = doc(db, 'photos', editingPhoto.id);
                await updateDoc(photoRef, {
                    title: formData.title,
                    source: formData.source || '',
                    format: formData.format,
                    order: formData.order,
                    category: formData.category || '',
                });
                setStatusMessage({ type: 'success', message: 'Photo mise à jour avec succès' });
            } else {
                const newPhoto = {
                    ...formData,
                    order: photos.length,
                };
                await addDoc(collection(db, 'photos'), newPhoto);
                setStatusMessage({
                    type: 'success',
                    message: 'Nouvelle photo ajoutée avec succès',
                });
            }
            resetForm();
            fetchPhotos();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la photo:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        }
    };

    // Gérer le drag & drop des fichiers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFileUpload(e.dataTransfer.files);
        }
    };

    // Supprimer toutes les photos
    const handleDeleteAllPhotos = async () => {
        if (
            !confirm(
                `Êtes-vous sûr de vouloir supprimer toutes les photos (${photos.length} photos) ? Cette action est irréversible.`,
            )
        ) {
            return;
        }

        try {
            // Supprimer d'abord tous les médias
            await Promise.all(
                photos.map(async (photo) => {
                    if (photo.source) {
                        const fileName = photo.source.split('/').pop();
                        const filePath = photo.source.substring(1, photo.source.lastIndexOf('/'));

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
                                        'Erreur lors de la suppression du média:',
                                        await response.text(),
                                    );
                                }
                            } catch (mediaError) {
                                console.error(
                                    'Erreur lors de la suppression du média:',
                                    mediaError,
                                );
                            }
                        }
                    }
                }),
            );

            // Ensuite supprimer les documents Firestore
            await Promise.all(photos.map((photo) => deleteDoc(doc(db, 'photos', photo.id!))));

            // Fermer le form
            resetForm();

            setPhotos([]);
            setStatusMessage({
                type: 'success',
                message: `Toutes les photos (${photos.length}) ont été supprimées avec succès`,
            });
        } catch (error) {
            console.error('Erreur lors de la suppression des photos:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la suppression des photos',
            });
        }
    };

    // Détecter automatiquement le format (portrait/paysage)
    const detectFormat = async (file: File): Promise<'portrait' | 'paysage'> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                resolve(img.width < img.height ? 'portrait' : 'paysage');
            };
            img.src = URL.createObjectURL(file);
        });
    };

    // Gérer l'upload des fichiers
    const handleFileUpload = async (files: FileList) => {
        // Filtrer les fichiers pour n'accepter que les images
        const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            setStatusMessage({
                type: 'error',
                message: 'Veuillez sélectionner uniquement des fichiers image',
            });
            return;
        }

        setUploading(true);
        setStatusMessage(null);
        setUploadProgress(0);

        try {
            // Trouver le dernier ordre existant
            const lastOrder = Math.max(...photos.map((p) => p.order), -1);
            let currentOrder = lastOrder + 1;

            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const format = await detectFormat(file);

                // Créer un objet URL pour la prévisualisation locale
                const objectUrl = URL.createObjectURL(file);
                setPreviewImage(objectUrl);

                // Créer un FormData pour l'upload
                const formData = new FormData();
                formData.append('file', file);
                formData.append('path', 'photos');
                formData.append('useUuid', 'false');

                // Faire une requête fetch à notre API locale pour sauvegarder le fichier
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Erreur lors du téléchargement de la photo');
                }

                const data = await response.json();

                // Créer une nouvelle photo avec l'ordre incrémenté
                const newPhoto = {
                    title: '', // Laisser le titre vide
                    source: data.fileUrl,
                    format,
                    order: currentOrder++,
                    category: '',
                };

                await addDoc(collection(db, 'photos'), newPhoto);

                // Mettre à jour la progression
                setUploadProgress(((i + 1) / imageFiles.length) * 100);
            }

            setStatusMessage({
                type: 'success',
                message: `${imageFiles.length} photo(s) ajoutée(s) avec succès`,
            });

            // Rafraîchir la liste des photos
            fetchPhotos();
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors du téléchargement des photos',
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (photo: Photo) => {
        setEditingPhoto(photo);
        setFormData(photo);
        setPreviewImage(photo.source);
        setShowForm(true);

        // Faire défiler la page jusqu'au formulaire
        setTimeout(() => {
            const formElement = document.querySelector('form');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
            try {
                const photo = photos.find((p) => p.id === id);
                if (!photo) return;

                // Supprimer le média si une source est définie
                if (photo.source) {
                    const fileName = photo.source.split('/').pop();
                    const filePath = photo.source.substring(1, photo.source.lastIndexOf('/'));

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
                                    'Erreur lors de la suppression du média:',
                                    await response.text(),
                                );
                            }
                        } catch (mediaError) {
                            console.error('Erreur lors de la suppression du média:', mediaError);
                        }
                    }
                }

                // Supprimer la photo de Firestore
                await deleteDoc(doc(db, 'photos', id));
                setStatusMessage({ type: 'success', message: 'Photo supprimée avec succès' });
                fetchPhotos();
            } catch (error) {
                console.error('Erreur lors de la suppression de la photo:', error);
                setStatusMessage({ type: 'error', message: 'Erreur lors de la suppression' });
            }
        }
    };

    const handleReorder = async (photoId: string, newOrder: number) => {
        try {
            await updateDoc(doc(db, 'photos', photoId), { order: newOrder });
            fetchPhotos();
        } catch (error) {
            console.error('Erreur lors du réordonnancement:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors du réordonnancement' });
        }
    };

    const cancelEdit = () => {
        resetForm();
    };

    // Fonction pour déterminer la classe de taille en fonction du format
    const getItemSizeClass = (format: 'portrait' | 'paysage') => {
        switch (format) {
            case 'paysage':
                return 'aspect-[16/9]';
            case 'portrait':
                return 'aspect-[3/4]';
            default:
                return 'aspect-[16/9]';
        }
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
                <h2 className="text-xl font-semibold mb-4">Statistiques des Photos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Nombre total de photos</p>
                        <p className="text-3xl font-bold">{stats.totalPhotos}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Taille totale</p>
                        <p className="text-3xl font-bold">{formatSize(stats.totalSize)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">
                            Temps de chargement moyen
                        </p>
                        <p className="text-3xl font-bold">
                            {formatLoadTime(stats.averageLoadTime)}
                        </p>
                        <p className="text-xs text-gray-500">
                            Estimation basée sur une connexion moyenne en France (15 Mbps)
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Gestion des Photos</h2>
                        <div className="flex space-x-2">
                            {photos.length > 0 && (
                                <>
                                    <button
                                        onClick={() => handleDeleteAllPhotos()}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-2"
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
                                        Tout supprimer
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 flex items-center"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2"
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
                                Nouvelle photo
                            </button>
                        </div>
                    </div>

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

                    {/* Zone de drop pour les photos */}
                    <div
                        className={`border-2 border-dashed p-8 mb-8 rounded-lg text-center ${
                            isDragging
                                ? 'border-primary bg-primary bg-opacity-10'
                                : 'border-gray-300'
                        }`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {uploading ? (
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <Spinner />
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Téléchargement en cours... {Math.round(uploadProgress)}%
                                </p>
                            </div>
                        ) : (
                            <>
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <p className="mt-2 text-gray-600">
                                    Glissez-déposez des photos ici ou{' '}
                                    <button
                                        type="button"
                                        className="text-primary hover:text-primary-dark font-medium"
                                        onClick={() =>
                                            document.getElementById('fileInput')?.click()
                                        }
                                    >
                                        parcourez votre ordinateur
                                    </button>
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Images uniquement (JPG, PNG, WebP, etc.)
                                </p>
                                <input
                                    id="fileInput"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) =>
                                        e.target.files && handleFileUpload(e.target.files)
                                    }
                                />
                            </>
                        )}
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                {editingPhoto
                                    ? `Modifier: ${editingPhoto.title || 'Photo sans titre'}`
                                    : 'Ajouter une nouvelle photo'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Titre (optionnel)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title || ''}
                                            onChange={(e) =>
                                                setFormData({ ...formData, title: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Titre de la photo"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Catégorie
                                        </label>
                                        <div className="flex space-x-2">
                                            <select
                                                value={formData.category || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        category: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">
                                                    Sélectionner une catégorie existante
                                                </option>
                                                {categories.map((category) => (
                                                    <option key={category} value={category}>
                                                        {category}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={formData.category || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        category: e.target.value,
                                                    })
                                                }
                                                placeholder="Ou créer une nouvelle catégorie"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            La catégorie est utilisée pour former les filtres dans
                                            la galerie
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Format
                                        </label>
                                        <select
                                            value={formData.format || 'portrait'}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    format: e.target.value as
                                                        | 'portrait'
                                                        | 'paysage',
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        >
                                            <option value="portrait">Portrait</option>
                                            <option value="paysage">Paysage</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Image
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={formData.source || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        source: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="URL de l'image"
                                                required
                                            />
                                            <label className="px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300">
                                                Parcourir
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        e.target.files &&
                                                        handleFileUpload(e.target.files)
                                                    }
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                            Prévisualisation
                                        </h4>
                                        <div
                                            className={`w-full max-w-[400px] mx-auto relative bg-gray-100 rounded-lg overflow-hidden group ${getItemSizeClass(formData.format || 'portrait')}`}
                                        >
                                            {previewImage ? (
                                                <>
                                                    <Image
                                                        src={getMediaUrl(previewImage)}
                                                        alt="Prévisualisation"
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    {formData.category && (
                                                        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                                                            {formData.category}
                                                        </div>
                                                    )}
                                                    {formData.title && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <h3 className="text-white text-lg font-medium">
                                                                {formData.title}
                                                            </h3>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    Aucune image sélectionnée
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                                    {editingPhoto ? 'Mettre à jour' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-8">
                        <div className="overflow-auto">
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
                                            Titre
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Catégorie
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Format
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {photos.map((photo) => (
                                        <tr key={photo.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            handleReorder(
                                                                photo.id!,
                                                                photo.order - 1,
                                                            )
                                                        }
                                                        disabled={photo.order === 0}
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                    >
                                                        ↑
                                                    </button>
                                                    <span>{photo.order}</span>
                                                    <button
                                                        onClick={() =>
                                                            handleReorder(
                                                                photo.id!,
                                                                photo.order + 1,
                                                            )
                                                        }
                                                        disabled={photo.order === photos.length - 1}
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-16 w-16 relative overflow-hidden rounded">
                                                    <Image
                                                        src={getMediaUrl(photo.source)}
                                                        alt={photo.title || 'Photo sans titre'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {photo.title || (
                                                    <span className="text-gray-400 italic">
                                                        Sans titre
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {photo.category}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {photo.format}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                <button
                                                    onClick={() => handleEdit(photo)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(photo.id!)}
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
                    </div>
                </div>
            </div>
        </>
    );
}
