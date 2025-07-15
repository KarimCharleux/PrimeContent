'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import VideoUpload, { VideoData } from '../../components/VideoUpload';
import { getMediaUrl } from '../../utils/mediaUrl';

export interface MediaFormData {
    title: string;
    category: string;
    format: 'portrait' | 'paysage';
    source: string;
    thumbnail?: string;
    order: number;
    isVideo?: boolean;
    isYouTube?: boolean;
    youtubeId?: string;
    provider?: 'youtube' | 'dailymotion' | 'local';
    videoId?: string;
    embedUrl?: string;
    watchUrl?: string;
}

interface MediaFormProps {
    formData: MediaFormData;
    setFormData: (data: MediaFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    categories: string[];
    uploading?: boolean;
    previewImage?: string | null;
    setPreviewImage?: (image: string | null) => void;
    editingMode?: boolean;
}

type TabType = 'file' | 'youtube' | 'dailymotion';

export default function MediaForm({
    formData,
    setFormData,
    onSubmit,
    onCancel,
    categories,
    uploading = false,
    previewImage,
    setPreviewImage,
    editingMode = false,
}: MediaFormProps) {
    const [activeTab, setActiveTab] = useState<TabType>('file');
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

    // Fonction pour obtenir les métadonnées vidéo
    const getVideoMetadata = async (url: string) => {
        setIsLoadingMetadata(true);
        try {
            // Utiliser GET avec des paramètres de requête au lieu de POST
            const searchParams = new URLSearchParams({
                url: url,
            });

            const response = await fetch(`/api/video-metadata?${searchParams}`);

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des métadonnées');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération des métadonnées:', error);
            return null;
        } finally {
            setIsLoadingMetadata(false);
        }
    };

    // Gestionnaire pour les URLs YouTube
    const handleYouTubeUrl = async (url: string) => {
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return;
        }

        const data = await getVideoMetadata(url);
        if (data && data.metadata) {
            const metadata = data.metadata;
            // Extraire l'ID de la vidéo YouTube
            const videoIdMatch = url.match(
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
            );
            const videoId = videoIdMatch ? videoIdMatch[1] : '';

            setFormData({
                ...formData,
                title: metadata.title || '',
                source: url,
                thumbnail: metadata.thumbnail || '',
                format: metadata.format || 'paysage',
                isVideo: true,
                isYouTube: true,
                provider: 'youtube',
                videoId: videoId,
                embedUrl: `https://www.youtube.com/embed/${videoId}`,
                watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
                youtubeId: videoId,
            });
        }
    };

    // Gestionnaire pour les URLs Dailymotion
    const handleDailymotionUrl = async (url: string) => {
        if (!url.includes('dailymotion.com')) {
            return;
        }

        const data = await getVideoMetadata(url);
        if (data && data.metadata) {
            const metadata = data.metadata;
            // Extraire l'ID de la vidéo Dailymotion
            const videoIdMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : '';

            setFormData({
                ...formData,
                title: metadata.title || '',
                source: url,
                thumbnail: metadata.thumbnail || '',
                format: metadata.format || 'paysage',
                isVideo: true,
                isYouTube: false,
                provider: 'dailymotion',
                videoId: videoId,
                embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
                watchUrl: url,
            });
        }
    };

    // Gestionnaire pour l'upload de fichiers
    const handleFileUpload = async (files: FileList) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage?.(objectUrl);

        // Détecter le format automatiquement
        const format = await detectFormat(file);
        setFormData({
            ...formData,
            format,
            isVideo: file.type.startsWith('video/'),
            isYouTube: false,
            provider: 'local',
        });
    };

    // Détecter le format d'un fichier
    const detectFormat = async (file: File): Promise<'portrait' | 'paysage'> => {
        if (file.type.startsWith('video/')) {
            return 'paysage';
        }

        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                resolve(img.width < img.height ? 'portrait' : 'paysage');
            };
            img.src = URL.createObjectURL(file);
        });
    };

    // Obtenir la classe de taille selon le format
    const getItemSizeClass = (format: 'portrait' | 'paysage') => {
        return format === 'portrait' ? 'aspect-[3/4]' : 'aspect-[16/9]';
    };

    // Fonction pour déterminer l'icône selon le type de média
    const getMediaIcon = () => {
        if (formData.isYouTube) {
            return (
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            );
        } else if (formData.provider === 'dailymotion') {
            return (
                <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.833 12.546c-.427 1.538-1.731 2.695-3.251 2.695-1.673 0-3.021-1.347-3.021-3.021 0-1.674 1.348-3.021 3.021-3.021 1.52 0 2.824 1.158 3.251 2.695h2.167c0-2.942-2.079-5.208-5.418-5.208-3.338 0-5.417 2.266-5.417 5.208 0 2.942 2.079 5.207 5.417 5.207 3.339 0 5.418-2.265 5.418-5.207h-2.167z" />
                </svg>
            );
        } else if (formData.isVideo) {
            return (
                <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                </svg>
            );
        } else {
            return (
                <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            );
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    {editingMode ? 'Modifier le média' : 'Ajouter un nouveau média'}
                </h3>
            </div>

            <div className="px-6 py-4">
                {/* Onglets */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('file')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'file'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span>Fichier</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('youtube')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'youtube'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                                <span>YouTube</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('dailymotion')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'dailymotion'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21.833 12.546c-.427 1.538-1.731 2.695-3.251 2.695-1.673 0-3.021-1.347-3.021-3.021 0-1.674 1.348-3.021 3.021-3.021 1.52 0 2.824 1.158 3.251 2.695h2.167c0-2.942-2.079-5.208-5.418-5.208-3.338 0-5.417 2.266-5.417 5.208 0 2.942 2.079 5.207 5.417 5.207 3.339 0 5.418-2.265 5.418-5.207h-2.167z" />
                                </svg>
                                <span>Dailymotion</span>
                            </div>
                        </button>
                    </nav>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Colonne gauche - Formulaire */}
                        <div className="space-y-4">
                            {/* Onglet Fichier */}
                            {activeTab === 'file' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Titre
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) =>
                                                setFormData({ ...formData, title: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Titre du média"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Format
                                        </label>
                                        <select
                                            value={formData.format}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    format: e.target.value as
                                                        | 'portrait'
                                                        | 'paysage',
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="portrait">Portrait</option>
                                            <option value="paysage">Paysage</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fichier
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={(e) =>
                                                e.target.files && handleFileUpload(e.target.files)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Miniature personnalisée (optionnel)
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                e.target.files && handleFileUpload(e.target.files)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Onglet YouTube */}
                            {activeTab === 'youtube' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Lien YouTube
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="url"
                                                value={formData.source}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        source: e.target.value,
                                                    })
                                                }
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="https://www.youtube.com/watch?v=..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleYouTubeUrl(formData.source)}
                                                disabled={isLoadingMetadata}
                                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                {isLoadingMetadata ? (
                                                    <svg
                                                        className="w-4 h-4 animate-spin"
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
                                                ) : (
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                        />
                                                    </svg>
                                                )}
                                                <span>Charger</span>
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Le titre, la miniature et le format seront récupérés
                                            automatiquement
                                        </p>
                                    </div>

                                    {formData.title && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Titre (automatique)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    )}

                                    {formData.format && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Format (automatique)
                                            </label>
                                            <input
                                                type="text"
                                                value={
                                                    formData.format === 'portrait'
                                                        ? 'Portrait'
                                                        : 'Paysage'
                                                }
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Onglet Dailymotion */}
                            {activeTab === 'dailymotion' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Lien Dailymotion
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="url"
                                                value={formData.source}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        source: e.target.value,
                                                    })
                                                }
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="https://www.dailymotion.com/video/..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDailymotionUrl(formData.source)
                                                }
                                                disabled={isLoadingMetadata}
                                                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                {isLoadingMetadata ? (
                                                    <svg
                                                        className="w-4 h-4 animate-spin"
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
                                                ) : (
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                        />
                                                    </svg>
                                                )}
                                                <span>Charger</span>
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Le titre, la miniature et le format seront récupérés
                                            automatiquement
                                        </p>
                                    </div>

                                    {formData.title && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Titre (automatique)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    )}

                                    {formData.format && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Format (automatique)
                                            </label>
                                            <input
                                                type="text"
                                                value={
                                                    formData.format === 'portrait'
                                                        ? 'Portrait'
                                                        : 'Paysage'
                                                }
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Champ catégorie commun à tous les onglets */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catégorie
                                </label>
                                <div className="flex space-x-2">
                                    <select
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category: e.target.value })
                                        }
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Sélectionner une catégorie</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category: e.target.value })
                                        }
                                        placeholder="Nouvelle catégorie"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Colonne droite - Prévisualisation */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prévisualisation
                                </label>
                                <div
                                    className={`w-full max-w-md mx-auto relative bg-gray-100 rounded-lg overflow-hidden group ${getItemSizeClass(formData.format)}`}
                                >
                                    {formData.source || previewImage ? (
                                        <>
                                            {formData.isYouTube && formData.thumbnail ? (
                                                <>
                                                    <Image
                                                        src={formData.thumbnail}
                                                        alt="Aperçu YouTube"
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="bg-red-600 rounded-full p-3">
                                                            <svg
                                                                className="w-6 h-6 text-white"
                                                                viewBox="0 0 24 24"
                                                                fill="currentColor"
                                                            >
                                                                <path d="M8 5v14l11-7z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : formData.provider === 'dailymotion' &&
                                              formData.thumbnail ? (
                                                <>
                                                    <Image
                                                        src={formData.thumbnail}
                                                        alt="Aperçu Dailymotion"
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="bg-orange-600 rounded-full p-3">
                                                            <svg
                                                                className="w-6 h-6 text-white"
                                                                viewBox="0 0 24 24"
                                                                fill="currentColor"
                                                            >
                                                                <path d="M8 5v14l11-7z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : formData.source?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video
                                                    src={getMediaUrl(formData.source)}
                                                    controls
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Image
                                                    src={getMediaUrl(formData.source)}
                                                    alt="Prévisualisation"
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            )}

                                            {/* Badge de type de média */}
                                            <div className="absolute top-2 right-2 flex items-center space-x-1">
                                                {getMediaIcon()}
                                            </div>

                                            {/* Badge de format */}
                                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-medium">
                                                {formData.format === 'portrait'
                                                    ? 'Portrait'
                                                    : 'Paysage'}
                                            </div>

                                            {/* Titre en overlay */}
                                            {formData.title && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <h3 className="text-white text-lg font-medium truncate">
                                                        {formData.title}
                                                    </h3>
                                                </div>
                                            )}

                                            {/* Badge de catégorie */}
                                            {formData.category && (
                                                <div className="absolute bottom-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                                                    {formData.category}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <div className="text-center">
                                                <svg
                                                    className="w-12 h-12 mx-auto mb-2"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                <p className="text-sm">Aucun média sélectionné</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                            {uploading ? (
                                <>
                                    <svg
                                        className="w-4 h-4 animate-spin"
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
                                    <span>Traitement...</span>
                                </>
                            ) : (
                                <span>{editingMode ? 'Mettre à jour' : 'Ajouter'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
