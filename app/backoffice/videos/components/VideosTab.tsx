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

import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface Video {
    id?: string;
    title?: string;
    category: string;
    source: string;
    thumbnail: string;
    duration: number;
    order: number;
    size: number; // Taille en bytes
    format: 'portrait' | 'paysage'; // Ajout du format
}

interface VideoStats {
    totalVideos: number;
    totalDuration: number;
    averageLoadTime: number;
    totalSize: number;
}

interface VideosTabProps {
    onStatusChange?: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function VideosTab({ onStatusChange }: VideosTabProps) {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [stats, setStats] = useState<VideoStats>({
        totalVideos: 0,
        totalDuration: 0,
        averageLoadTime: 0,
        totalSize: 0,
    });
    const [formData, setFormData] = useState<Partial<Video>>({
        title: '',
        category: '',
        source: '',
        thumbnail: '',
        order: 0,
    });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

    // Extraire les catégories uniques des vidéos
    const categories = Array.from(new Set(videos.map((video) => video.category))).filter(
        Boolean,
    );

    // Fonction pour formater la durée en minutes:secondes
    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Fonction pour formater le temps de chargement
    const formatLoadTime = (ms: number): string => {
        if (ms < 1000) {
            return ms.toFixed(0) + ' ms';
        } else {
            return (ms / 1000).toFixed(2) + ' s';
        }
    };

    // Fonction pour formater le poids
    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Fonction pour calculer les statistiques
    const calculateStats = useCallback(async () => {
        let totalDuration = 0;
        let totalLoadTime = 0;
        let totalSize = 0;

        for (const video of videos) {
            totalDuration += video.duration || 0;
            totalSize += video.size || 0;

            try {
                // Estimation du temps de chargement (basé sur une connexion moyenne de 15 Mbps)
                const loadTime = ((video.size || 0) * 8) / (15 * 1024 * 1024) * 1000;
                totalLoadTime += loadTime;
            } catch (error) {
                console.error(`Erreur lors de l'analyse de ${video.source}:`, error);
            }
        }

        setStats({
            totalVideos: videos.length,
            totalDuration,
            averageLoadTime: videos.length > 0 ? totalLoadTime / videos.length : 0,
            totalSize,
        });
    }, [videos]);

    useEffect(() => {
        fetchVideos();
    }, []);

    useEffect(() => {
        if (videos.length > 0) {
            calculateStats();
        }
    }, [videos, calculateStats]);

    // Mettre à jour le statut pour le composant parent
    useEffect(() => {
        onStatusChange && onStatusChange(statusMessage);
    }, [statusMessage, onStatusChange]);

    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            
            // Extraire la durée de la vidéo
            const duration = await extractVideoDuration(file);
            
            // Détecter le format
            const format = await detectFormat(file);
            
            setFormData(prev => ({ 
                ...prev, 
                source: URL.createObjectURL(file),
                duration,
                format,
                size: file.size
            }));
        }
    };

    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setFormData(prev => ({ ...prev, thumbnail: URL.createObjectURL(file) }));
            setPreviewThumbnail(URL.createObjectURL(file));
        }
    };

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const videosCollection = collection(db, 'videos');
            const videosQuery = query(videosCollection, orderBy('order', 'asc'));
            const videosSnapshot = await getDocs(videosQuery);

            if (!videosSnapshot.empty) {
                const fetchedVideos = videosSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Video[];
                setVideos(fetchedVideos);
            } else {
                setVideos([]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des vidéos:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la récupération des vidéos',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let videoUrl = formData.source;
            let thumbnailUrl = formData.thumbnail;

            // Upload de la vidéo si un nouveau fichier est sélectionné
            if (videoFile) {
                const videoFormData = new FormData();
                videoFormData.append('file', videoFile);
                videoFormData.append('path', 'videos');
                videoFormData.append('useUuid', 'false');

                const videoResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: videoFormData,
                });

                if (!videoResponse.ok) {
                    throw new Error('Erreur lors du téléchargement de la vidéo');
                }

                const videoData = await videoResponse.json();
                videoUrl = videoData.fileUrl;
            }

            // Upload de la miniature si un nouveau fichier est sélectionné
            if (thumbnailFile) {
                const thumbnailFormData = new FormData();
                thumbnailFormData.append('file', thumbnailFile);
                thumbnailFormData.append('path', 'videos/thumbnails');
                thumbnailFormData.append('useUuid', 'false');

                const thumbnailResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: thumbnailFormData,
                });

                if (!thumbnailResponse.ok) {
                    throw new Error('Erreur lors du téléchargement de la miniature');
                }

                const thumbnailData = await thumbnailResponse.json();
                thumbnailUrl = thumbnailData.fileUrl;
            }

            if (editingVideo?.id) {
                const videoRef = doc(db, 'videos', editingVideo.id);
                await updateDoc(videoRef, {
                    title: formData.title,
                    source: videoUrl,
                    thumbnail: thumbnailUrl,
                    order: formData.order,
                    category: formData.category || '',
                    format: formData.format || 'paysage',
                });
                setStatusMessage({ type: 'success', message: 'Vidéo mise à jour avec succès' });
            } else {
                const newVideo = {
                    ...formData,
                    source: videoUrl,
                    thumbnail: thumbnailUrl,
                    order: videos.length,
                    format: formData.format || 'paysage',
                };
                await addDoc(collection(db, 'videos'), newVideo);
                setStatusMessage({
                    type: 'success',
                    message: 'Nouvelle vidéo ajoutée avec succès',
                });
            }
            resetForm();
            fetchVideos();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la vidéo:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingVideo(null);
        setFormData({
            title: '',
            category: '',
            source: '',
            thumbnail: '',
            order: 0,
        });
        setVideoFile(null);
        setThumbnailFile(null);
        setPreviewThumbnail(null);
        setStatusMessage(null);
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

    // Fonction pour extraire le nom du fichier du chemin
    const extractFileName = (path: string): string => {
        // Si le chemin commence par /videos/, on enlève ce préfixe
        const cleanPath = path.replace(/^\/videos\//, '');
        // On prend le dernier segment du chemin
        return cleanPath.split('/').pop() || '';
    };

    // Fonction pour supprimer un fichier
    const deleteFile = async (path: string) => {
        try {
            const fileName = extractFileName(path);
            if (!fileName) return;

            const response = await fetch(`/api/delete?path=videos&name=${encodeURIComponent(fileName)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression du fichier');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du fichier:', error);
        }
    };

    // Supprimer toutes les vidéos
    const handleDeleteAllVideos = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer toutes les vidéos (${videos.length} vidéos) ? Cette action est irréversible.`)) {
            return;
        }

        try {
            // Supprimer tous les fichiers vidéo
            await Promise.all(videos.map(video => deleteFile(video.source)));

            // Supprimer tous les fichiers miniatures
            await Promise.all(videos.map(video => video.thumbnail && deleteFile(video.thumbnail)));

            // Ensuite supprimer les documents Firestore
            await Promise.all(videos.map(video => 
                deleteDoc(doc(db, 'videos', video.id!))
            ));

            setVideos([]);

            resetForm();

            setStatusMessage({
                type: 'success',
                message: `Toutes les vidéos (${videos.length}) ont été supprimées avec succès`
            });
        } catch (error) {
            console.error('Erreur lors de la suppression des vidéos:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la suppression des vidéos'
            });
        }
    };

    // Extraire la durée d'une vidéo
    const extractVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };
            
            video.src = URL.createObjectURL(file);
        });
    };

    // Générer une miniature à partir d'une vidéo
    const generateThumbnail = async (file: File): Promise<string> => {
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

    // Détecter automatiquement le format (portrait/paysage)
    const detectFormat = async (file: File): Promise<'portrait' | 'paysage'> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
                resolve(video.videoWidth < video.videoHeight ? 'portrait' : 'paysage');
            };
            
            video.src = URL.createObjectURL(file);
        });
    };

    // Gérer l'upload des fichiers
    const handleFileUpload = async (files: FileList) => {
        // Filtrer les fichiers pour n'accepter que les vidéos
        const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
        
        if (videoFiles.length === 0) {
            setStatusMessage({
                type: 'error',
                message: 'Veuillez sélectionner uniquement des fichiers vidéo'
            });
            return;
        }
        
        setUploading(true);
        setStatusMessage(null);
        setUploadProgress(0);

        try {
            // Trouver le dernier ordre existant
            const lastOrder = Math.max(...videos.map(v => v.order), -1);
            let currentOrder = lastOrder + 1;

            for (let i = 0; i < videoFiles.length; i++) {
                const file = videoFiles[i];
                
                // Extraire la durée de la vidéo
                const duration = await extractVideoDuration(file);

                // Détecter le format
                const format = await detectFormat(file);

                // Créer un FormData pour l'upload
                const formData = new FormData();
                formData.append('file', file);
                formData.append('path', 'videos');
                formData.append('useUuid', 'false');

                // Faire une requête fetch à notre API locale pour sauvegarder le fichier
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Erreur lors du téléchargement de la vidéo');
                }

                const data = await response.json();

                // Créer une nouvelle vidéo avec l'ordre incrémenté
                const newVideo = {
                    title: '', // Laisser le titre vide
                    source: data.fileUrl,
                    thumbnail: '', // Laisser la miniature vide
                    duration,
                    order: currentOrder++,
                    category: '',
                    size: file.size, // Stocker la taille réelle du fichier
                    format, // Ajouter le format détecté
                };

                await addDoc(collection(db, 'videos'), newVideo);

                // Mettre à jour la progression
                setUploadProgress(((i + 1) / videoFiles.length) * 100);
            }

            setStatusMessage({
                type: 'success',
                message: `${videoFiles.length} vidéo(s) ajoutée(s) avec succès`,
            });

            // Rafraîchir la liste des vidéos
            fetchVideos();
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors du téléchargement des vidéos',
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (video: Video) => {
        setEditingVideo(video);
        setFormData(video);
        setPreviewThumbnail(video.thumbnail);
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
        const video = videos.find(v => v.id === id);
        if (!video) return;

        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
            try {
                // Supprimer le fichier vidéo
                await deleteFile(video.source);

                // Supprimer la miniature si elle existe
                if (video.thumbnail) {
                    await deleteFile(video.thumbnail);
                }

                // Supprimer le document Firestore
                await deleteDoc(doc(db, 'videos', id));
                setStatusMessage({ type: 'success', message: 'Vidéo supprimée avec succès' });
                
                // Fermer le formulaire si la vidéo supprimée était en cours d'édition
                if (editingVideo?.id === id) {
                    resetForm();
                }
                
                fetchVideos();
            } catch (error) {
                console.error('Erreur lors de la suppression de la vidéo:', error);
                setStatusMessage({ type: 'error', message: 'Erreur lors de la suppression' });
            }
        }
    };

    const handleReorder = async (videoId: string, newOrder: number) => {
        try {
            await updateDoc(doc(db, 'videos', videoId), { order: newOrder });
            fetchVideos();
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
                <h2 className="text-xl font-semibold mb-4">Statistiques des Vidéos</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Nombre total de vidéos</p>
                        <p className="text-3xl font-bold">{stats.totalVideos}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Poids total estimé</p>
                        <p className="text-3xl font-bold">{formatSize(stats.totalSize)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Durée totale</p>
                        <p className="text-3xl font-bold">{formatDuration(stats.totalDuration)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Temps de chargement moyen</p>
                        <p className="text-3xl font-bold">{formatLoadTime(stats.averageLoadTime)}</p>
                        <p className="text-xs text-gray-500">
                            Estimation basée sur une connexion moyenne en France (15 Mbps)
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Gestion des Vidéos</h2>
                        <div className="flex space-x-2">
                            {videos.length > 0 && (
                                <>
                                    <button
                                        onClick={() => handleDeleteAllVideos()}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Tout supprimer
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nouvelle vidéo
                            </button>
                        </div>
                    </div>

                    {statusMessage && (
                        <div
                            className={`p-4 mb-4 rounded-md ${
                                statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {statusMessage.message}
                        </div>
                    )}

                    {/* Zone de drop pour les vidéos */}
                    <div
                        className={`border-2 border-dashed p-8 mb-8 rounded-lg text-center ${
                            isDragging ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'
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
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p className="mt-2 text-gray-600">
                                    Glissez-déposez des vidéos ici ou{' '}
                                    <button
                                        type="button"
                                        className="text-primary hover:text-primary-dark font-medium"
                                        onClick={() => document.getElementById('fileInput')?.click()}
                                    >
                                        parcourez votre ordinateur
                                    </button>
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Vidéos uniquement (MP4, WebM, etc.)
                                </p>
                                <input
                                    id="fileInput"
                                    type="file"
                                    className="hidden"
                                    accept="video/*"
                                    multiple
                                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                />
                            </>
                        )}
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                {editingVideo
                                    ? `Modifier: ${editingVideo.title || 'Vidéo sans titre'}`
                                    : 'Ajouter une nouvelle vidéo'}
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
                                            placeholder="Titre de la vidéo"
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
                                            value={formData.format || 'paysage'}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    format: e.target.value as 'portrait' | 'paysage',
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        >
                                            <option value="paysage">Paysage</option>
                                            <option value="portrait">Portrait</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vidéo
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={formData.source || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        source: e.target.value,
                                                    })
                                                }
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="URL de la vidéo"
                                                required
                                                readOnly
                                            />
                                            <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer flex items-center">
                                                <span>Parcourir</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="video/*"
                                                    onChange={handleVideoFileChange}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Miniature (optionnel)
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={formData.thumbnail || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        thumbnail: e.target.value,
                                                    })
                                                }
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

                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                            Prévisualisation
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Vidéo */}
                                            <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${getItemSizeClass(formData.format || 'paysage')}`}>
                                                {formData.source ? (
                                                    <video
                                                        src={formData.source}
                                                        className="w-full h-full object-cover"
                                                        controls
                                                        preload="metadata"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400">
                                                        Aucune vidéo sélectionnée
                                                    </div>
                                                )}
                                            </div>

                                            {/* Miniature */}
                                            <div className={`relative bg-gray-100 rounded-lg overflow-hidden group ${getItemSizeClass(formData.format || 'paysage')}`}>
                                                {previewThumbnail ? (
                                                    <>
                                                        <Image
                                                            src={previewThumbnail}
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
                                                        Aucune miniature sélectionnée
                                                    </div>
                                                )}
                                            </div>
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
                                    {editingVideo ? 'Mettre à jour' : 'Ajouter'}
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
                                            Vidéo
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
                                            Durée
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {videos.map((video) => (
                                        <tr key={video.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            handleReorder(
                                                                video.id!,
                                                                video.order - 1,
                                                            )
                                                        }
                                                        disabled={video.order === 0}
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                    >
                                                        ↑
                                                    </button>
                                                    <span>{video.order}</span>
                                                    <button
                                                        onClick={() =>
                                                            handleReorder(
                                                                video.id!,
                                                                video.order + 1,
                                                            )
                                                        }
                                                        disabled={
                                                            video.order ===
                                                            videos.length - 1
                                                        }
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-16 w-24 relative overflow-hidden rounded">
                                                    {video.thumbnail ? (
                                                        <Image
                                                            src={video.thumbnail}
                                                            alt={video.title || 'Vidéo sans titre'}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <video
                                                            src={video.source}
                                                            className="w-full h-full object-cover"
                                                            preload="metadata"
                                                        />
                                                    )}
                                                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs">
                                                        {formatDuration(video.duration)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {video.title || <span className="text-gray-400 italic">Sans titre</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {video.category}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {video.format || 'paysage'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {formatDuration(video.duration)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                <button
                                                    onClick={() => handleEdit(video)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(video.id!)}
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