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
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import VideoUpload, { VideoData } from '../../../components/VideoUpload';
import { getMediaUrl } from '../../../utils/mediaUrl';
import {
    VideoProvider,
    getVideoProvider,
    extractVideoId,
    getVideoThumbnail,
    isExternalVideo,
} from '../../../utils/videoManager';
import MediaForm, { MediaFormData } from '../../components/MediaForm';
import { db } from '../../lib/firebase-client';
import { EventMediaItem, Evenement } from '../../models/eventTypes';

// Fonction utilitaire pour filtrer les champs undefined
const removeUndefinedFields = (obj: Record<string, any>): Record<string, any> => {
    return Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .reduce(
            (acc, [key, value]) => ({
                ...acc,
                [key]: value,
            }),
            {},
        );
};

interface EventsMediaManagerProps {
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

// Composant pour chaque ligne sortable
interface SortableRowProps {
    media: EventMediaItem;
    onEdit: (media: EventMediaItem) => void;
    onDelete: (id: string) => void;
    formatSize: (size: number) => string;
    getMediaUrl: (path: string) => string;
}

function SortableRow({ media, onEdit, onDelete, formatSize, getMediaUrl }: SortableRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: media.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`${isDragging ? 'bg-gray-50 shadow-lg z-10' : ''} hover:bg-gray-50 transition-colors`}
        >
            {/* Poignée de drag */}
            <td className="px-3 py-4 whitespace-nowrap">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex items-center justify-center cursor-grab active:cursor-grabbing p-2 rounded hover:bg-gray-100 transition-colors"
                    title="Glisser pour réorganiser"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8h16M4 16h16"
                        />
                    </svg>
                </div>
            </td>

            {/* Aperçu */}
            <td className="px-3 py-4 whitespace-nowrap">
                <div className="w-20 h-12 relative rounded overflow-hidden">
                    {media.isVideo ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                            {media.thumbnail ? (
                                <Image
                                    src={getMediaUrl(media.thumbnail)}
                                    alt={media.title || 'Miniature vidéo'}
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

            {/* Type */}
            <td className="px-3 py-4 whitespace-nowrap">
                <div className="flex flex-col space-y-1">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                            media.isVideo
                                ? media.provider === 'youtube' || media.isYouTube
                                    ? 'bg-red-100 text-red-800'
                                    : media.provider === 'dailymotion'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                        }`}
                    >
                        {media.isVideo
                            ? media.provider === 'youtube' || media.isYouTube
                                ? 'YouTube'
                                : media.provider === 'dailymotion'
                                  ? 'Dailymotion'
                                  : 'Vidéo'
                            : 'Image'}
                    </span>
                </div>
            </td>

            {/* Titre */}
            <td className="px-3 py-4 whitespace-nowrap">
                <div className="max-w-[200px] truncate" title={media.title || 'Sans titre'}>
                    {media.title || 'Sans titre'}
                </div>
            </td>

            {/* Format */}
            <td className="px-3 py-4 whitespace-nowrap">
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        media.format === 'portrait'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}
                >
                    {media.format === 'portrait' ? 'Portrait' : 'Paysage'}
                </span>
            </td>

            {/* Poids */}
            <td className="px-3 py-4 whitespace-nowrap">{formatSize(media.size || 0)}</td>

            {/* Catégorie */}
            <td className="px-3 py-4 whitespace-nowrap">
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        media.category
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {media.category || 'Non catégorisé'}
                </span>
            </td>

            {/* Actions */}
            <td className="px-3 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(media)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                        Modifier
                    </button>
                    <button
                        onClick={() => onDelete(media.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                    >
                        Supprimer
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function EventsMediaManager({
    evenement,
    onStatusChange,
    onStatsChange,
}: EventsMediaManagerProps) {
    const router = useRouter();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [medias, setMedias] = useState<EventMediaItem[]>(evenement.images || []);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // États pour l'édition
    const [editingMedia, setEditingMedia] = useState<EventMediaItem | null>(null);
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [showForm, setShowForm] = useState(false);

    // États pour le nouveau formulaire MediaForm
    const [formData, setFormData] = useState<MediaFormData>({
        title: '',
        category: '',
        source: '',
        format: 'paysage',
        order: 0,
        thumbnail: '',
        isVideo: false,
        isYouTube: false,
        provider: 'local',
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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

    // Fonction pour calculer les statistiques
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

    useEffect(() => {
        setMedias(evenement.images || []);
    }, [evenement]);

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

            // Traiter chaque fichier
            const newMedias: EventMediaItem[] = [];
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const url = uploadResult.fileUrls[i];

                if (!url) continue;

                const id = url.split('/').pop()?.split('.')[0] || `media-${Date.now()}`;
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

                const mediaItem = {
                    id,
                    path: url,
                    title: '',
                    source: url,
                    isVideo,
                    format,
                    order: medias.length + i,
                    thumbnail,
                    selected: false,
                    size: file.size,
                    category: selectedCategory || undefined,
                    provider: 'local' as const,
                };

                newMedias.push(removeUndefinedFields(mediaItem) as EventMediaItem);
            }

            const updatedImages = [...medias, ...newMedias];
            const cleanedImages = updatedImages.map((img) => removeUndefinedFields(img));

            // Mettre à jour Firestore
            const eventRef = doc(db, 'evenements', evenement.id!);
            await updateDoc(eventRef, {
                images: cleanedImages,
            });

            setMedias(updatedImages);
            setSelectedFiles([]);
            setSelectedCategory('');

            onStatusChange?.({
                type: 'success',
                message: `${newMedias.length} média(s) importé(s) avec succès`,
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
                `ATTENTION: Vous êtes sur le point de supprimer tous les médias (${medias.length}) de cet événement. Cette action est irréversible. Continuer?`,
            )
        ) {
            try {
                setUploading(true);
                const totalMediasToDelete = medias.length;

                // Supprimer les fichiers physiques
                for (const media of medias) {
                    try {
                        const isExternalVideo =
                            media.isVideo &&
                            (media.provider === 'youtube' ||
                                media.provider === 'dailymotion' ||
                                media.isYouTube ||
                                (media.path &&
                                    (media.path.includes('youtube.com') ||
                                        media.path.includes('youtu.be') ||
                                        media.path.includes('dailymotion.com'))));

                        if (media.path && !isExternalVideo) {
                            const fileName = media.path.split('/').pop();
                            if (fileName) {
                                await fetch(
                                    `/api/delete?path=evenements/${evenement.id}&name=${encodeURIComponent(fileName)}`,
                                    {
                                        method: 'DELETE',
                                    },
                                );
                            }
                        }

                        if (media.thumbnail && !media.thumbnail.startsWith('http')) {
                            const thumbnailName = media.thumbnail.split('/').pop();
                            if (thumbnailName) {
                                await fetch(
                                    `/api/delete?path=evenements/${evenement.id}/thumbnails&name=${encodeURIComponent(thumbnailName)}`,
                                    {
                                        method: 'DELETE',
                                    },
                                );
                            }
                        }
                    } catch (err) {
                        console.error("Erreur lors de la suppression d'un fichier:", err);
                    }
                }

                // Mettre à jour Firestore
                const eventRef = doc(db, 'evenements', evenement.id!);
                await updateDoc(eventRef, {
                    images: [],
                });

                setMedias([]);

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

                const isExternalVideo =
                    media.isVideo &&
                    (media.provider === 'youtube' ||
                        media.provider === 'dailymotion' ||
                        media.isYouTube ||
                        (media.path &&
                            (media.path.includes('youtube.com') ||
                                media.path.includes('youtu.be') ||
                                media.path.includes('dailymotion.com'))));

                if (media.path && !isExternalVideo) {
                    const fileName = media.path.split('/').pop();
                    if (fileName) {
                        await fetch(
                            `/api/delete?path=evenements/${evenement.id}&name=${encodeURIComponent(fileName)}`,
                            {
                                method: 'DELETE',
                            },
                        );
                    }
                }

                if (media.thumbnail && !media.thumbnail.startsWith('http')) {
                    const thumbnailName = media.thumbnail.split('/').pop();
                    if (thumbnailName) {
                        await fetch(
                            `/api/delete?path=evenements/${evenement.id}/thumbnails&name=${encodeURIComponent(thumbnailName)}`,
                            {
                                method: 'DELETE',
                            },
                        );
                    }
                }

                const updatedImages = medias.filter((img) => img.id !== mediaId);
                const cleanedImages = updatedImages.map((img) => removeUndefinedFields(img));

                const eventRef = doc(db, 'evenements', evenement.id!);
                await updateDoc(eventRef, {
                    images: cleanedImages,
                });

                setMedias(updatedImages);
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

    // Capteurs pour le drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Gestion du drag and drop
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const sortedMedias = [...medias].sort((a, b) => (a.order || 0) - (b.order || 0));
            const oldIndex = sortedMedias.findIndex((media) => media.id === active.id);
            const newIndex = sortedMedias.findIndex((media) => media.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(sortedMedias, oldIndex, newIndex);

                const updatedMedias = newOrder.map((media, index) => ({
                    ...media,
                    order: index,
                }));
                setMedias(updatedMedias);

                try {
                    const cleanedImages = updatedMedias.map((img) => removeUndefinedFields(img));
                    const eventRef = doc(db, 'evenements', evenement.id!);
                    await updateDoc(eventRef, {
                        images: cleanedImages,
                    });

                    onStatusChange?.({
                        type: 'success',
                        message: 'Ordre des médias mis à jour avec succès',
                    });
                } catch (error) {
                    console.error("Erreur lors de la mise à jour de l'ordre:", error);
                    onStatusChange?.({
                        type: 'error',
                        message: "Erreur lors de la mise à jour de l'ordre",
                    });
                    setMedias(evenement.images || []);
                }
            }
        }
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' octets';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' Ko';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
    };

    // Catégories disponibles
    const categories = Array.from(new Set(medias.map((media) => media.category))).filter(
        Boolean,
    ) as string[];

    // Convertir les données du formulaire en EventMediaItem
    const convertFormDataToMedia = (formData: MediaFormData): Partial<EventMediaItem> => {
        const isExternalVideo =
            formData.provider === 'youtube' || formData.provider === 'dailymotion';
        const isVideoFromFile = formData.isVideo || false;
        const isVideo = isExternalVideo || isVideoFromFile;

        const mediaData: Partial<EventMediaItem> = {
            title: formData.title || '',
            category: formData.category || '',
            source: formData.source,
            format: formData.format,
            order: formData.order,
            isVideo: isVideo,
            provider: formData.provider || 'local',
            isYouTube: formData.isYouTube || false,
        };

        if (formData.thumbnail) {
            mediaData.thumbnail = formData.thumbnail;
        }
        if (formData.videoId) {
            mediaData.videoId = formData.videoId;
        }
        if (formData.embedUrl) {
            mediaData.embedUrl = formData.embedUrl;
        }
        if (formData.watchUrl) {
            mediaData.watchUrl = formData.watchUrl;
        }
        if (formData.youtubeId) {
            mediaData.youtubeId = formData.youtubeId;
        }

        return mediaData;
    };

    // Initialiser le formulaire avec les données d'édition
    const initializeFormData = (media: EventMediaItem): MediaFormData => {
        return {
            title: media.title || '',
            category: media.category || '',
            source: media.source || media.path,
            format: media.format || 'paysage',
            order: media.order || 0,
            thumbnail: media.thumbnail || '',
            isVideo: media.isVideo || false,
            provider: media.provider || 'local',
            videoId: media.videoId || '',
            embedUrl: media.embedUrl || '',
            watchUrl: media.watchUrl || '',
            isYouTube: media.isYouTube || false,
            youtubeId: media.youtubeId || '',
        };
    };

    // Réinitialiser le formulaire
    const resetForm = () => {
        setFormData({
            title: '',
            category: '',
            source: '',
            format: 'paysage',
            order: 0,
            thumbnail: '',
            isVideo: false,
            isYouTube: false,
            provider: 'local',
            videoId: '',
            embedUrl: '',
            watchUrl: '',
            youtubeId: '',
        });
        setPreviewImage(null);
        setEditingMedia(null);
        setShowForm(false);
    };

    // Gérer la sauvegarde du nouveau formulaire
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            const mediaData = convertFormDataToMedia(formData);

            let updatedImages: EventMediaItem[];
            if (editingMedia) {
                // Mise à jour d'un média existant
                updatedImages = medias.map((img) =>
                    img.id === editingMedia.id
                        ? { ...img, ...mediaData, path: mediaData.source || img.path }
                        : img,
                );
                onStatusChange?.({
                    type: 'success',
                    message: 'Média mis à jour avec succès',
                });
            } else {
                // Création d'un nouveau média
                const newMedia: EventMediaItem = {
                    id: `media-${Date.now()}`,
                    path: mediaData.source || '',
                    source: mediaData.source || '',
                    title: mediaData.title || '',
                    category: mediaData.category || '',
                    isVideo: mediaData.isVideo || false,
                    format: mediaData.format || 'paysage',
                    order: mediaData.order || medias.length,
                    provider: mediaData.provider || 'local',
                    ...removeUndefinedFields({
                        thumbnail: mediaData.thumbnail,
                        videoId: mediaData.videoId,
                        embedUrl: mediaData.embedUrl,
                        watchUrl: mediaData.watchUrl,
                        isYouTube: mediaData.isYouTube,
                        youtubeId: mediaData.youtubeId,
                    }),
                };
                updatedImages = [...medias, newMedia];
                onStatusChange?.({
                    type: 'success',
                    message: 'Média ajouté avec succès',
                });
            }

            const cleanedImages = updatedImages.map((img) => removeUndefinedFields(img));

            const eventRef = doc(db, 'evenements', evenement.id!);
            await updateDoc(eventRef, {
                images: cleanedImages,
            });

            setMedias(updatedImages);
            resetForm();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            onStatusChange?.({
                type: 'error',
                message: 'Erreur lors de la sauvegarde du média',
            });
        } finally {
            setUploading(false);
        }
    };

    // Modifier la fonction d'édition pour utiliser le nouveau formulaire
    const handleEditWithNewForm = (media: EventMediaItem) => {
        setEditingMedia(media);
        setFormData(initializeFormData(media));
        setPreviewImage(media.source || media.path);
        setShowForm(true);
    };

    // Ajouter un nouveau média avec le nouveau formulaire
    const handleAddNewMedia = () => {
        resetForm();
        setFormData({
            ...formData,
            order: medias.length,
        });
        setShowForm(true);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Gestion des médias de l&apos;événement</h2>

            {/* Formulaire d'ajout de nouveau média */}
            {showForm && (
                <MediaForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleFormSubmit}
                    onCancel={resetForm}
                    categories={categories}
                    uploading={uploading}
                    previewImage={previewImage}
                    setPreviewImage={setPreviewImage}
                    editingMode={!!editingMedia}
                />
            )}

            {/* Section d'import */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Importer des médias</h3>
                    <button
                        onClick={handleAddNewMedia}
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
                        <span>Nouveau média</span>
                    </button>
                </div>

                {/* Sélection de catégorie */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie pour les nouveaux médias
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
                                'Importer les médias'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Tableau des médias avec drag and drop */}
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="w-16 px-3 py-3 text-center">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ordre
                                        </span>
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
                                    <SortableContext
                                        items={medias.map((m) => m.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {medias
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((media) => (
                                                <SortableRow
                                                    key={media.id}
                                                    media={media}
                                                    onEdit={handleEditWithNewForm}
                                                    onDelete={handleDeleteMedia}
                                                    formatSize={formatSize}
                                                    getMediaUrl={getMediaUrl}
                                                />
                                            ))}
                                    </SortableContext>
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
                    </DndContext>
                </div>
            </div>
        </div>
    );
}
