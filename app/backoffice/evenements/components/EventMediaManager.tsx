'use client';

import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { db } from '../../lib/firebase-client';
import { EventMediaItem, Evenement } from '../../models/eventTypes';

interface EventMediaManagerProps {
    readonly evenement: Evenement;
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

export default function EventMediaManager({
    evenement,
    onStatusChange,
    onStatsChange,
}: EventMediaManagerProps) {
    const router = useRouter();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<EventMediaItem[]>(evenement.images || []);

    // Nouveaux états pour l'édition de médias
    const [editingMedia, setEditingMedia] = useState<EventMediaItem | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
    const [loadTimes, setLoadTimes] = useState<Record<string, number>>({});
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // État pour les statistiques
    const [stats, setStats] = useState<MediaStats>({
        totalCount: 0,
        totalSize: 0,
        videoCount: 0,
        imageCount: 0,
        averageLoadTime: 0,
        imagesSize: 0,
        videosSize: 0,
    });

    useEffect(() => {
        // Assurer que les images ont des ordres uniques
        if (images && images.length > 0) {
            const hasOrderProperty = images.some((img) => img.order !== undefined);

            if (!hasOrderProperty) {
                // Initialiser les ordres si pas définis
                const imagesWithOrder = images.map((img, index) => ({
                    ...img,
                    order: index,
                }));
                setImages(imagesWithOrder);

                // Mettre à jour dans Firestore
                const eventRef = doc(db, 'evenements', evenement.id!);
                updateDoc(eventRef, {
                    images: imagesWithOrder,
                });
            }
        }
    }, [images, evenement.id]);

    useEffect(() => {
        setImages(evenement.images || []);
    }, [evenement]);

    // Fonction pour calculer les statistiques
    const calculateStats = useCallback(() => {
        let totalImages = 0;
        let totalVideos = 0;
        let imagesSize = 0;
        let videosSize = 0;
        let totalSize = 0;
        const averageSizePerImage = 500 * 1024; // ~500 KB par image (estimation)
        const averageSizePerVideo = 5 * 1024 * 1024; // ~5 MB par vidéo (estimation)

        // Compter le nombre d'images et de vidéos
        images.forEach((media) => {
            if (media.isVideo) {
                totalVideos++;
                videosSize += media.size || averageSizePerVideo;
            } else {
                totalImages++;
                imagesSize += media.size || averageSizePerImage;
            }
        });

        totalSize = imagesSize + videosSize;

        // Estimation du temps de chargement (basé sur une connexion moyenne de 15 Mbps)
        const averageLoadTime =
            images.length > 0 ? (((totalSize * 8) / (15 * 1024 * 1024)) * 1000) / images.length : 0;

        const stats: MediaStats = {
            totalCount: images.length,
            totalSize,
            videoCount: totalVideos,
            imageCount: totalImages,
            averageLoadTime,
            imagesSize,
            videosSize,
        };

        setStats(stats);
        onStatsChange?.(stats);
    }, [images, onStatsChange]);

    // Calculer les statistiques quand les images changent
    useEffect(() => {
        calculateStats();
    }, [calculateStats]);

    // Fonction pour gérer le changement d'ordre d'un média
    const handleReorder = async (imageId: string, direction: 'up' | 'down') => {
        try {
            // Trier les images par ordre
            const sortedImages = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));

            // Trouver l'index actuel de l'image
            const currentIndex = sortedImages.findIndex((img) => img.id === imageId);
            if (currentIndex === -1) return;

            // Déterminer le nouvel index en fonction de la direction
            const newIndex =
                direction === 'up'
                    ? Math.max(0, currentIndex - 1)
                    : Math.min(sortedImages.length - 1, currentIndex + 1);

            // Si l'index ne change pas (déjà en haut ou en bas), ne rien faire
            if (newIndex === currentIndex) return;

            // Échanger les ordres entre les deux images
            const targetImage = sortedImages[newIndex];
            const currentImage = sortedImages[currentIndex];

            const currentOrder = currentImage.order || 0;
            const targetOrder = targetImage.order || 0;

            // Mettre à jour les ordres
            const updatedImages = sortedImages.map((img) => {
                if (img.id === imageId) {
                    return { ...img, order: targetOrder };
                } else if (img.id === targetImage.id) {
                    return { ...img, order: currentOrder };
                }
                return img;
            });

            // Mettre à jour l'état local
            setImages(updatedImages);

            // Mettre à jour Firestore
            const eventRef = doc(db, 'evenements', evenement.id!);
            await updateDoc(eventRef, {
                images: updatedImages,
            });

            onStatusChange?.({
                type: 'success',
                message: `Ordre modifié avec succès`,
            });
        } catch (error) {
            console.error('Erreur lors de la réorganisation:', error);
            onStatusChange?.({
                type: 'error',
                message: 'Erreur lors de la réorganisation des médias',
            });
        }
    };

    // Fonction pour supprimer un média
    const handleDeleteMedia = async (imageId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
            try {
                // Trouver l'image à supprimer
                const imageToDelete = images.find((img) => img.id === imageId);
                if (!imageToDelete) return;

                // Supprimer le fichier du stockage
                if (imageToDelete.path) {
                    // Extraire le nom du fichier de l'URL
                    const fileName = imageToDelete.path.split('/').pop();
                    if (fileName) {
                        const response = await fetch(
                            `/api/delete?path=evenements/${evenement.id}&name=${encodeURIComponent(fileName)}`,
                            {
                                method: 'DELETE',
                            },
                        );
                        if (!response.ok) {
                            console.warn(`Erreur lors de la suppression du fichier ${fileName}`);
                        }
                    }
                }

                // Supprimer la miniature si elle existe
                if (imageToDelete.thumbnail) {
                    const thumbnailName = imageToDelete.thumbnail.split('/').pop();
                    if (thumbnailName) {
                        const response = await fetch(
                            `/api/delete?path=evenements/${evenement.id}/thumbnails&name=${encodeURIComponent(thumbnailName)}`,
                            {
                                method: 'DELETE',
                            },
                        );
                        if (!response.ok) {
                            console.warn(
                                `Erreur lors de la suppression de la miniature ${thumbnailName}`,
                            );
                        }
                    }
                }

                // Filtrer pour enlever l'image à supprimer
                const updatedImages = images.filter((img) => img.id !== imageId);

                // Mettre à jour Firestore
                const eventRef = doc(db, 'evenements', evenement.id!);
                await updateDoc(eventRef, {
                    images: updatedImages,
                });

                // Mettre à jour l'état local
                setImages(updatedImages);

                onStatusChange?.({
                    type: 'success',
                    message: `Média supprimé avec succès`,
                });

                // Rafraîchir la page
                router.refresh();
            } catch (error) {
                console.error('Erreur lors de la suppression du média:', error);
                onStatusChange?.({
                    type: 'error',
                    message: 'Erreur lors de la suppression du média',
                });
            }
        }
    };

    // Fonction pour supprimer tous les médias
    const handleDeleteAllMedia = async () => {
        if (images.length === 0) {
            onStatusChange?.({
                type: 'error',
                message: 'Aucun média à supprimer',
            });
            return;
        }

        if (
            window.confirm(
                `ATTENTION: Vous êtes sur le point de supprimer tous les médias (${images.length}) de cet événement. Cette action est irréversible. Continuer?`,
            )
        ) {
            try {
                setUploading(true); // Utiliser l'état uploading pour montrer que le traitement est en cours

                // Supprimer les fichiers du stockage Firebase via l'API
                for (const image of images) {
                    try {
                        // Supprimer l'image principale
                        if (image.path) {
                            // Extraire le nom du fichier de l'URL
                            const fileName = image.path.split('/').pop();
                            if (fileName) {
                                const response = await fetch(
                                    `/api/delete?path=evenements/${evenement.id}&name=${encodeURIComponent(fileName)}`,
                                    {
                                        method: 'DELETE',
                                    },
                                );
                                if (!response.ok) {
                                    console.warn(
                                        `Erreur lors de la suppression du fichier ${fileName}`,
                                    );
                                }
                            }
                        }

                        // Supprimer la miniature si elle existe
                        if (image.thumbnail) {
                            const thumbnailName = image.thumbnail.split('/').pop();
                            if (thumbnailName) {
                                const response = await fetch(
                                    `/api/delete?path=evenements/${evenement.id}/thumbnails&name=${encodeURIComponent(thumbnailName)}`,
                                    {
                                        method: 'DELETE',
                                    },
                                );
                                if (!response.ok) {
                                    console.warn(
                                        `Erreur lors de la suppression de la miniature ${thumbnailName}`,
                                    );
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Erreur lors de la suppression d'un fichier:", err);
                    }
                }

                // Mettre à jour Firestore en supprimant tous les médias
                const eventRef = doc(db, 'evenements', evenement.id!);
                await updateDoc(eventRef, {
                    images: [],
                });

                // Mettre à jour l'état local
                setImages([]);

                onStatusChange?.({
                    type: 'success',
                    message: `Tous les médias (${images.length}) ont été supprimés avec succès`,
                });

                // Rafraîchir la page
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

    // Extraire les catégories uniques des médias
    const categories = Array.from(new Set(images.map((media) => media.category))).filter(
        Boolean,
    ) as string[];

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

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        try {
            setUploading(true);
            setUploadProgress(0);

            const formData = new FormData();
            selectedFiles.forEach((file) => {
                formData.append('files', file);
            });
            formData.append('path', `evenements/${evenement.id}`);
            formData.append('useUuid', 'true');

            const response = await fetch('/api/upload/batch', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'upload des médias");
            }

            const uploadResult = await response.json();

            // Traiter les fichiers un par un pour déterminer leur type et format
            const newMedias: EventMediaItem[] = [];

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const url = uploadResult.fileUrls[i];

                if (!url) continue;

                const id = url.split('/').pop()?.split('.')[0] || `media-${Date.now()}`;
                const isVideo = file.type.startsWith('video/');
                const format = await detectFormat(file);

                // Pour les vidéos, générer automatiquement une miniature
                let thumbnail = '';
                if (isVideo) {
                    thumbnail = await generateThumbnail(file);

                    // Si une miniature a été générée, l'uploader
                    if (thumbnail) {
                        const thumbnailBlob = await fetch(thumbnail).then((r) => r.blob());
                        const thumbnailFile = new File([thumbnailBlob], `${id}-thumbnail.jpg`, {
                            type: 'image/jpeg',
                        });

                        const thumbnailFormData = new FormData();
                        thumbnailFormData.append('file', thumbnailFile);
                        thumbnailFormData.append('path', `evenements/${evenement.id}/thumbnails`);
                        thumbnailFormData.append('useUuid', 'false');

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

                newMedias.push({
                    id,
                    path: url,
                    title: '',
                    source: url,
                    isVideo,
                    format,
                    order: images.length + i,
                    thumbnail,
                    selected: false,
                    size: file.size,
                    category: selectedCategory || undefined,
                });
            }

            const updatedImages = [...images, ...newMedias];

            // Mettre à jour Firestore
            const eventRef = doc(db, 'evenements', evenement.id!);
            await updateDoc(eventRef, {
                images: updatedImages,
            });

            setImages(updatedImages);
            setSelectedFiles([]);
            setSelectedCategory(''); // Réinitialiser la catégorie après l'upload

            onStatusChange?.({
                type: 'success',
                message: `${newMedias.length} média(s) importé(s) avec succès`,
            });

            // Rafraîchir la page pour montrer les nouveaux médias
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

    // Détecter automatiquement le format (portrait/paysage) d'une image ou vidéo
    const detectFormat = async (file: File): Promise<'portrait' | 'paysage'> => {
        return new Promise((resolve) => {
            if (file.type.startsWith('video/')) {
                // Pour les vidéos
                const video = document.createElement('video');
                video.preload = 'metadata';

                video.onloadedmetadata = () => {
                    URL.revokeObjectURL(video.src);
                    resolve(video.videoWidth < video.videoHeight ? 'portrait' : 'paysage');
                };

                video.src = URL.createObjectURL(file);
            } else {
                // Pour les images
                const img = document.createElement('img');

                img.onload = () => {
                    URL.revokeObjectURL(img.src);
                    resolve(img.width < img.height ? 'portrait' : 'paysage');
                };

                img.src = URL.createObjectURL(file);
            }
        });
    };

    // Générer une miniature à partir d'une vidéo
    const generateThumbnail = async (file: File): Promise<string> => {
        if (!file.type.startsWith('video/')) return '';

        return new Promise((resolve) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.onloadeddata = () => {
                // Chercher le milieu de la vidéo pour la miniature
                video.currentTime = video.duration / 2;
            };

            video.onseeked = () => {
                // Une fois positionné, capturer l'image
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

    // Fonction pour éditer un média
    const handleEdit = (media: EventMediaItem) => {
        setEditingMedia(media);
        setShowEditForm(true);
        setPreviewThumbnail(media.thumbnail || null);

        // Faire défiler la page jusqu'au formulaire
        setTimeout(() => {
            const formElement = document.querySelector('#media-edit-form');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    // Fonction pour sauvegarder les modifications d'un média
    const handleSaveMedia = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingMedia) return;

        try {
            // Upload de la miniature si un nouveau fichier est sélectionné
            let thumbnailUrl = editingMedia.thumbnail || '';

            if (thumbnailFile) {
                const thumbnailFormData = new FormData();
                thumbnailFormData.append('file', thumbnailFile);
                thumbnailFormData.append('path', `evenements/${evenement.id}/thumbnails`);
                thumbnailFormData.append('useUuid', 'false');

                const thumbnailResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: thumbnailFormData,
                });

                if (thumbnailResponse.ok) {
                    const thumbnailResult = await thumbnailResponse.json();
                    thumbnailUrl = thumbnailResult.fileUrl;
                } else {
                    throw new Error("Erreur lors de l'upload de la miniature");
                }
            }

            // Mettre à jour le média dans la liste
            const updatedImages = images.map((img) =>
                img.id === editingMedia.id
                    ? { ...editingMedia, thumbnail: thumbnailUrl || editingMedia.thumbnail }
                    : img,
            );

            // Mettre à jour Firestore
            const eventRef = doc(db, 'evenements', evenement.id!);
            await updateDoc(eventRef, {
                images: updatedImages,
            });

            setImages(updatedImages);
            setShowEditForm(false);
            setEditingMedia(null);
            setThumbnailFile(null);
            setPreviewThumbnail(null);

            onStatusChange?.({
                type: 'success',
                message: 'Média mis à jour avec succès',
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du média:', error);
            onStatusChange?.({
                type: 'error',
                message: 'Erreur lors de la mise à jour du média',
            });
        }
    };

    // Fonction pour annuler l'édition
    const cancelEdit = () => {
        setShowEditForm(false);
        setEditingMedia(null);
        setThumbnailFile(null);
        setPreviewThumbnail(null);
    };

    // Fonction pour obtenir la classe de taille en fonction du format
    const getItemSizeClass = (format: 'portrait' | 'paysage' = 'paysage') => {
        switch (format) {
            case 'portrait':
                return 'aspect-[3/4]';
            case 'paysage':
            default:
                return 'aspect-[16/9]';
        }
    };

    // Mesurer le temps de chargement des images
    const handleImageLoad = useCallback((id: string, startTime: number) => {
        const loadTime = performance.now() - startTime;
        setLoadTimes((prev) => ({
            ...prev,
            [id]: loadTime,
        }));
    }, []);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">
                Gestion des médias pour &quot;{evenement.titre}&quot;
            </h2>

            {/* Formulaire d'édition de média */}
            {showEditForm && editingMedia && (
                <form
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
                                    Catégorie (optionnel)
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
                                <p className="mt-1 text-xs text-gray-500">
                                    La catégorie est utilisée pour organiser les médias dans la
                                    galerie
                                </p>
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

                            {/* Upload de miniature (pour les vidéos) */}
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
                                                id="thumbnail-upload"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Prévisualisation
                                </h4>
                                {editingMedia.isVideo ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Lecteur vidéo */}
                                        <div
                                            className={`relative bg-black rounded-lg overflow-hidden ${getItemSizeClass(editingMedia.format)}`}
                                        >
                                            <video
                                                src={getMediaUrl(editingMedia.path)}
                                                className="w-full h-full object-contain"
                                                controls
                                                poster={previewThumbnail || editingMedia.thumbnail}
                                            />
                                        </div>

                                        {/* Miniature */}
                                        <div
                                            className={`relative bg-gray-100 rounded-lg overflow-hidden ${getItemSizeClass(editingMedia.format)}`}
                                        >
                                            {previewThumbnail || editingMedia.thumbnail ? (
                                                <div className="relative h-full group">
                                                    <Image
                                                        src={getMediaUrl(
                                                            previewThumbnail ||
                                                                editingMedia.thumbnail!,
                                                        )}
                                                        alt="Miniature"
                                                        fill
                                                        className="object-cover"
                                                    />

                                                    {/* Catégorie (badge en haut à gauche) */}
                                                    {editingMedia.category && (
                                                        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                                                            {editingMedia.category}
                                                        </div>
                                                    )}

                                                    {/* Titre avec effet de fondu */}
                                                    {editingMedia.title && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <h3 className="text-white text-lg font-medium">
                                                                {editingMedia.title}
                                                            </h3>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-12 w-12 text-gray-400"
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
                                                    <p className="text-gray-500 text-sm mt-2">
                                                        Aucune miniature
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`relative bg-gray-100 rounded-lg overflow-hidden ${getItemSizeClass(editingMedia.format)}`}
                                    >
                                        <div className="relative group h-full">
                                            <Image
                                                src={getMediaUrl(editingMedia.path)}
                                                alt={editingMedia.title || 'Aperçu'}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />

                                            {/* Catégorie (badge en haut à gauche) */}
                                            {editingMedia.category && (
                                                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                                                    {editingMedia.category}
                                                </div>
                                            )}

                                            {/* Titre avec effet de fondu */}
                                            {editingMedia.title && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <h3 className="text-white text-lg font-medium">
                                                        {editingMedia.title}
                                                    </h3>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Boutons d'action */}
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

            {/* Section pour l'import des images */}
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Importer des médias</h3>

                {/* Sélection de catégorie pour l'upload */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie pour les nouveaux médias (optionnel)
                    </label>
                    <div className="flex space-x-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Aucune catégorie</option>
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
                    {selectedCategory && (
                        <p className="mt-1 text-xs text-gray-500">
                            Tous les médias uploadés seront assignés à la catégorie "
                            {selectedCategory}"
                        </p>
                    )}
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

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                            {selectedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                                >
                                    {file.type.startsWith('video/') ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-12 w-12 text-white"
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
                                        </div>
                                    ) : (
                                        <Image
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            fill
                                            className="object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                uploading ? 'bg-indigo-400' : 'bg-black hover:bg-black/80'
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
                                <span className="flex items-center justify-center">
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
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    Importer les médias
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Section de gestion des images */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Gestion des médias ({images.length})</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleDeleteAllMedia}
                            disabled={images.length === 0}
                            className={`px-3 py-1.5 rounded-md text-white flex items-center space-x-1 ${
                                images.length === 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 transition-colors'
                            }`}
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
                            <span>Supprimer tous les médias ({images.length})</span>
                        </button>
                    </div>
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
                            {images.length > 0 ? (
                                images
                                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                                    .map((image) => (
                                        <tr key={image.id}>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <div className="flex flex-col items-center">
                                                    <button
                                                        onClick={() =>
                                                            handleReorder(image.id, 'up')
                                                        }
                                                        disabled={image.order === 0}
                                                        className={`text-gray-500 hover:text-gray-700 mb-1 ${image.order === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
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
                                                        {image.order}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            handleReorder(image.id, 'down')
                                                        }
                                                        disabled={image.order === images.length - 1}
                                                        className={`text-gray-500 hover:text-gray-700 mt-1 ${image.order === images.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
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
                                                    {image.isVideo ? (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                                            {image.thumbnail ? (
                                                                <Image
                                                                    src={getMediaUrl(
                                                                        image.thumbnail,
                                                                    )}
                                                                    alt={
                                                                        image.title ||
                                                                        'Miniature vidéo'
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
                                                            src={getMediaUrl(image.path)}
                                                            alt={image.title || 'Image'}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${image.isVideo ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                                                >
                                                    {image.isVideo ? 'Vidéo' : 'Image'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                {image.title || 'Sans titre'}
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${image.format === 'portrait' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}`}
                                                >
                                                    {image.format === 'portrait'
                                                        ? 'Portrait'
                                                        : 'Paysage'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                {formatSize(image.size || 0)}
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${image.category ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
                                                >
                                                    {image.category || 'Non catégorisé'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(image);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteMedia(image.id);
                                                        }}
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
                                    <td colSpan={7} className="px-6 py-10 text-center">
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
