'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect } from 'react';

import { getMediaUrl } from '../../utils/mediaUrl';
import {
    extractYouTubeId,
    getYouTubeThumbnail,
    isValidYouTubeUrl,
    getYouTubeMetadata,
    formatYouTubeSource,
} from '../../utils/youtube';

// Types pour le composant
export interface VideoData {
    source: string;
    isYouTube: boolean;
    youtubeId?: string;
    thumbnail?: string;
    title?: string;
    file?: File;
}

interface VideoUploadProps {
    value?: VideoData | null;
    onChange: (video: VideoData | null) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
}

export default function VideoUpload({
    value,
    onChange,
    label = 'Vidéo',
    placeholder = 'URL YouTube ou télécharger un fichier',
    className = '',
    required = false,
    disabled = false,
}: VideoUploadProps) {
    const [mode, setMode] = useState<'youtube' | 'file'>('youtube');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<VideoData | null>(value || null);

    // Initialiser avec la valeur existante
    useEffect(() => {
        if (value) {
            setPreview(value);
            if (value.isYouTube && value.youtubeId) {
                setYoutubeUrl(`https://www.youtube.com/watch?v=${value.youtubeId}`);
                setMode('youtube');
            } else {
                setMode('file');
            }
        }
    }, [value]);

    // Validation de l'URL YouTube
    const validateYouTubeUrl = useCallback(
        async (url: string) => {
            if (!url.trim()) {
                setError(null);
                setPreview(null);
                onChange(null);
                return;
            }

            setIsValidating(true);
            setError(null);

            const youtubeId = extractYouTubeId(url);

            if (!youtubeId) {
                setError('URL YouTube invalide');
                setIsValidating(false);
                return;
            }

            try {
                // Récupérer les métadonnées
                const metadata = await getYouTubeMetadata(youtubeId);

                const videoData: VideoData = {
                    source: url,
                    isYouTube: true,
                    youtubeId,
                    thumbnail: getYouTubeThumbnail(youtubeId),
                    title: metadata?.title || 'Vidéo YouTube',
                };

                setPreview(videoData);
                onChange(videoData);
            } catch (err) {
                setError('Impossible de récupérer les informations de cette vidéo');
                console.error('Erreur validation YouTube:', err);
            } finally {
                setIsValidating(false);
            }
        },
        [onChange],
    );

    // Gestion du changement d'URL YouTube
    const handleYouTubeUrlChange = (url: string) => {
        setYoutubeUrl(url);

        // Validation avec debounce
        const timeoutId = setTimeout(() => {
            validateYouTubeUrl(url);
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    // Gestion de l'upload de fichier
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            setPreview(null);
            onChange(null);
            return;
        }

        // Vérifier que c'est bien une vidéo
        if (!file.type.startsWith('video/')) {
            setError('Veuillez sélectionner un fichier vidéo valide');
            return;
        }

        setError(null);

        // Créer une URL temporaire pour la prévisualisation
        const objectUrl = URL.createObjectURL(file);

        const videoData: VideoData = {
            source: objectUrl,
            isYouTube: false,
            file,
            title: file.name,
        };

        setPreview(videoData);
        onChange(videoData);
    };

    // Supprimer la vidéo
    const handleRemove = () => {
        if (preview?.source && !preview.isYouTube) {
            URL.revokeObjectURL(preview.source);
        }
        setPreview(null);
        setYoutubeUrl('');
        setError(null);
        onChange(null);
    };

    // Changer de mode
    const switchMode = (newMode: 'youtube' | 'file') => {
        if (newMode === mode) return;

        // Nettoyer les données actuelles
        handleRemove();
        setMode(newMode);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Sélecteur de mode */}
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                <button
                    type="button"
                    onClick={() => switchMode('youtube')}
                    disabled={disabled}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        mode === 'youtube'
                            ? 'bg-white text-gray-900 shadow'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        <span>YouTube</span>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={() => switchMode('file')}
                    disabled={disabled}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        mode === 'file'
                            ? 'bg-white text-gray-900 shadow'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <div className="flex items-center justify-center space-x-2">
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
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <span>Fichier</span>
                    </div>
                </button>
            </div>

            {/* Interface YouTube */}
            {mode === 'youtube' && (
                <div className="space-y-3">
                    <div className="relative">
                        <input
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            disabled={disabled}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        />
                        {isValidating && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-gray-500">
                        Formats supportés : youtube.com/watch, youtu.be, youtube.com/shorts
                    </p>
                </div>
            )}

            {/* Interface fichier */}
            {mode === 'file' && (
                <div>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        disabled={disabled}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Formats supportés : MP4, WebM, MOV, AVI (max 100MB)
                    </p>
                </div>
            )}

            {/* Affichage des erreurs */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Prévisualisation */}
            {preview && !error && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Prévisualisation</h4>
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={disabled}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                        >
                            Supprimer
                        </button>
                    </div>

                    <div className="flex space-x-4">
                        {/* Miniature */}
                        <div className="flex-shrink-0 w-32 h-20 bg-gray-200 rounded-lg overflow-hidden">
                            {preview.isYouTube && preview.thumbnail ? (
                                <Image
                                    src={preview.thumbnail}
                                    alt="Miniature YouTube"
                                    width={128}
                                    height={80}
                                    className="w-full h-full object-cover"
                                />
                            ) : !preview.isYouTube ? (
                                <video
                                    src={preview.source}
                                    className="w-full h-full object-cover"
                                    muted
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg
                                        className="w-8 h-8 text-gray-400"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Informations */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {preview.title || 'Vidéo sans titre'}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        preview.isYouTube
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-blue-100 text-blue-800'
                                    }`}
                                >
                                    {preview.isYouTube ? 'YouTube' : 'Fichier'}
                                </span>
                                {preview.youtubeId && (
                                    <span className="text-xs text-gray-500">
                                        ID: {preview.youtubeId}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
