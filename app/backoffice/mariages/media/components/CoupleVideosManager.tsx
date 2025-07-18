'use client';

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
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Spinner } from '../../../components/Spinner';
import { db } from '../../../lib/firebase-client';

interface CoupleVideo {
    id?: string;
    coupleId: string;
    type: 'youtube' | 'dailymotion';
    videoId: string;
    title: string;
    description?: string;
    thumbnail?: string;
    embedUrl: string;
    watchUrl: string;
    format?: 'portrait' | 'paysage';
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

interface CoupleVideosManagerProps {
    coupleId: string;
    coupleName: string;
    onStatusChange: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function CoupleVideosManager({
    coupleId,
    coupleName,
    onStatusChange,
}: CoupleVideosManagerProps) {
    const [videos, setVideos] = useState<CoupleVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<CoupleVideo | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [fetchingTitle, setFetchingTitle] = useState(false);
    const [detectedTitle, setDetectedTitle] = useState<string>('');
    const [detectedFormat, setDetectedFormat] = useState<'portrait' | 'paysage' | ''>('');

    // Formulaire React Hook Form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CoupleVideo>();

    const watchedUrl = watch('watchUrl', '');

    // Chargement des vidéos depuis Firebase
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setLoading(true);
                const videosCollection = collection(db, 'coupleVideos');
                const q = query(videosCollection, where('coupleId', '==', coupleId));
                const videosSnapshot = await getDocs(q);

                if (!videosSnapshot.empty) {
                    const fetchedVideos = videosSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as CoupleVideo[];

                    setVideos(fetchedVideos);
                } else {
                    setVideos([]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des vidéos:', error);
                onStatusChange({ type: 'error', message: 'Impossible de charger les vidéos' });
                setVideos([]);
                setLoading(false);
            }
        };

        fetchVideos();
    }, [coupleId, onStatusChange]);

    // Fonction pour extraire l'ID vidéo et le type depuis l'URL
    const parseVideoUrl = (url: string) => {
        let videoId = '';
        let type: 'youtube' | 'dailymotion' | null = null;
        let embedUrl = '';
        let thumbnail = '';

        // Regex pour YouTube
        const youtubeRegex =
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const youtubeMatch = url.match(youtubeRegex);

        if (youtubeMatch) {
            videoId = youtubeMatch[1];
            type = 'youtube';
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
            thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        } else {
            // Regex pour Dailymotion
            const dailymotionRegex =
                /(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/;
            const dailymotionMatch = url.match(dailymotionRegex);

            if (dailymotionMatch) {
                videoId = dailymotionMatch[1];
                type = 'dailymotion';
                embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
                thumbnail = `https://www.dailymotion.com/thumbnail/video/${videoId}`;
            }
        }

        return { videoId, type, embedUrl, thumbnail };
    };

    // Fonction pour récupérer le titre et les métadonnées de la vidéo depuis l'API
    const fetchVideoTitle = async (url: string, provider: 'youtube' | 'dailymotion') => {
        try {
            setFetchingTitle(true);
            const response = await fetch(
                `/api/video-metadata?url=${encodeURIComponent(url)}&provider=${provider}`,
            );

            if (!response.ok) {
                throw new Error('Erreur API');
            }

            const data = await response.json();

            if (data.success && data.metadata.title) {
                setDetectedTitle(data.metadata.title);

                // Déterminer le format basé sur les dimensions
                if (data.metadata.width && data.metadata.height) {
                    const format =
                        data.metadata.width > data.metadata.height ? 'paysage' : 'portrait';
                    setDetectedFormat(format);
                } else {
                    // Format par défaut si pas de dimensions
                    setDetectedFormat('paysage');
                }

                return data.metadata.title;
            }
        } catch (error) {
            console.error('Erreur récupération titre vidéo:', error);
            setDetectedTitle('');
            setDetectedFormat('');
        } finally {
            setFetchingTitle(false);
        }
        return '';
    };

    // Mise à jour automatique des champs quand l'URL change
    useEffect(() => {
        if (watchedUrl) {
            const { videoId, type, embedUrl, thumbnail } = parseVideoUrl(watchedUrl);
            if (videoId && type) {
                setValue('videoId', videoId);
                setValue('type', type);
                setValue('embedUrl', embedUrl);
                setValue('thumbnail', thumbnail);

                // Récupérer automatiquement le titre de la vidéo
                fetchVideoTitle(watchedUrl, type);
            } else {
                setDetectedTitle('');
                setDetectedFormat('');
            }
        } else {
            setDetectedTitle('');
            setDetectedFormat('');
        }
    }, [watchedUrl, setValue]);

    // Soumission du formulaire
    const onSubmit = async (data: CoupleVideo) => {
        setSaving(true);
        try {
            const { videoId, type, embedUrl, thumbnail } = parseVideoUrl(data.watchUrl);

            if (!videoId || !type) {
                onStatusChange({ type: 'error', message: 'URL de vidéo invalide' });
                setSaving(false);
                return;
            }

            const videoData = {
                ...data,
                title: detectedTitle || `Vidéo ${type}`, // Utiliser le titre détecté ou un titre par défaut
                format: detectedFormat || 'paysage', // Utiliser le format détecté ou paysage par défaut
                coupleId,
                videoId,
                type,
                embedUrl,
                thumbnail,
            };

            if (editing?.id) {
                await updateDoc(doc(db, 'coupleVideos', editing.id), {
                    ...videoData,
                    updatedAt: new Date(),
                });

                setVideos((prev) =>
                    prev.map((video) =>
                        video.id === editing.id ? { ...videoData, id: video.id } : video,
                    ),
                );
                onStatusChange({ type: 'success', message: 'Vidéo mise à jour avec succès' });
            } else {
                const docRef = await addDoc(collection(db, 'coupleVideos'), {
                    ...videoData,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                setVideos((prev) => [...prev, { ...videoData, id: docRef.id }]);
                onStatusChange({ type: 'success', message: 'Nouvelle vidéo ajoutée avec succès' });
            }

            reset();
            setEditing(null);
            setDetectedTitle('');
            setDetectedFormat('');
            setShowForm(false);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            onStatusChange({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        } finally {
            setSaving(false);
        }
    };

    // Gestion de l'édition
    const handleEdit = (video: CoupleVideo) => {
        setEditing(video);
        reset(video);
        setDetectedTitle(video.title); // Initialiser avec le titre existant
        setDetectedFormat(video.format || 'paysage'); // Initialiser avec le format existant
        setShowForm(true);
    };

    // Suppression d'une vidéo
    const handleDelete = async (video: CoupleVideo) => {
        if (!video.id) return;

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette vidéo ?`)) {
            try {
                await deleteDoc(doc(db, 'coupleVideos', video.id));

                setVideos((prev) => prev.filter((v) => v.id !== video.id));
                onStatusChange({ type: 'success', message: 'Vidéo supprimée avec succès' });

                if (editing?.id === video.id) {
                    setEditing(null);
                    reset();
                    setDetectedTitle('');
                    setDetectedFormat('');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                onStatusChange({ type: 'error', message: 'Erreur lors de la suppression' });
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Bouton d'ajout */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                    Vidéos du couple ({videos.length})
                </h3>
                <button
                    onClick={() => {
                        setEditing(null);
                        reset();
                        setDetectedTitle('');
                        setDetectedFormat('');
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
                    <span>Ajouter une vidéo</span>
                </button>
            </div>

            {/* Formulaire de vidéo */}
            {showForm && (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="bg-white rounded-lg shadow border border-gray-200 p-6"
                >
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                        {editing ? 'Modifier la vidéo' : 'Ajouter une nouvelle vidéo'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL de la vidéo *
                                </label>
                                <input
                                    type="url"
                                    {...register('watchUrl', {
                                        required: "L'URL de la vidéo est requise",
                                        pattern: {
                                            value: /^https?:\/\/.+/,
                                            message: 'Veuillez entrer une URL valide',
                                        },
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://www.youtube.com/watch?v=... ou https://www.dailymotion.com/video/..."
                                />
                                {errors.watchUrl && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.watchUrl.message}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Formats supportés : YouTube et Dailymotion
                                </p>
                            </div>

                            {/* Affichage du titre détecté automatiquement */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titre détecté
                                </label>
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[2.5rem] flex items-center">
                                    {fetchingTitle ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            <span className="text-gray-600">
                                                Récupération du titre...
                                            </span>
                                        </div>
                                    ) : detectedTitle ? (
                                        <span className="text-gray-900">{detectedTitle}</span>
                                    ) : watchedUrl && parseVideoUrl(watchedUrl).type ? (
                                        <span className="text-gray-500 italic">
                                            Impossible de récupérer le titre
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">
                                            Le titre apparaîtra automatiquement
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    {...register('description')}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Description de la vidéo..."
                                />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Prévisualisation
                            </h4>
                            <div className="h-64 w-full bg-gray-100 rounded-md overflow-hidden">
                                {watchedUrl && parseVideoUrl(watchedUrl).embedUrl ? (
                                    <iframe
                                        src={parseVideoUrl(watchedUrl).embedUrl}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allowFullScreen
                                        title="Prévisualisation vidéo"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-400">
                                            Entrez une URL valide pour voir la prévisualisation
                                        </p>
                                    </div>
                                )}
                            </div>

                            {watchedUrl && parseVideoUrl(watchedUrl).type && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                    <p className="text-sm text-green-700">
                                        ✓{' '}
                                        {parseVideoUrl(watchedUrl).type === 'youtube'
                                            ? 'YouTube'
                                            : 'Dailymotion'}{' '}
                                        vidéo détectée
                                        {detectedFormat && (
                                            <span className="ml-2">
                                                • Format: <strong>{detectedFormat}</strong>
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(null);
                                reset();
                                setDetectedTitle('');
                                setDetectedFormat('');
                                setShowForm(false);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <Spinner small white />
                            ) : editing ? (
                                'Mettre à jour'
                            ) : (
                                'Ajouter'
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Liste des vidéos */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune vidéo</h3>
                    <p className="text-gray-500 mb-4">
                        Commencez par ajouter des vidéos YouTube ou Dailymotion pour ce couple
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                        >
                            <div className="aspect-w-16 aspect-h-9">
                                <iframe
                                    src={video.embedUrl}
                                    className="w-full h-48"
                                    frameBorder="0"
                                    allowFullScreen
                                    title={video.title}
                                />
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="font-medium text-gray-900 truncate">
                                            {video.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {video.type === 'youtube' ? 'YouTube' : 'Dailymotion'}
                                        </p>
                                    </div>
                                </div>

                                {video.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {video.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    <a
                                        href={video.watchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                                        title="Voir sur la plateforme"
                                    >
                                        <svg
                                            className="h-4 w-4 inline mr-1"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                        </svg>
                                        Voir
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(video)}
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
                                        onClick={() => handleDelete(video)}
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
                    ))}
                </div>
            )}
        </div>
    );
}
