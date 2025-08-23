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
import {
    doc,
    updateDoc,
    collection,
    getDocs,
    orderBy,
    query,
    addDoc,
    deleteDoc,
} from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { VideoProvider } from '../../../utils/videoManager';
import MediaForm, { MediaFormData } from '../../components/MediaForm';
import { db } from '../../lib/firebase-client';

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

// Fonctions helper pour éviter les ternaires imbriqués
const getProviderBadgeClasses = (provider?: VideoProvider, isYouTube?: boolean): string => {
    if (provider === 'youtube' || isYouTube) {
        return 'bg-red-100 text-red-800';
    }
    if (provider === 'dailymotion') {
        return 'bg-orange-100 text-orange-800';
    }
    return 'bg-blue-100 text-blue-800';
};

const getProviderLabel = (provider?: VideoProvider, isYouTube?: boolean): string => {
    if (provider === 'youtube' || isYouTube) {
        return 'YouTube';
    }
    if (provider === 'dailymotion') {
        return 'Dailymotion';
    }
    return 'Vidéo';
};

interface Video {
    id: string;
    title?: string;
    category: string;
    source: string;
    thumbnail?: string;
    duration?: number;
    order: number;
    size?: number;
    format: 'portrait' | 'paysage';
    provider: VideoProvider;
    videoId?: string;
    embedUrl?: string;
    watchUrl?: string;
    isExternal?: boolean;
    // Propriétés de rétrocompatibilité
    youtubeUrl?: string;
    youtubeId?: string;
    isYouTube?: boolean;
}

interface VideosTabProps {
    readonly onStatusChange?: (
        status: { type: 'success' | 'error'; message: string } | null,
    ) => void;
}

export interface VideoStats {
    totalCount: number;
    totalSize: number;
    videoCount: number;
    localVideosCount: number;
    externalVideosCount: number;
    averageLoadTime: number;
}

// Composant pour chaque ligne sortable
interface SortableRowProps {
    readonly video: Video;
    readonly onEdit: (video: Video) => void;
    readonly onDelete: (id: string) => void;
    readonly formatSize: (size: number) => string;
    readonly formatDuration: (seconds: number) => string;
    readonly getMediaUrl: (path: string) => string;
}

function SortableRow({
    video,
    onEdit,
    onDelete,
    formatSize,
    formatDuration,
    getMediaUrl,
}: SortableRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: video.id,
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
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        {video.thumbnail && !video.thumbnail.includes('thumbnail.jpg') ? (
                            <Image
                                src={getMediaUrl(video.thumbnail)}
                                alt={video.title || 'Miniature vidéo'}
                                fill
                                className="object-cover"
                            />
                        ) : video.provider === 'local' && video.source ? (
                            <video
                                src={getMediaUrl(video.source)}
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                                onLoadedData={(e) => {
                                    const videoElement = e.target as HTMLVideoElement;
                                    videoElement.currentTime = 1; // Aller à 1 seconde pour éviter le noir
                                }}
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
                </div>
            </td>

            {/* Type */}
            <td className="px-3 py-4 whitespace-nowrap">
                <div className="flex flex-col space-y-1">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${getProviderBadgeClasses(
                            video.provider,
                            video.isYouTube,
                        )}`}
                    >
                        {getProviderLabel(video.provider, video.isYouTube)}
                    </span>
                </div>
            </td>

            {/* Titre */}
            <td className="px-3 py-4 whitespace-nowrap">
                <div className="max-w-[200px] truncate" title={video.title || 'Sans titre'}>
                    {video.title || 'Sans titre'}
                </div>
            </td>

            {/* Format */}
            <td className="px-3 py-4 whitespace-nowrap">
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        video.format === 'portrait'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}
                >
                    {video.format === 'portrait' ? 'Portrait' : 'Paysage'}
                </span>
            </td>

            {/* Durée */}
            <td className="px-3 py-4 whitespace-nowrap">{formatDuration(video.duration || 0)}</td>

            {/* Poids */}
            <td className="px-3 py-4 whitespace-nowrap">{formatSize(video.size || 0)}</td>

            {/* Catégorie */}
            <td className="px-3 py-4 whitespace-nowrap">
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        video.category
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {video.category || 'Non catégorisé'}
                </span>
            </td>

            {/* Actions */}
            <td className="px-3 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(video)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                        Modifier
                    </button>
                    <button
                        onClick={() => onDelete(video.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                    >
                        Supprimer
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function VideosTab({ onStatusChange }: VideosTabProps) {
    const router = useRouter();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // États pour l'édition
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // États pour le nouveau formulaire MediaForm
    const [formData, setFormData] = useState<MediaFormData>({
        title: '',
        category: '',
        source: '',
        format: 'paysage',
        order: 0,
        thumbnail: '',
        isVideo: true,
        isYouTube: false,
        provider: 'local',
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Statistiques
    const [stats, setStats] = useState<VideoStats>({
        totalCount: 0,
        totalSize: 0,
        videoCount: 0,
        localVideosCount: 0,
        externalVideosCount: 0,
        averageLoadTime: 0,
    });

    // Fonction pour détecter si une vidéo est externe
    const isExternalVideo = useCallback((video: Video): boolean => {
        if (video.provider === 'youtube' || video.provider === 'dailymotion') {
            return true;
        }

        if (video.isYouTube) {
            return true;
        }

        if (video.source) {
            return (
                video.source.includes('youtube.com') ||
                video.source.includes('youtu.be') ||
                video.source.includes('dailymotion.com')
            );
        }

        return false;
    }, []);

    // Fonction pour calculer les statistiques
    const calculateStats = useCallback(() => {
        let totalSize = 0;
        let localVideosCount = 0;
        let externalVideosCount = 0;

        videos.forEach((video) => {
            const isExternal = isExternalVideo(video);

            if (isExternal) {
                externalVideosCount++;
                // Les vidéos externes ne prennent pas de place sur le serveur
            } else {
                localVideosCount++;
                // Seulement compter la taille des vidéos locales
                totalSize += video.size || 0;
            }
        });

        // Calculer le temps de chargement moyen basé seulement sur les vidéos locales
        const averageLoadTime =
            localVideosCount > 0
                ? (((totalSize * 8) / (15 * 1024 * 1024)) * 1000) / localVideosCount
                : 0;

        const newStats: VideoStats = {
            totalCount: videos.length,
            totalSize, // Taille réelle uniquement des vidéos locales
            videoCount: videos.length,
            localVideosCount,
            externalVideosCount,
            averageLoadTime,
        };

        setStats(newStats);
    }, [videos, isExternalVideo]);

    // Charger les vidéos
    const fetchVideos = useCallback(async () => {
        try {
            setLoading(true);
            const videosCollection = collection(db, 'videos');
            const videosQuery = query(videosCollection, orderBy('order', 'asc'));
            const videosSnapshot = await getDocs(videosQuery);

            if (!videosSnapshot.empty) {
                const fetchedVideos = videosSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    // Supprimer l'ancien ID des données pour éviter les conflits
                    delete data.id;
                    return {
                        id: doc.id, // Toujours utiliser l'ID du document Firestore
                        ...data,
                    };
                }) as Video[];
                setVideos(fetchedVideos);
            } else {
                setVideos([]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des vidéos:', error);
            onStatusChange?.({
                type: 'error',
                message: 'Erreur lors de la récupération des vidéos',
            });
        } finally {
            setLoading(false);
        }
    }, [onStatusChange]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    useEffect(() => {
        calculateStats();
    }, [videos, calculateStats]);

    // Gestion des fichiers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(filesArray);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const filesArray = Array.from(e.dataTransfer.files);
            // Filtrer pour ne garder que les vidéos
            const videoFiles = filesArray.filter((file) => file.type.startsWith('video/'));
            setSelectedFiles(videoFiles);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Upload des vidéos
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
            formData.append('path', 'videos');
            formData.append('useUuid', 'false');

            // Utiliser XMLHttpRequest pour le tracking du progrès
            const response = await new Promise<Response>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = (event.loaded / event.total) * 100;
                        setUploadProgress(Math.round(progress));
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const mockResponse = new Response(xhr.responseText, {
                            status: xhr.status,
                            statusText: xhr.statusText,
                        });
                        resolve(mockResponse);
                    } else {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error("Erreur réseau lors de l'upload"));
                });

                xhr.open('POST', '/api/upload/batch');
                xhr.send(formData);
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'upload des vidéos");
            }

            const uploadResult = await response.json();

            // Traiter chaque fichier
            const newVideos: Omit<Video, 'id'>[] = [];

            if (!uploadResult.fileUrls || !Array.isArray(uploadResult.fileUrls)) {
                throw new Error('Aucun fichier uploadé avec succès');
            }

            for (let i = 0; i < uploadResult.fileUrls.length; i++) {
                const url = uploadResult.fileUrls[i];
                const file = selectedFiles[i];

                if (!url || !file) continue;

                const format = await detectFormat(file);

                let thumbnail = '';
                thumbnail = await generateThumbnail(file);
                if (thumbnail) {
                    const thumbnailBlob = await fetch(thumbnail).then((r) => r.blob());
                    const thumbnailFile = new File([thumbnailBlob], `thumbnail.jpg`, {
                        type: 'image/jpeg',
                    });

                    const thumbnailFormData = new FormData();
                    thumbnailFormData.append('file', thumbnailFile);
                    thumbnailFormData.append('path', 'videos/thumbnails');
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

                const duration = await extractVideoDuration(file);

                const videoItem: Omit<Video, 'id'> = {
                    source: url,
                    title: '',
                    category: selectedCategory || '',
                    format,
                    order: videos.length + i,
                    thumbnail,
                    size: file.size,
                    provider: 'local',
                    duration,
                };

                newVideos.push(videoItem);
            }

            // Sauvegarder en base
            for (const video of newVideos) {
                const cleanedVideo = removeUndefinedFields(video);
                await addDoc(collection(db, 'videos'), cleanedVideo);
            }

            await fetchVideos();
            setSelectedFiles([]);
            setSelectedCategory('');

            onStatusChange?.({
                type: 'success',
                message: `${newVideos.length} vidéo(s) importée(s) avec succès`,
            });

            router.refresh();
        } catch (error) {
            console.error("Erreur lors de l'upload:", error);
            onStatusChange?.({
                type: 'error',
                message: "Erreur lors de l'upload des vidéos",
            });
        } finally {
            setUploading(false);
            setUploadProgress(100);
        }
    };

    // Détecter le format
    const detectFormat = async (file: File): Promise<'portrait' | 'paysage'> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true; // Nécessaire pour certains navigateurs

            video.onloadedmetadata = () => {
                try {
                    const format = video.videoWidth < video.videoHeight ? 'portrait' : 'paysage';
                    URL.revokeObjectURL(video.src);
                    resolve(format);
                } catch (error) {
                    URL.revokeObjectURL(video.src);
                    reject(
                        error instanceof Error
                            ? error
                            : new Error('Erreur lors de la détection du format'),
                    );
                }
            };

            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                // Si erreur, on assume format paysage par défaut
                resolve('paysage');
            };

            try {
                video.src = URL.createObjectURL(file);
            } catch (error) {
                console.warn('Erreur lors de la création du blob URL:', error);
                resolve('paysage');
            }
        });
    };

    // Extraire la durée d'une vidéo
    const extractVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;

            video.onloadedmetadata = () => {
                try {
                    const duration = video.duration || 0;
                    URL.revokeObjectURL(video.src);
                    resolve(duration);
                } catch (error) {
                    console.warn("Erreur lors de l'extraction de la durée:", error);
                    URL.revokeObjectURL(video.src);
                    resolve(0);
                }
            };

            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                resolve(0);
            };

            try {
                video.src = URL.createObjectURL(file);
            } catch (error) {
                console.warn('Erreur lors de la création du blob URL pour la durée:', error);
                resolve(0);
            }
        });
    };

    // Générer miniature vidéo
    const generateThumbnail = async (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.muted = true;
            video.preload = 'metadata';

            video.onloadeddata = () => {
                try {
                    // Aller au milieu de la vidéo pour la miniature
                    video.currentTime = Math.max(video.duration / 2, 1);
                } catch (error) {
                    console.warn('Erreur lors du positionnement de la vidéo:', error);
                    resolve('');
                }
            };

            video.onseeked = () => {
                try {
                    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
                        URL.revokeObjectURL(video.src);
                        resolve('');
                        return;
                    }

                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                    URL.revokeObjectURL(video.src);
                    resolve(thumbnail);
                } catch (error) {
                    console.warn('Erreur lors de la génération de la miniature:', error);
                    URL.revokeObjectURL(video.src);
                    resolve('');
                }
            };

            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                resolve('');
            };

            try {
                video.src = URL.createObjectURL(file);
            } catch (error) {
                console.warn('Erreur lors de la création du blob URL pour la miniature:', error);
                resolve('');
            }
        });
    };

    // Supprimer toutes les vidéos
    const handleDeleteAllVideos = async () => {
        if (videos.length === 0) {
            onStatusChange?.({
                type: 'error',
                message: 'Aucune vidéo à supprimer',
            });
            return;
        }

        if (
            window.confirm(
                `ATTENTION: Vous êtes sur le point de supprimer toutes les vidéos (${videos.length}). Cette action est irréversible. Continuer?`,
            )
        ) {
            try {
                setUploading(true);
                const totalVideosToDelete = videos.length;

                // Supprimer les fichiers physiques
                for (const video of videos) {
                    try {
                        const isExternal = isExternalVideo(video);

                        // Supprimer le fichier vidéo principal
                        if (video.source && !isExternal) {
                            const fileName = video.source.split('/').pop();
                            if (fileName) {
                                try {
                                    const response = await fetch(
                                        `/api/delete?path=videos&name=${encodeURIComponent(fileName)}`,
                                        {
                                            method: 'DELETE',
                                        },
                                    );
                                    if (!response.ok) {
                                        console.warn(
                                            `Erreur lors de la suppression du fichier ${fileName}`,
                                        );
                                    }
                                } catch (err) {
                                    console.warn(
                                        `Impossible de supprimer le fichier ${fileName}:`,
                                        err,
                                    );
                                }
                            }
                        }

                        // Supprimer la miniature si elle existe
                        if (
                            video.thumbnail &&
                            !video.thumbnail.startsWith('http') &&
                            !video.thumbnail.includes('thumbnail.jpg')
                        ) {
                            const thumbnailName = video.thumbnail.split('/').pop();
                            if (thumbnailName) {
                                try {
                                    const response = await fetch(
                                        `/api/delete?path=videos/thumbnails&name=${encodeURIComponent(thumbnailName)}`,
                                        {
                                            method: 'DELETE',
                                        },
                                    );
                                    if (!response.ok) {
                                        console.warn(
                                            `Erreur lors de la suppression de la miniature ${thumbnailName}`,
                                        );
                                    }
                                } catch (err) {
                                    console.warn(
                                        `Impossible de supprimer la miniature ${thumbnailName}:`,
                                        err,
                                    );
                                }
                            }
                        }

                        // Supprimer de Firestore
                        await deleteDoc(doc(db, 'videos', video.id));
                    } catch (err) {
                        console.error("Erreur lors de la suppression d'une vidéo:", err);
                    }
                }

                // Recharger les vidéos après suppression
                await fetchVideos();

                onStatusChange?.({
                    type: 'success',
                    message: `Toutes les vidéos (${totalVideosToDelete}) ont été supprimées avec succès`,
                });

                // Rafraîchir la page pour s'assurer que tous les composants se mettent à jour
                router.refresh();
            } catch (error) {
                console.error('Erreur lors de la suppression de toutes les vidéos:', error);
                onStatusChange?.({
                    type: 'error',
                    message: 'Erreur lors de la suppression des vidéos',
                });
            } finally {
                setUploading(false);
            }
        }
    };

    // Supprimer une vidéo
    const handleDeleteVideo = async (videoId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
            try {
                const video = videos.find((v) => v.id === videoId);
                if (!video) return;

                const isExternal = isExternalVideo(video);

                // Supprimer le fichier vidéo principal
                if (video.source && !isExternal) {
                    const fileName = video.source.split('/').pop();
                    if (fileName) {
                        try {
                            const response = await fetch(
                                `/api/delete?path=videos&name=${encodeURIComponent(fileName)}`,
                                {
                                    method: 'DELETE',
                                },
                            );
                            if (!response.ok) {
                                console.warn(
                                    `Erreur lors de la suppression du fichier ${fileName}`,
                                );
                            }
                        } catch (err) {
                            console.warn(`Impossible de supprimer le fichier ${fileName}:`, err);
                        }
                    }
                }

                // Supprimer la miniature si elle existe
                if (
                    video.thumbnail &&
                    !video.thumbnail.startsWith('http') &&
                    !video.thumbnail.includes('thumbnail.jpg')
                ) {
                    const thumbnailName = video.thumbnail.split('/').pop();
                    if (thumbnailName) {
                        try {
                            const response = await fetch(
                                `/api/delete?path=videos/thumbnails&name=${encodeURIComponent(thumbnailName)}`,
                                {
                                    method: 'DELETE',
                                },
                            );
                            if (!response.ok) {
                                console.warn(
                                    `Erreur lors de la suppression de la miniature ${thumbnailName}`,
                                );
                            }
                        } catch (err) {
                            console.warn(
                                `Impossible de supprimer la miniature ${thumbnailName}:`,
                                err,
                            );
                        }
                    }
                }

                await deleteDoc(doc(db, 'videos', videoId));
                await fetchVideos();

                onStatusChange?.({
                    type: 'success',
                    message: 'Vidéo supprimée avec succès',
                });

                router.refresh();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                onStatusChange?.({
                    type: 'error',
                    message: 'Erreur lors de la suppression de la vidéo',
                });
            }
        }
    };

    // Autres fonctions et render
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' octets';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' Ko';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Configuration pour le drag and drop
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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const sortedVideos = [...videos].sort((a, b) => (a.order || 0) - (b.order || 0));
            const oldIndex = sortedVideos.findIndex((video) => video.id === active.id);
            const newIndex = sortedVideos.findIndex((video) => video.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(sortedVideos, oldIndex, newIndex);
                const updatedVideos = newOrder.map((video, index) => ({
                    ...video,
                    order: index,
                }));
                setVideos(updatedVideos);

                try {
                    for (const video of updatedVideos) {
                        await updateDoc(doc(db, 'videos', video.id), { order: video.order });
                    }
                    onStatusChange?.({
                        type: 'success',
                        message: 'Ordre des vidéos mis à jour avec succès',
                    });
                } catch (error) {
                    console.error('Erreur lors de la réorganisation:', error);
                    onStatusChange?.({
                        type: 'error',
                        message: 'Erreur lors de la réorganisation',
                    });
                    await fetchVideos();
                }
            }
        }
    };

    const categories = Array.from(new Set(videos.map((video) => video.category))).filter(Boolean);

    const initializeFormData = (video: Video): MediaFormData => ({
        title: video.title || '',
        category: video.category || '',
        source: video.source,
        format: video.format || 'paysage',
        order: video.order || 0,
        thumbnail: video.thumbnail || '',
        isVideo: true,
        provider: video.provider || 'local',
        videoId: video.videoId || '',
        embedUrl: video.embedUrl || '',
        watchUrl: video.watchUrl || '',
        isYouTube: video.isYouTube || false,
        youtubeId: video.youtubeId || '',
    });

    const resetForm = () => {
        setFormData({
            title: '',
            category: '',
            source: '',
            format: 'paysage',
            order: 0,
            thumbnail: '',
            isVideo: true,
            isYouTube: false,
            provider: 'local',
            videoId: '',
            embedUrl: '',
            watchUrl: '',
            youtubeId: '',
        });
        setPreviewImage(null);
        setEditingVideo(null);
        setShowForm(false);
    };

    const convertFormDataToVideo = (formData: MediaFormData): Partial<Video> => ({
        title: formData.title || '',
        category: formData.category || '',
        source: formData.source,
        format: formData.format,
        order: formData.order,
        provider: formData.provider || 'local',
        isYouTube: formData.isYouTube || false,
        ...(formData.thumbnail && { thumbnail: formData.thumbnail }),
        ...(formData.videoId && { videoId: formData.videoId }),
        ...(formData.embedUrl && { embedUrl: formData.embedUrl }),
        ...(formData.watchUrl && { watchUrl: formData.watchUrl }),
        ...(formData.youtubeId && { youtubeId: formData.youtubeId }),
    });

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            const videoData = convertFormDataToVideo(formData);

            if (editingVideo) {
                await updateDoc(
                    doc(db, 'videos', editingVideo.id),
                    removeUndefinedFields({
                        ...editingVideo,
                        ...videoData,
                    }),
                );
                onStatusChange?.({ type: 'success', message: 'Vidéo mise à jour avec succès' });
            } else {
                await addDoc(
                    collection(db, 'videos'),
                    removeUndefinedFields({
                        ...videoData,
                        order: videos.length,
                    }),
                );
                onStatusChange?.({ type: 'success', message: 'Vidéo ajoutée avec succès' });
            }

            await fetchVideos();
            resetForm();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            onStatusChange?.({
                type: 'error',
                message: 'Erreur lors de la sauvegarde de la vidéo',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleEditWithNewForm = (video: Video) => {
        setEditingVideo(video);
        setFormData(initializeFormData(video));
        setPreviewImage(video.source);
        setShowForm(true);

        // Remonter en haut de la page pour voir le formulaire
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    const handleAddNewVideo = () => {
        resetForm();
        setFormData({ ...formData, order: videos.length });
        setShowForm(true);

        // Remonter en haut de la page pour voir le formulaire
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Gestion de la galerie vidéos</h2>

            {/* Section Statistiques */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">Statistiques des Vidéos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total vidéos</p>
                        <p className="text-3xl font-bold">{stats.totalCount}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Vidéos locales</p>
                        <p className="text-3xl font-bold">{stats.localVideosCount}</p>
                        <p className="text-xs text-gray-500">Hébergées sur le serveur</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-sm text-indigo-600 font-medium">Vidéos externes</p>
                        <p className="text-3xl font-bold">{stats.externalVideosCount}</p>
                        <p className="text-xs text-gray-500">YouTube, Dailymotion</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Espace utilisé</p>
                        <p className="text-3xl font-bold">{formatSize(stats.totalSize)}</p>
                        <p className="text-xs text-gray-500">Vidéos locales uniquement</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Temps chargement</p>
                        <p className="text-3xl font-bold">
                            {stats.averageLoadTime < 1000
                                ? Math.round(stats.averageLoadTime) + ' ms'
                                : (stats.averageLoadTime / 1000).toFixed(1) + ' s'}
                        </p>
                        <p className="text-xs text-gray-500">Vidéos locales - 15 Mbps</p>
                    </div>
                </div>
            </div>

            {/* Formulaire d'ajout de nouvelle vidéo */}
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
                    editingMode={!!editingVideo}
                />
            )}

            {/* Section d'import */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Importer des vidéos</h3>
                    <button
                        onClick={handleAddNewVideo}
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
                        <span>Nouvelle vidéo</span>
                    </button>
                </div>

                {/* Sélection de catégorie */}
                <div className="mb-4">
                    <label
                        htmlFor="categorySelect"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Catégorie pour les nouvelles vidéos
                    </label>
                    <div className="flex space-x-2">
                        <select
                            id="categorySelect"
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

                <button
                    type="button"
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors w-full ${
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
                        accept="video/*"
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
                        Glissez-déposez vos vidéos ici ou cliquez pour parcourir
                    </p>
                    <p className="text-gray-500 text-sm">
                        Formats acceptés: MP4, WEBM, MOV, AVI pour les vidéos
                    </p>
                </button>

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
                                'Importer les vidéos'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Tableau des vidéos avec drag and drop */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Gestion des vidéos ({videos.length})</h3>
                    {videos.length > 0 && (
                        <button
                            onClick={handleDeleteAllVideos}
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
                                        Durée
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
                                {videos.length > 0 ? (
                                    <SortableContext
                                        items={videos.map((v) => v.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {[...videos]
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((video) => (
                                                <SortableRow
                                                    key={video.id}
                                                    video={video}
                                                    onEdit={handleEditWithNewForm}
                                                    onDelete={handleDeleteVideo}
                                                    formatSize={formatSize}
                                                    formatDuration={formatDuration}
                                                    getMediaUrl={getMediaUrl}
                                                />
                                            ))}
                                    </SortableContext>
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-10 text-center">
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
                                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                <p className="text-gray-500 text-lg font-medium">
                                                    Aucune vidéo trouvée
                                                </p>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Importez des vidéos en utilisant la section
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
