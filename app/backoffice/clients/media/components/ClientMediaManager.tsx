'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

import { getMediaUrl } from '../../../../utils/mediaUrl';
import { Spinner } from '../../../components/Spinner';

interface MediaFile {
    name: string;
    path: string;
    type: 'image' | 'video';
    thumbnail?: string;
    size?: number;
    lastModified?: Date;
}

interface ClientMediaManagerProps {
    readonly clientType: string;
    readonly clientName: string;
    readonly clientId: string;
    readonly onMediaDeleted?: () => void;
}

export default function ClientMediaManager({
    clientType,
    clientName,
    clientId,
    onMediaDeleted,
}: ClientMediaManagerProps) {
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [cacheTimestamp, setCacheTimestamp] = useState(Date.now());

    // Chemin de base pour les médias du client
    const basePath = `client/${clientType}/${clientName}`;

    // Charger les médias existants
    const loadMedia = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Chargement des médias depuis:', basePath);

            const response = await fetch(
                `/api/gallery-images?path=${encodeURIComponent(basePath)}`,
            );

            if (!response.ok) {
                console.error('Erreur API:', response.status, response.statusText);
                throw new Error('Erreur lors du chargement des médias');
            }

            const data = await response.json();
            console.log('Données reçues:', data);

            // Traiter et normaliser les données reçues
            let mediaList = data.media || data.images || [];

            // S'assurer que chaque média a les bonnes propriétés
            mediaList = mediaList.map((media: any) => {
                // Déterminer le type de fichier à partir de l'extension
                const fileExtension = media.name?.toLowerCase().split('.').pop() || '';
                const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'];
                const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];

                let type: 'image' | 'video' = 'image';
                if (videoExtensions.includes(fileExtension)) {
                    type = 'video';
                } else if (imageExtensions.includes(fileExtension)) {
                    type = 'image';
                }

                return {
                    name: media.name || '',
                    path: media.path || basePath,
                    type: media.type || type,
                    thumbnail: media.thumbnail,
                    size: media.size,
                    lastModified: media.lastModified ? new Date(media.lastModified) : undefined,
                };
            });

            console.log('Médias traités:', mediaList);
            setMediaFiles(mediaList);
        } catch (error) {
            console.error('Erreur lors du chargement des médias:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors du chargement des médias',
            });
        } finally {
            setLoading(false);
        }
    }, [basePath]);

    useEffect(() => {
        loadMedia();
    }, [loadMedia]);

    // Gérer la sélection de fichiers
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setSelectedFiles(files);
    };

    // Uploader les fichiers sélectionnés
    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setUploadProgress({});

        try {
            for (const file of selectedFiles) {
                console.log(`Upload du fichier: ${file.name} (${file.type}) vers ${basePath}`);

                const formData = new FormData();
                formData.append('file', file);
                formData.append('path', basePath);

                // Simuler le progrès
                setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Erreur upload ${file.name}:`, response.status, errorText);
                    throw new Error(`Erreur lors de l'upload de ${file.name}: ${response.status}`);
                }

                const result = await response.json();
                console.log(`Upload réussi pour ${file.name}:`, result);

                // Simuler le progrès complet
                setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
            }

            setStatusMessage({
                type: 'success',
                message: `${selectedFiles.length} fichier(s) téléchargé(s) avec succès`,
            });

            setSelectedFiles([]);
            setUploadProgress({});

            // Attendre un peu avant de recharger pour s'assurer que les fichiers sont bien écrits
            setTimeout(async () => {
                await loadMedia();
            }, 1000);
        } catch (error) {
            console.error("Erreur lors de l'upload:", error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors du téléchargement des fichiers',
            });
        } finally {
            setUploading(false);
        }
    };

    // Supprimer un fichier
    const handleDeleteFile = async (file: MediaFile) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)) {
            return;
        }

        try {
            // Construire l'URL avec un double encodage pour les noms de fichiers complexes
            const encodedPath = encodeURIComponent(file.path);
            const encodedName = encodeURIComponent(file.name);

            console.log('Suppression du fichier:', {
                originalPath: file.path,
                originalName: file.name,
                encodedPath,
                encodedName,
                fullUrl: `/api/delete?path=${encodedPath}&name=${encodedName}`,
            });

            const response = await fetch(`/api/delete?path=${encodedPath}&name=${encodedName}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erreur API:', response.status, errorText);
                throw new Error(`Erreur lors de la suppression: ${response.status}`);
            }

            setStatusMessage({
                type: 'success',
                message: 'Fichier supprimé avec succès',
            });

            // Mettre à jour le timestamp pour forcer le cache busting
            setCacheTimestamp(Date.now());

            // Recharger les médias
            await loadMedia();

            // Notifier le parent pour forcer un refresh complet
            onMediaDeleted?.();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la suppression du fichier',
            });
        }
    };

    // Télécharger un fichier
    const handleDownloadFile = (file: MediaFile) => {
        const link = document.createElement('a');
        link.href = getMediaUrl(`${file.path}/${file.name}`);
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Messages de statut */}
            {statusMessage && (
                <div
                    className={`p-4 rounded-md ${
                        statusMessage.type === 'success'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                    }`}
                >
                    {statusMessage.message}
                </div>
            )}

            {/* Section d'upload */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter des médias</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sélectionner des fichiers
                        </label>
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">
                                Fichiers sélectionnés ({selectedFiles.length})
                            </h4>
                            <div className="space-y-1">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                        <span className="text-sm text-gray-600">{file.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                        {uploadProgress[file.name] !== undefined && (
                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${uploadProgress[file.name]}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || uploading}
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <div className="flex items-center">
                                    <Spinner small white />
                                    <span className="ml-2">Téléchargement...</span>
                                </div>
                            ) : (
                                'Télécharger'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des médias */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                        Médias existants ({mediaFiles.length})
                    </h3>
                    <button
                        onClick={loadMedia}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <Spinner small />
                                <span className="ml-1">Actualisation...</span>
                            </div>
                        ) : (
                            'Actualiser'
                        )}
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner />
                        </div>
                    ) : mediaFiles.length === 0 ? (
                        <div className="text-center py-8">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                            >
                                <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun média</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Commencez par télécharger des photos ou vidéos.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {mediaFiles.map((file, index) => (
                                <div key={index} className="relative group">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                        {file.type === 'image' ? (
                                            <Image
                                                src={`${getMediaUrl(`${file.path}/${file.name}`)}?t=${cacheTimestamp}`}
                                                alt={file.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 relative">
                                                <svg
                                                    className="w-12 h-12 text-gray-400 mb-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    VIDÉO
                                                </span>
                                                {file.thumbnail && (
                                                    <Image
                                                        src={`${getMediaUrl(file.thumbnail)}?t=${cacheTimestamp}`}
                                                        alt={`Miniature de ${file.name}`}
                                                        fill
                                                        className="object-cover opacity-50"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Overlay avec actions */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleDownloadFile(file)}
                                                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                                                title="Télécharger"
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
                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFile(file)}
                                                className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
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

                                    {/* Nom du fichier */}
                                    <p
                                        className="mt-2 text-sm text-gray-600 truncate"
                                        title={file.name}
                                    >
                                        {file.name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
