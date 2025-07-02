'use client';

import { collection, doc, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';

import VideoUpload, { VideoData } from '../../../components/VideoUpload';
import { extractYouTubeId, getYouTubeThumbnail, isYouTubeVideo } from '../../../utils/youtube';
import { db } from '../../lib/firebase-client';

export interface ClientVideo {
    id: string;
    title: string;
    youtubeUrl: string;
    youtubeId: string;
    clientType: 'brand' | 'celebrity';
    clientId: string;
    clientName: string;
    order: number;
    createdAt: Date;
}

interface ClientVideosManagerProps {
    readonly clientType: 'brand' | 'celebrity';
    readonly clientId: string;
    readonly clientName: string;
    readonly onStatusChange?: (
        status: { type: 'success' | 'error'; message: string } | null,
    ) => void;
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
                    clientVideos.push({
                        id: doc.id,
                        title: data.title,
                        youtubeUrl: data.youtubeUrl,
                        youtubeId: data.youtubeId,
                        clientType: data.clientType,
                        clientId: data.clientId,
                        clientName: data.clientName,
                        order: data.order || 0,
                        createdAt: data.createdAt?.toDate() || new Date(),
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

    // Sauvegarder une vidéo
    const handleSaveVideo = async () => {
        if (!videoData || !videoData.source) {
            onStatusChange?.({
                type: 'error',
                message: 'Veuillez renseigner une URL YouTube valide',
            });
            return;
        }

        try {
            setSaving(true);

            if (!isYouTubeVideo(videoData.source)) {
                onStatusChange?.({
                    type: 'error',
                    message: 'Veuillez renseigner une URL YouTube valide',
                });
                return;
            }

            const youtubeId = extractYouTubeId(videoData.source);
            if (!youtubeId) {
                onStatusChange?.({ type: 'error', message: "Impossible d'extraire l'ID YouTube" });
                return;
            }

            const nextOrder = videos.length > 0 ? Math.max(...videos.map((v) => v.order)) + 1 : 0;

            const videoDoc = {
                title: videoData.title || 'Vidéo sans titre',
                youtubeUrl: videoData.source,
                youtubeId,
                clientType,
                clientId,
                clientName,
                order: editingVideo ? editingVideo.order : nextOrder,
                createdAt: editingVideo ? editingVideo.createdAt : new Date(),
                updatedAt: new Date(),
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
            source: video.youtubeUrl,
            isYouTube: true,
            youtubeId: video.youtubeId,
        });
        setShowForm(true);
    };

    // Réorganiser les vidéos
    const handleReorder = async (videoId: string, direction: 'up' | 'down') => {
        const videoIndex = videos.findIndex((v) => v.id === videoId);
        if (videoIndex === -1) return;

        const newVideos = [...videos];
        const targetIndex = direction === 'up' ? videoIndex - 1 : videoIndex + 1;

        if (targetIndex < 0 || targetIndex >= newVideos.length) return;

        // Échanger les ordres
        [newVideos[videoIndex], newVideos[targetIndex]] = [
            newVideos[targetIndex],
            newVideos[videoIndex],
        ];

        // Mettre à jour les ordres
        newVideos[videoIndex].order = videoIndex;
        newVideos[targetIndex].order = targetIndex;

        try {
            await Promise.all([
                updateDoc(doc(db, 'client-videos', newVideos[videoIndex].id), {
                    order: videoIndex,
                }),
                updateDoc(doc(db, 'client-videos', newVideos[targetIndex].id), {
                    order: targetIndex,
                }),
            ]);

            setVideos(newVideos);
            onStatusChange?.({ type: 'success', message: 'Ordre mis à jour !' });
        } catch (error) {
            console.error('Erreur lors du réordonnancement:', error);
            onStatusChange?.({ type: 'error', message: 'Erreur lors du réordonnancement' });
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
                <h3 className="text-lg font-medium text-gray-900">Vidéos YouTube - {clientName}</h3>
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
                        {editingVideo ? 'Modifier la vidéo' : 'Ajouter une vidéo YouTube'}
                    </h4>

                    <VideoUpload
                        value={videoData}
                        onChange={setVideoData}
                        label="URL YouTube"
                        placeholder="https://www.youtube.com/watch?v=..."
                    />

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSaveVideo}
                            disabled={saving || !videoData?.source || !videoData?.isYouTube}
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

            {/* Liste des vidéos */}
            {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video, index) => (
                        <div key={video.id} className="bg-white border rounded-lg overflow-hidden">
                            {/* Miniature YouTube */}
                            <div className="relative aspect-video">
                                <Image
                                    src={getYouTubeThumbnail(video.youtubeId)}
                                    alt={video.title}
                                    fill
                                    className="object-cover"
                                />
                                {/* Icône YouTube */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-red-600 rounded-full p-2">
                                        <svg
                                            className="w-6 h-6 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Informations */}
                            <div className="p-4">
                                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                                    {video.title}
                                </h4>

                                {/* Actions */}
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        {/* Réorganiser */}
                                        <button
                                            onClick={() => handleReorder(video.id, 'up')}
                                            disabled={index === 0}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                            title="Monter"
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
                                                    d="M5 15l7-7 7 7"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleReorder(video.id, 'down')}
                                            disabled={index === videos.length - 1}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                            title="Descendre"
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
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        {/* Modifier */}
                                        <button
                                            onClick={() => handleEditVideo(video)}
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
                                            onClick={() => handleDeleteVideo(video)}
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
                    ))}
                </div>
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
                        Aucune vidéo YouTube ajoutée pour ce{' '}
                        {clientType === 'brand' ? 'marque' : 'célébrité'}.
                    </p>
                </div>
            )}
        </div>
    );
}
