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
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { collection, doc, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';

import VideoUpload, { VideoData } from '../../../components/VideoUpload';
import {
    VideoProvider,
    getVideoProvider,
    extractVideoId,
    getVideoThumbnail,
    isExternalVideo,
} from '../../../utils/videoManager';
import { db } from '../../lib/firebase-client';

export interface ClientVideo {
    id: string;
    title: string;
    source: string; // URL générique (YouTube, Dailymotion, etc.)
    provider: VideoProvider; // 'youtube' | 'dailymotion' | 'local'
    videoId?: string; // ID de la vidéo externe
    embedUrl?: string; // URL d'embed
    watchUrl?: string; // URL de visionnage
    thumbnail?: string; // URL de la miniature
    format?: 'portrait' | 'paysage'; // Format de la vidéo
    clientType: 'brand' | 'celebrity';
    clientId: string;
    clientName: string;
    order: number;
    createdAt: Date;
    // Propriétés de rétrocompatibilité
    youtubeUrl?: string;
    youtubeId?: string;
}

interface ClientVideosManagerProps {
    readonly clientType: 'brand' | 'celebrity';
    readonly clientId: string;
    readonly clientName: string;
    readonly onStatusChange?: (
        status: { type: 'success' | 'error'; message: string } | null,
    ) => void;
}

// Composant SortableVideoCard
interface SortableVideoCardProps {
    video: ClientVideo;
    index: number;
    onEdit: (video: ClientVideo) => void;
    onDelete: (video: ClientVideo) => void;
}

function SortableVideoCard({ video, index, onEdit, onDelete }: SortableVideoCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: video.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white border rounded-lg overflow-hidden ${
                isDragging ? 'shadow-lg' : ''
            }`}
        >
            {/* Miniature */}
            <div className="relative aspect-video">
                <Image
                    src={
                        video.thumbnail ||
                        getVideoThumbnail(video.videoId || '', video.provider) ||
                        '/placeholder-photo.png'
                    }
                    alt={video.title}
                    fill
                    className="object-cover"
                />
                {/* Icône de lecture */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className={`rounded-full p-2 ${
                            video.provider === 'youtube'
                                ? 'bg-red-600'
                                : video.provider === 'dailymotion'
                                  ? 'bg-blue-600'
                                  : 'bg-gray-600'
                        }`}
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Informations */}
            <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{video.title}</h4>

                {/* Format de la vidéo */}
                {video.format && (
                    <div className="mb-2">
                        <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                video.format === 'portrait'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-green-100 text-green-800'
                            }`}
                        >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                {video.format === 'portrait' ? (
                                    <rect x="9" y="2" width="6" height="20" rx="1" />
                                ) : (
                                    <rect x="2" y="9" width="20" height="6" rx="1" />
                                )}
                            </svg>
                            {video.format === 'portrait' ? 'Portrait' : 'Paysage'}
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                    {/* Drag handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
                        title="Glisser pour réorganiser"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                        </svg>
                    </div>

                    <div className="flex gap-2">
                        {/* Modifier */}
                        <button
                            onClick={() => onEdit(video)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Modifier"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>

                        {/* Supprimer */}
                        <button
                            onClick={() => onDelete(video)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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
        </div>
    );
}

export default function ClientVideosManager({
    clientType,
    clientId,
    clientName,
    onStatusChange,
}: ClientVideosManagerProps) {
    const [videos, setVideos] = useState<ClientVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [saving, setSaving] = useState(false);
    const [editingVideo, setEditingVideo] = useState<ClientVideo | null>(null);

    // Charger les vidéos depuis Firestore
    const loadVideos = useCallback(async () => {
        try {
            setLoading(true);
            const videosCollection = collection(db, 'client-videos');
            const videosSnapshot = await getDocs(videosCollection);

            const clientVideos: ClientVideo[] = [];
            videosSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.clientId === clientId && data.clientType === clientType) {
                    // Support de rétrocompatibilité avec l'ancien format
                    let provider: VideoProvider = data.provider || 'youtube';
                    let source = data.source || data.youtubeUrl || '';
                    let videoId = data.videoId || data.youtubeId;

                    // Si pas de provider défini, essayer de le détecter
                    if (!data.provider && source) {
                        provider = getVideoProvider(source);
                        videoId = extractVideoId(source, provider);
                    }

                    clientVideos.push({
                        id: doc.id,
                        title: data.title,
                        source,
                        provider,
                        videoId,
                        embedUrl: data.embedUrl,
                        watchUrl: data.watchUrl,
                        thumbnail: data.thumbnail, // ✅ Charger la miniature
                        format: data.format, // ✅ Charger le format
                        clientType: data.clientType,
                        clientId: data.clientId,
                        clientName: data.clientName,
                        order: data.order || 0,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        // Rétrocompatibilité
                        youtubeUrl: data.youtubeUrl,
                        youtubeId: data.youtubeId,
                    });
                }
            });

            // Trier par ordre
            clientVideos.sort((a, b) => a.order - b.order);
            setVideos(clientVideos);
        } catch (error) {
            console.error('Erreur lors du chargement des vidéos:', error);
            onStatusChange?.({
                type: 'error',
                message: 'Erreur lors du chargement des vidéos',
            });
        } finally {
            setLoading(false);
        }
    }, [clientId, clientType, onStatusChange]);

    useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    // Configuration des sensors pour le drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Sauvegarder une vidéo
    const handleSaveVideo = async () => {
        if (!videoData || !videoData.source) {
            onStatusChange?.({
                type: 'error',
                message: 'Veuillez renseigner une URL vidéo valide',
            });
            return;
        }

        try {
            setSaving(true);

            if (!isExternalVideo(videoData.source)) {
                onStatusChange?.({
                    type: 'error',
                    message: 'Veuillez renseigner une URL YouTube ou Dailymotion valide',
                });
                return;
            }

            const provider = getVideoProvider(videoData.source);
            const videoId = extractVideoId(videoData.source, provider);

            if (!videoId) {
                onStatusChange?.({
                    type: 'error',
                    message: 'URL de vidéo invalide. Vérifiez le lien fourni.',
                });
                return;
            }

            const nextOrder = videos.length > 0 ? Math.max(...videos.map((v) => v.order)) + 1 : 0;

            const videoDoc = {
                title: videoData.title || 'Vidéo sans titre',
                source: videoData.source,
                provider,
                videoId,
                embedUrl: videoData.embedUrl,
                watchUrl: videoData.watchUrl,
                thumbnail: videoData.thumbnail, // ✅ Sauvegarder la miniature
                format: videoData.format, // ✅ Sauvegarder le format
                clientType,
                clientId,
                clientName,
                order: editingVideo ? editingVideo.order : nextOrder,
                createdAt: editingVideo ? editingVideo.createdAt : new Date(),
                updatedAt: new Date(),
                // Rétrocompatibilité pour YouTube
                ...(provider === 'youtube' && {
                    youtubeUrl: videoData.source,
                    youtubeId: videoId,
                }),
            };

            if (editingVideo) {
                // Mettre à jour
                await updateDoc(doc(db, 'client-videos', editingVideo.id), videoDoc);
                onStatusChange?.({ type: 'success', message: 'Vidéo mise à jour avec succès !' });
            } else {
                // Créer
                await addDoc(collection(db, 'client-videos'), videoDoc);
                onStatusChange?.({ type: 'success', message: 'Vidéo ajoutée avec succès !' });
            }

            setVideoData(null);
            setShowForm(false);
            setEditingVideo(null);
            await loadVideos();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            onStatusChange?.({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        } finally {
            setSaving(false);
        }
    };

    // Supprimer une vidéo
    const handleDeleteVideo = async (video: ClientVideo) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'client-videos', video.id));
            onStatusChange?.({ type: 'success', message: 'Vidéo supprimée avec succès !' });
            await loadVideos();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            onStatusChange?.({ type: 'error', message: 'Erreur lors de la suppression' });
        }
    };

    // Modifier une vidéo
    const handleEditVideo = (video: ClientVideo) => {
        setEditingVideo(video);
        setVideoData({
            title: video.title,
            source: video.source,
            provider: video.provider,
            videoId: video.videoId,
            embedUrl: video.embedUrl,
            watchUrl: video.watchUrl,
            thumbnail: video.thumbnail, // ✅ Inclure la miniature
            format: video.format, // ✅ Inclure le format
            // Propriétés de rétrocompatibilité
            isYouTube: video.provider === 'youtube',
            youtubeId: video.provider === 'youtube' ? video.videoId : undefined,
            isDailymotion: video.provider === 'dailymotion',
            dailymotionId: video.provider === 'dailymotion' ? video.videoId : undefined,
        });
        setShowForm(true);
    };

    // Fonction de drag and drop
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = videos.findIndex((video) => video.id === active.id);
        const newIndex = videos.findIndex((video) => video.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Réorganiser les vidéos localement
        const newVideos = arrayMove(videos, oldIndex, newIndex);
        setVideos(newVideos);

        try {
            // Mettre à jour les ordres en base de données
            const updatePromises = newVideos.map((video, index) =>
                updateDoc(doc(db, 'client-videos', video.id), { order: index }),
            );

            await Promise.all(updatePromises);
            onStatusChange?.({ type: 'success', message: 'Ordre mis à jour !' });
        } catch (error) {
            console.error('Erreur lors du réordonnancement:', error);
            onStatusChange?.({ type: 'error', message: 'Erreur lors du réordonnancement' });
            // Recharger les données en cas d'erreur
            await loadVideos();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête avec bouton d'ajout */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Vidéos - {clientName}</h3>
                <button
                    onClick={() => {
                        setEditingVideo(null);
                        setVideoData(null);
                        setShowForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Ajouter une vidéo
                </button>
            </div>

            {/* Formulaire d'ajout/édition */}
            {showForm && (
                <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                        {editingVideo ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
                    </h4>

                    <VideoUpload
                        value={videoData}
                        onChange={setVideoData}
                        label="Vidéo"
                        placeholder="URL YouTube, Dailymotion ou télécharger un fichier"
                    />

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSaveVideo}
                            disabled={
                                saving || !videoData?.source || !isExternalVideo(videoData.source)
                            }
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Enregistrement...' : editingVideo ? 'Modifier' : 'Ajouter'}
                        </button>
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setVideoData(null);
                                setEditingVideo(null);
                            }}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Liste des vidéos avec drag and drop */}
            {videos.length > 0 ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={videos.map((v) => v.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {videos.map((video, index) => (
                                <SortableVideoCard
                                    key={video.id}
                                    video={video}
                                    index={index}
                                    onEdit={handleEditVideo}
                                    onDelete={handleDeleteVideo}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    <p>
                        Aucune vidéo ajoutée pour ce{' '}
                        {clientType === 'brand' ? 'marque' : 'célébrité'}.
                    </p>
                </div>
            )}
        </div>
    );
}
