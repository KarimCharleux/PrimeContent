'use client';

import { collection, doc, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { db } from '../../lib/firebase-client';

export interface RealisationMedia {
    id: string;
    path: string;
    title?: string;
    source: string;
    isVideo: boolean;
    format: 'portrait' | 'paysage';
    order: number;
    thumbnail?: string;
    selected?: boolean;
    size?: number;
    category?: string;
}

interface RealisationsMediaManagerProps {
    readonly onStatusChange?: (
        status: { type: 'success' | 'error'; message: string } | null,
    ) => void;
    readonly onStatsChange?: (stats: MediaStats) => void;
}

export interface MediaStats {
    totalCount: number;
    totalSize: number;
    videoCount: number;
    imageCount: number;
    averageLoadTime: number;
    imagesSize: number;
    videosSize: number;
}

export default function RealisationsMediaManager({
    onStatusChange,
    onStatsChange,
}: RealisationsMediaManagerProps) {
    const router = useRouter();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [medias, setMedias] = useState<RealisationMedia[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // États pour l'édition
    const [editingMedia, setEditingMedia] = useState<RealisationMedia | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);

    // Statistiques
    const [stats, setStats] = useState<MediaStats>({
        totalCount: 0,
        totalSize: 0,
        videoCount: 0,
        imageCount: 0,
        averageLoadTime: 0,
        imagesSize: 0,
        videosSize: 0,
    });

    // Charger les médias depuis Firestore
    const loadMedias = useCallback(async () => {
        try {
            const [photosSnapshot, videosSnapshot] = await Promise.all([
                getDocs(collection(db, 'realisations-photos')),
                getDocs(collection(db, 'realisations-videos')),
            ]);

            const allMedias: RealisationMedia[] = [];

            photosSnapshot.forEach((doc) => {
                const data = doc.data();
                allMedias.push({
                    id: doc.id,
                    path: data.url || data.path,
                    title: data.title || '',
                    source: data.url || data.path,
                    isVideo: false,
                    format: data.format || 'paysage',
                    order: data.order || 0,
                    thumbnail: data.thumbnail || '',
                    category: data.category || '',
                    size: data.size || 500 * 1024,
                });
            });

            videosSnapshot.forEach((doc) => {
                const data = doc.data();
                allMedias.push({
                    id: doc.id,
                    path: data.url || data.path,
                    title: data.title || '',
                    source: data.url || data.path,
                    isVideo: true,
                    format: data.format || 'paysage',
                    order: data.order || 0,
                    thumbnail: data.thumbnail || '',
                    category: data.category || '',
                    size: data.size || 5 * 1024 * 1024,
                });
            });

            // Trier par ordre
            allMedias.sort((a, b) => (a.order || 0) - (b.order || 0));
            setMedias(allMedias);
        } catch (error) {
            console.error('Erreur lors du chargement des médias:', error);
            onStatusChange?.({
                type: 'error',
                message: 'Erreur lors du chargement des médias',
            });
        }
    }, [onStatusChange]);

    useEffect(() => {
        loadMedias();
    }, [loadMedias]);

    // Calculer les statistiques
    const calculateStats = useCallback(() => {
        let totalImages = 0;
        let totalVideos = 0;
        let imagesSize = 0;
        let videosSize = 0;
        let totalSize = 0;

        medias.forEach((media) => {
            if (media.isVideo) {
                totalVideos++;
                videosSize += media.size || 5 * 1024 * 1024;
            } else {
                totalImages++;
                imagesSize += media.size || 500 * 1024;
            }
        });

        totalSize = imagesSize + videosSize;
        const averageLoadTime =
            medias.length > 0 ? (((totalSize * 8) / (15 * 1024 * 1024)) * 1000) / medias.length : 0;

        const newStats: MediaStats = {
            totalCount: medias.length,
            totalSize,
            videoCount: totalVideos,
            imageCount: totalImages,
            averageLoadTime,
            imagesSize,
            videosSize,
        };

        setStats(newStats);
        onStatsChange?.(newStats);
    }, [medias, onStatsChange]);

    useEffect(() => {
        calculateStats();
    }, [calculateStats]);

    // Gestion des fichiers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(filesArray);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const filesArray = Array.from(e.dataTransfer.files);
            setSelectedFiles(filesArray);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Upload des médias
    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            onStatusChange?.({
                type: 'error',
                message: 'Aucun fichier sélectionné',
            });
            return;
        }

        if (!selectedCategory) {
            onStatusChange?.({
                type: 'error',
                message: 'Veuillez sélectionner une catégorie',
            });
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            const formData = new FormData();
            selectedFiles.forEach((file) => {
                formData.append('files', file);
            });
            formData.append('path', 'realisations');
            formData.append('useUuid', 'true');

            const response = await fetch('/api/upload/batch', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'upload des médias");
            }

            const uploadResult = await response.json();

            // Traiter chaque fichier
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const url = uploadResult.fileUrls[i];

                if (!url) continue;

                const isVideo = file.type.startsWith('video/');
                const format = await detectFormat(file);

                let thumbnail = '';
                if (isVideo) {
                    thumbnail = await generateThumbnail(file);
                    if (thumbnail) {
                        const thumbnailBlob = await fetch(thumbnail).then((r) => r.blob());
                        const thumbnailFile = new File([thumbnailBlob], `thumbnail.jpg`, {
                            type: 'image/jpeg',
                        });

                        const thumbnailFormData = new FormData();
                        thumbnailFormData.append('file', thumbnailFile);
                        thumbnailFormData.append('path', 'realisations/thumbnails');
                        thumbnailFormData.append('useUuid', 'true');

                        const thumbnailResponse = await fetch('/api/upload', {
                            method: 'POST',
                            body: thumbnailFormData,
                        });

                        if (thumbnailResponse.ok) {
                            const thumbnailResult = await thumbnailResponse.json();
                            thumbnail = thumbnailResult.fileUrl;
                        }
                    }
                }

                // Ajouter à Firestore
                const mediaData = {
                    url,
                    title: '',
                    category: selectedCategory,
                    format,
                    order: medias.length + i,
                    thumbnail,
                    size: file.size,
                    createdAt: new Date(),
                };

                const collectionName = isVideo ? 'realisations-videos' : 'realisations-photos';
                await addDoc(collection(db, collectionName), mediaData);
            }

            setSelectedFiles([]);
            setSelectedCategory('');
            await loadMedias();

            onStatusChange?.({
                type: 'success',
                message: `${selectedFiles.length} média(s) importé(s) avec succès`,
            });

            router.refresh();
        } catch (error) {
            console.error("Erreur lors de l'upload:", error);
            onStatusChange?.({
                type: 'error',
                message: "Erreur lors de l'upload des médias",
            });
        } finally {
            setUploading(false);
            setUploadProgress(100);
        }
    };

    // Détecter le format
    const detectFormat = async (file: File): Promise<'portrait' | 'paysage'> => {
        return new Promise((resolve) => {
            if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    URL.revokeObjectURL(video.src);
                    resolve(video.videoWidth < video.videoHeight ? 'portrait' : 'paysage');
                };
                video.src = URL.createObjectURL(file);
            } else {
                const img = document.createElement('img');
                img.onload = () => {
                    URL.revokeObjectURL(img.src);
                    resolve(img.width < img.height ? 'portrait' : 'paysage');
                };
                img.src = URL.createObjectURL(file);
            }
        });
    };

    // Générer miniature vidéo
    const generateThumbnail = async (file: File): Promise<string> => {
        if (!file.type.startsWith('video/')) return '';

        return new Promise((resolve) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.onloadeddata = () => {
                video.currentTime = video.duration / 2;
            };

            video.onseeked = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

                const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                URL.revokeObjectURL(video.src);
                resolve(thumbnail);
            };

            video.src = URL.createObjectURL(file);
        });
    };

    // Supprimer tous les médias
    const handleDeleteAllMedia = async () => {
        if (medias.length === 0) {
            onStatusChange?.({
                type: 'error',
                message: 'Aucun média à supprimer',
            });
            return;
        }

        if (
            window.confirm(
                `ATTENTION: Vous êtes sur le point de supprimer tous les médias (${medias.length}) des réalisations. Cette action est irréversible. Continuer?`,
            )
        ) {
            try {
                setUploading(true); // Utiliser l'état uploading pour montrer que le traitement est en cours
                const totalMediasToDelete = medias.length; // Stocker le nombre avant suppression

                // Supprimer tous les médias de Firestore et les fichiers
                for (const media of medias) {
                    try {
                        // Supprimer de Firestore
                        const collectionName = media.isVideo
                            ? 'realisations-videos'
                            : 'realisations-photos';
                        await deleteDoc(doc(db, collectionName, media.id));

                        // Supprimer le fichier principal
                        if (media.path) {
                            const fileName = media.path.split('/').pop();
                            if (fileName) {
                                await fetch(
                                    `/api/delete?path=realisations&name=${encodeURIComponent(fileName)}`,
                                    {
                                        method: 'DELETE',
                                    },
                                );
                            }
                        }

                        // Supprimer la miniature si elle existe
                        if (media.thumbnail) {
                            const thumbnailName = media.thumbnail.split('/').pop();
                            if (thumbnailName) {
                                await fetch(
                                    `/api/delete?path=realisations/thumbnails&name=${encodeURIComponent(thumbnailName)}`,
                                    {
                                        method: 'DELETE',
                                    },
                                );
                            }
                        }
                    } catch (err) {
                        console.error("Erreur lors de la suppression d'un média:", err);
                    }
                }

                // Recharger les médias depuis Firestore
                await loadMedias();

                onStatusChange?.({
                    type: 'success',
                    message: `Tous les médias (${totalMediasToDelete}) ont été supprimés avec succès`,
                });

                router.refresh();
            } catch (error) {
                console.error('Erreur lors de la suppression de tous les médias:', error);
                onStatusChange?.({
                    type: 'error',
                    message: 'Erreur lors de la suppression des médias',
                });
            } finally {
                setUploading(false);
            }
        }
    };

    // Supprimer un média
    const handleDeleteMedia = async (mediaId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
            try {
                const media = medias.find((m) => m.id === mediaId);
                if (!media) return;

                // Supprimer de Firestore
                const collectionName = media.isVideo
                    ? 'realisations-videos'
                    : 'realisations-photos';
                await deleteDoc(doc(db, collectionName, mediaId));

                // Supprimer le fichier
                if (media.path) {
                    const fileName = media.path.split('/').pop();
                    if (fileName) {
                        await fetch(
                            `/api/delete?path=realisations&name=${encodeURIComponent(fileName)}`,
                            {
                                method: 'DELETE',
                            },
                        );
                    }
                }

                // Supprimer la miniature
                if (media.thumbnail) {
                    const thumbnailName = media.thumbnail.split('/').pop();
                    if (thumbnailName) {
                        await fetch(
                            `/api/delete?path=realisations/thumbnails&name=${encodeURIComponent(thumbnailName)}`,
                            {
                                method: 'DELETE',
                            },
                        );
                    }
                }

                await loadMedias();
                onStatusChange?.({
                    type: 'success',
                    message: 'Média supprimé avec succès',
                });

                router.refresh();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                onStatusChange?.({
                    type: 'error',
                    message: 'Erreur lors de la suppression du média',
                });
            }
        }
    };

    // Réorganiser l'ordre
    const handleReorder = async (mediaId: string, direction: 'up' | 'down') => {
        try {
            const sortedMedias = [...medias].sort((a, b) => (a.order || 0) - (b.order || 0));
            const currentIndex = sortedMedias.findIndex((m) => m.id === mediaId);
            if (currentIndex === -1) return;

            const newIndex =
                direction === 'up'
                    ? Math.max(0, currentIndex - 1)
                    : Math.min(sortedMedias.length - 1, currentIndex + 1);

            if (newIndex === currentIndex) return;

            const targetMedia = sortedMedias[newIndex];
            const currentMedia = sortedMedias[currentIndex];

            const currentOrder = currentMedia.order || 0;
            const targetOrder = targetMedia.order || 0;

            // Mettre à jour dans Firestore
            const currentCollectionName = currentMedia.isVideo
                ? 'realisations-videos'
                : 'realisations-photos';
            const targetCollectionName = targetMedia.isVideo
                ? 'realisations-videos'
                : 'realisations-photos';

            await Promise.all([
                updateDoc(doc(db, currentCollectionName, currentMedia.id), { order: targetOrder }),
                updateDoc(doc(db, targetCollectionName, targetMedia.id), { order: currentOrder }),
            ]);

            await loadMedias();
            onStatusChange?.({
                type: 'success',
                message: 'Ordre modifié avec succès',
            });
        } catch (error) {
            console.error('Erreur lors de la réorganisation:', error);
            onStatusChange?.({
                type: 'error',
                message: 'Erreur lors de la réorganisation',
            });
        }
    };

    // Éditer un média
    const handleEdit = (media: RealisationMedia) => {
        setEditingMedia(media);
        setShowEditForm(true);
        setPreviewThumbnail(media.thumbnail || null);

        setTimeout(() => {
            const formElement = document.querySelector('#media-edit-form');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    // Sauvegarder les modifications
    const handleSaveMedia = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMedia) return;

        try {
            let thumbnailUrl = editingMedia.thumbnail || '';

            if (thumbnailFile) {
                const thumbnailFormData = new FormData();
                thumbnailFormData.append('file', thumbnailFile);
                thumbnailFormData.append('path', 'realisations/thumbnails');
                thumbnailFormData.append('useUuid', 'true');

                const thumbnailResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: thumbnailFormData,
                });

                if (thumbnailResponse.ok) {
                    const thumbnailResult = await thumbnailResponse.json();
                    thumbnailUrl = thumbnailResult.fileUrl;
                }
            }

            const collectionName = editingMedia.isVideo
                ? 'realisations-videos'
                : 'realisations-photos';
            await updateDoc(doc(db, collectionName, editingMedia.id), {
                title: editingMedia.title,
                category: editingMedia.category,
                format: editingMedia.format,
                order: editingMedia.order,
                thumbnail: thumbnailUrl,
            });

            setShowEditForm(false);
            setEditingMedia(null);
            setThumbnailFile(null);
            setPreviewThumbnail(null);

            await loadMedias();
            onStatusChange?.({
                type: 'success',
                message: 'Média mis à jour avec succès',
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            onStatusChange?.({
                type: 'error',
                message: 'Erreur lors de la mise à jour du média',
            });
        }
    };

    const cancelEdit = () => {
        setShowEditForm(false);
        setEditingMedia(null);
        setThumbnailFile(null);
        setPreviewThumbnail(null);
    };

    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setPreviewThumbnail(URL.createObjectURL(file));

            if (editingMedia) {
                setEditingMedia({
                    ...editingMedia,
                    thumbnail: URL.createObjectURL(file),
                });
            }
        }
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' octets';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' Ko';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
    };

    const getItemSizeClass = (format: 'portrait' | 'paysage' = 'paysage') => {
        return format === 'portrait' ? 'aspect-[3/4]' : 'aspect-[16/9]';
    };

    // Catégories disponibles
    const categories = Array.from(new Set(medias.map((media) => media.category))).filter(
        Boolean,
    ) as string[];

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Gestion des médias de réalisations</h2>

            {/* Formulaire d'édition */}
            {showEditForm && editingMedia && (
                <form
                    id="media-edit-form"
                    onSubmit={handleSaveMedia}
                    className="space-y-6 mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50"
                >
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                        Modifier: {editingMedia.title || 'Média sans titre'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titre (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={editingMedia.title || ''}
                                    onChange={(e) =>
                                        setEditingMedia({ ...editingMedia, title: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Titre du média"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catégorie
                                </label>
                                <div className="flex space-x-2">
                                    <select
                                        value={editingMedia.category || ''}
                                        onChange={(e) =>
                                            setEditingMedia({
                                                ...editingMedia,
                                                category: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Sélectionnez une catégorie</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={editingMedia.category || ''}
                                        onChange={(e) =>
                                            setEditingMedia({
                                                ...editingMedia,
                                                category: e.target.value,
                                            })
                                        }
                                        placeholder="Ou créer une nouvelle catégorie"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ordre d&apos;affichage
                                </label>
                                <input
                                    type="number"
                                    value={editingMedia.order || 0}
                                    onChange={(e) =>
                                        setEditingMedia({
                                            ...editingMedia,
                                            order: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Format
                                </label>
                                <select
                                    value={editingMedia.format || 'paysage'}
                                    onChange={(e) =>
                                        setEditingMedia({
                                            ...editingMedia,
                                            format: e.target.value as 'portrait' | 'paysage',
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="paysage">Paysage (16:9)</option>
                                    <option value="portrait">Portrait (3:4)</option>
                                </select>
                            </div>

                            {/* Upload de miniature pour vidéos */}
                            {editingMedia.isVideo && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Miniature personnalisée
                                    </label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={editingMedia.thumbnail || ''}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="URL de la miniature"
                                            readOnly
                                        />
                                        <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer flex items-center">
                                            <span>Parcourir</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleThumbnailFileChange}
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Prévisualisation
                                </h4>
                                <div
                                    className={`relative bg-gray-100 rounded-lg overflow-hidden ${getItemSizeClass(editingMedia.format)}`}
                                >
                                    {editingMedia.isVideo ? (
                                        <video
                                            src={getMediaUrl(editingMedia.path)}
                                            className="w-full h-full object-contain"
                                            controls
                                            poster={previewThumbnail || editingMedia.thumbnail}
                                        />
                                    ) : (
                                        <Image
                                            src={getMediaUrl(editingMedia.path)}
                                            alt={editingMedia.title || 'Aperçu'}
                                            fill
                                            className="object-cover"
                                        />
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
                            Mettre à jour
                        </button>
                    </div>
                </form>
            )}

            {/* Section d'import */}
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Importer des médias</h3>

                {/* Sélection de catégorie */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie pour les nouveaux médias *
                    </label>
                    <div className="flex space-x-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Sélectionnez une catégorie</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            placeholder="Ou créer une nouvelle catégorie"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragging
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                >
                    <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-gray-400 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>

                    <p className="text-gray-600 mb-2">
                        Glissez-déposez vos médias ici ou cliquez pour parcourir
                    </p>
                    <p className="text-gray-500 text-sm">
                        Formats acceptés: JPG, PNG, GIF pour les images, MP4, WEBM pour les vidéos
                    </p>
                </div>

                {selectedFiles.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-gray-600">
                                {selectedFiles.length} fichier(s) sélectionné(s)
                            </p>
                            <button
                                onClick={() => setSelectedFiles([])}
                                className="text-red-500 hover:text-red-700 text-sm"
                            >
                                Réinitialiser
                            </button>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={uploading || !selectedCategory}
                            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                uploading || !selectedCategory
                                    ? 'bg-indigo-400'
                                    : 'bg-black hover:bg-black/80'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                        >
                            {uploading ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                                    Upload en cours... {Math.round(uploadProgress)}%
                                </span>
                            ) : (
                                'Importer les médias'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Tableau des médias */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Gestion des médias ({medias.length})</h3>
                    {medias.length > 0 && (
                        <button
                            onClick={handleDeleteAllMedia}
                            disabled={uploading}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
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
                            <span>Supprimer tout</span>
                        </button>
                    )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="w-12 px-3 py-3">
                                    Ordre
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Aperçu
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Type
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Titre
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Format
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Poids
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Catégorie
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {medias.length > 0 ? (
                                medias.map((media) => (
                                    <tr key={media.id}>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <div className="flex flex-col items-center">
                                                <button
                                                    onClick={() => handleReorder(media.id, 'up')}
                                                    disabled={media.order === 0}
                                                    className={`text-gray-500 hover:text-gray-700 mb-1 ${media.order === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
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
                                                    {media.order}
                                                </span>
                                                <button
                                                    onClick={() => handleReorder(media.id, 'down')}
                                                    disabled={media.order === medias.length - 1}
                                                    className={`text-gray-500 hover:text-gray-700 mt-1 ${media.order === medias.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
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
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <div className="w-20 h-12 relative rounded overflow-hidden">
                                                {media.isVideo ? (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                                                        {media.thumbnail ? (
                                                            <Image
                                                                src={getMediaUrl(media.thumbnail)}
                                                                alt={
                                                                    media.title || 'Miniature vidéo'
                                                                }
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-8 w-8 text-white"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={1}
                                                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Image
                                                        src={getMediaUrl(media.path)}
                                                        alt={media.title || 'Image'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${media.isVideo ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                                            >
                                                {media.isVideo ? 'Vidéo' : 'Image'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            {media.title || 'Sans titre'}
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${media.format === 'portrait' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}`}
                                            >
                                                {media.format === 'portrait'
                                                    ? 'Portrait'
                                                    : 'Paysage'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            {formatSize(media.size || 0)}
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${media.category ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
                                            >
                                                {media.category || 'Non catégorisé'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(media)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMedia(media.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-12 w-12 text-gray-400 mb-4"
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
                                            <p className="text-gray-500 text-lg font-medium">
                                                Aucun média trouvé
                                            </p>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Importez des médias en utilisant la section
                                                ci-dessus
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
