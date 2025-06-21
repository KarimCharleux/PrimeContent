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

import { getMediaUrl } from '../../../utils/mediaUrl';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface Project {
    id?: string;
    title: string;
    category: string;
    source: string;
    isVideo?: boolean;
    format: 'portrait' | 'paysage';
    order: number;
    isLatest?: boolean;
    thumbnail?: string; // Miniature optionnelle pour les vidéos
}

interface ProjectStats {
    totalProjects: number;
    totalImages: number;
    totalVideos: number;
    totalSize: number;
    imagesSize: number;
    videosSize: number;
    averageLoadTime: number;
}

export default function HomeTabProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'latest'>('all');
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [stats, setStats] = useState<ProjectStats>({
        totalProjects: 0,
        totalImages: 0,
        totalVideos: 0,
        totalSize: 0,
        imagesSize: 0,
        videosSize: 0,
        averageLoadTime: 0,
    });
    const [formData, setFormData] = useState<Partial<Project>>({
        title: '',
        category: '',
        source: '',
        format: 'portrait',
        order: 0,
        isLatest: false,
        thumbnail: '',
    });
    const [uploadCategory, setUploadCategory] = useState<string>('');

    // Extraire les catégories uniques des projets
    const categories = Array.from(new Set(projects.map((project) => project.category))).filter(
        Boolean,
    );

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

    // Fonction pour calculer les statistiques
    const calculateStats = useCallback(async () => {
        let totalSize = 0;
        let imagesSize = 0;
        let videosSize = 0;
        let totalImages = 0;
        let totalVideos = 0;
        let totalLoadTime = 0;

        for (const project of projects) {
            try {
                const response = await fetch(project.source, { method: 'HEAD' });
                const contentLength = response.headers.get('content-length');
                const contentType = response.headers.get('content-type');

                if (contentLength) {
                    const size = parseInt(contentLength);
                    totalSize += size;

                    if (project.source.match(/\.(mp4|webm|ogg)$/i)) {
                        videosSize += size;
                        totalVideos++;
                    } else {
                        imagesSize += size;
                        totalImages++;
                    }
                }

                // Estimation du temps de chargement (basé sur une connexion moyenne de 15 Mbps)
                const loadTime = ((parseInt(contentLength || '0') * 8) / (15 * 1024 * 1024)) * 1000;
                totalLoadTime += loadTime;
            } catch (error) {
                console.error(`Erreur lors de l'analyse de ${project.source}:`, error);
            }
        }

        setStats({
            totalProjects: projects.length,
            totalImages,
            totalVideos,
            totalSize,
            imagesSize,
            videosSize,
            averageLoadTime: totalLoadTime / projects.length,
        });
    }, [projects]);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (projects.length > 0) {
            calculateStats();
        }
    }, [projects, calculateStats]);

    // Fermer et réinitialiser le formulaire lors du changement d'onglet
    useEffect(() => {
        setShowForm(false);
        setEditingProject(null);
        setFormData({
            title: '',
            category: '',
            source: '',
            format: 'portrait',
            order: 0,
            isLatest: false,
            thumbnail: '',
        });
        setPreviewImage(null);
        setStatusMessage(null);
        setUploadCategory('');
    }, [activeTab]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const projectsCollection = collection(db, 'projects');
            const projectsQuery = query(projectsCollection, orderBy('order', 'asc'));
            const projectsSnapshot = await getDocs(projectsQuery);

            if (!projectsSnapshot.empty) {
                const fetchedProjects = projectsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Project[];
                setProjects(fetchedProjects);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des projets:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la récupération des projets',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProject?.id) {
                const projectRef = doc(db, 'projects', editingProject.id);
                await updateDoc(projectRef, {
                    title: formData.title,
                    source: formData.source || '',
                    format: formData.format,
                    order: formData.order,
                    isLatest: formData.isLatest,
                    isVideo: formData.source
                        ? formData.source.match(/\.(mp4|webm|ogg)$/i) !== null
                        : false,
                    category: formData.category || '',
                    thumbnail: formData.thumbnail || '',
                });
                setStatusMessage({ type: 'success', message: 'Projet mis à jour avec succès' });
            } else {
                const newProject = {
                    ...formData,
                    order: projects.length,
                    isVideo: formData.source
                        ? formData.source.match(/\.(mp4|webm|ogg)$/i) !== null
                        : false,
                };
                await addDoc(collection(db, 'projects'), newProject);
                setStatusMessage({
                    type: 'success',
                    message: 'Nouvelle réalisation ajoutée avec succès',
                });
            }
            setShowForm(false);
            setEditingProject(null);
            setFormData({
                title: '',
                category: '',
                source: '',
                format: 'portrait',
                order: 0,
                isLatest: false,
                thumbnail: '',
            });
            setPreviewImage(null);
            fetchProjects();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du projet:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        }
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

    // Supprimer tous les projets
    const handleDeleteAllProjects = async () => {
        // Filtrer les projets selon l'onglet actif
        const projectsToDelete = projects.filter((project) =>
            activeTab === 'latest' ? project.isLatest : !project.isLatest,
        );

        if (
            !confirm(
                `Êtes-vous sûr de vouloir supprimer toutes les réalisations de l'onglet actuel (${projectsToDelete.length} projets) ? Cette action est irréversible.`,
            )
        ) {
            return;
        }

        try {
            // Supprimer d'abord tous les médias
            await Promise.all(
                projectsToDelete.map(async (project) => {
                    if (project.source) {
                        const fileName = project.source.split('/').pop();
                        const filePath = project.source.substring(
                            1,
                            project.source.lastIndexOf('/'),
                        );

                        if (fileName) {
                            try {
                                const response = await fetch(
                                    `/api/delete?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`,
                                    {
                                        method: 'DELETE',
                                    },
                                );

                                if (!response.ok) {
                                    console.error(
                                        'Erreur lors de la suppression du média:',
                                        await response.text(),
                                    );
                                }
                            } catch (mediaError) {
                                console.error(
                                    'Erreur lors de la suppression du média:',
                                    mediaError,
                                );
                            }
                        }
                    }
                }),
            );

            // Ensuite supprimer les documents Firestore
            await Promise.all(
                projectsToDelete.map((project) => deleteDoc(doc(db, 'projects', project.id!))),
            );

            // Mettre à jour l'état local des projets
            setProjects((prevProjects) =>
                prevProjects.filter((project) =>
                    activeTab === 'latest' ? !project.isLatest : project.isLatest,
                ),
            );

            setStatusMessage({
                type: 'success',
                message: `Toutes les réalisations de l'onglet actuel (${projectsToDelete.length} projets) ont été supprimées avec succès`,
            });
        } catch (error) {
            console.error('Erreur lors de la suppression des projets:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la suppression des projets',
            });
        }
    };

    // Détecter automatiquement le format (portrait/paysage)
    const detectFormat = async (file: File): Promise<'portrait' | 'paysage'> => {
        if (file.type.startsWith('video/')) {
            return 'paysage'; // Les vidéos sont toujours en paysage
        }

        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                resolve(img.width < img.height ? 'portrait' : 'paysage');
            };
            img.src = URL.createObjectURL(file);
        });
    };

    // Gérer l'upload des fichiers
    const handleFileUpload = async (files: FileList) => {
        setUploading(true);
        setStatusMessage(null);
        setUploadProgress(0);

        try {
            // Trouver le dernier ordre existant
            const lastOrder = Math.max(...projects.map((p) => p.order), -1);
            let currentOrder = lastOrder + 1;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const format = await detectFormat(file);

                // Créer un objet URL pour la prévisualisation locale
                const objectUrl = URL.createObjectURL(file);
                setPreviewImage(objectUrl);

                // Créer un FormData pour l'upload
                const formData = new FormData();
                formData.append('file', file);
                formData.append('path', 'home/projects');
                formData.append('useUuid', 'false'); // Ne pas utiliser d'UUID pour les projets

                // Faire une requête fetch à notre API locale pour sauvegarder le fichier
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Erreur lors du téléchargement du média');
                }

                const data = await response.json();

                // Créer un nouveau projet avec l'ordre incrémenté
                const newProject = {
                    title: '', // Laisser le titre vide
                    source: data.fileUrl,
                    format,
                    order: currentOrder++,
                    isLatest: activeTab === 'latest',
                    isVideo: file.type.startsWith('video/'),
                    category: uploadCategory, // Utiliser la catégorie sélectionnée pour l'upload
                };

                await addDoc(collection(db, 'projects'), newProject);

                // Mettre à jour la progression
                setUploadProgress(((i + 1) / files.length) * 100);
            }

            setStatusMessage({
                type: 'success',
                message: `${files.length} réalisation(s) ajoutée(s) avec succès`,
            });

            // Rafraîchir la liste des projets
            fetchProjects();
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors du téléchargement des médias',
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Gérer le téléchargement de la miniature
    const handleThumbnailUpload = async (files: FileList) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setStatusMessage(null);
        setUploadProgress(0);

        try {
            const file = files[0];

            // Créer un objet URL pour la prévisualisation locale
            const objectUrl = URL.createObjectURL(file);

            // Créer un FormData pour l'upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'home/thumbnails');
            formData.append('useUuid', 'false');

            // Faire une requête fetch à notre API locale
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement de la miniature');
            }

            const data = await response.json();

            // Mettre à jour le formData avec l'URL de la miniature
            setFormData((prev) => ({ ...prev, thumbnail: data.fileUrl }));
            setUploadProgress(100);

            setStatusMessage({
                type: 'success',
                message: 'Miniature téléchargée avec succès',
            });
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors du téléchargement de la miniature',
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setFormData(project);
        setPreviewImage(project.source);
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
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
            try {
                const project = projects.find((p) => p.id === id);
                if (!project) return;

                // Supprimer le média si une source est définie
                if (project.source) {
                    const fileName = project.source.split('/').pop();
                    const filePath = project.source.substring(1, project.source.lastIndexOf('/'));

                    if (fileName) {
                        try {
                            const response = await fetch(
                                `/api/delete?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`,
                                {
                                    method: 'DELETE',
                                },
                            );

                            if (!response.ok) {
                                console.error(
                                    'Erreur lors de la suppression du média:',
                                    await response.text(),
                                );
                            }
                        } catch (mediaError) {
                            console.error('Erreur lors de la suppression du média:', mediaError);
                        }
                    }
                }

                // Supprimer le projet de Firestore
                await deleteDoc(doc(db, 'projects', id));
                setStatusMessage({ type: 'success', message: 'Projet supprimé avec succès' });
                fetchProjects();
            } catch (error) {
                console.error('Erreur lors de la suppression du projet:', error);
                setStatusMessage({ type: 'error', message: 'Erreur lors de la suppression' });
            }
        }
    };

    const handleReorder = async (projectId: string, newOrder: number) => {
        try {
            await updateDoc(doc(db, 'projects', projectId), { order: newOrder });
            fetchProjects();
        } catch (error) {
            console.error('Erreur lors du réordonnancement:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors du réordonnancement' });
        }
    };

    const cancelEdit = () => {
        setEditingProject(null);
        setFormData({
            title: '',
            category: '',
            source: '',
            format: 'portrait',
            order: 0,
            isLatest: false,
            thumbnail: '',
        });
        setPreviewImage(null);
        setShowForm(false);
        setStatusMessage(null);
        setUploadCategory('');
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
                <h2 className="text-xl font-semibold mb-4">Statistiques des Réalisations</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Nombre total de médias</p>
                        <p className="text-3xl font-bold">{stats.totalProjects}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {stats.totalImages} images • {stats.totalVideos} vidéos
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Taille totale</p>
                        <p className="text-3xl font-bold">{formatSize(stats.totalSize)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {formatSize(stats.imagesSize)} images • {formatSize(stats.videosSize)}{' '}
                            vidéos
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">
                            Temps de chargement moyen
                        </p>
                        <p className="text-3xl font-bold">
                            {formatLoadTime(stats.averageLoadTime)}
                        </p>
                        <p className="text-xs text-gray-500">
                            Estimation basée sur une connexion moyenne en France (15 Mbps)
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-md transition-colors ${
                                    activeTab === 'all'
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Nos réalisations
                            </button>
                            <button
                                onClick={() => setActiveTab('latest')}
                                className={`px-4 py-2 rounded-md transition-colors ${
                                    activeTab === 'latest'
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Nos dernières réalisations
                            </button>
                        </div>
                        <div className="flex space-x-2">
                            {projects.length > 0 && (
                                <>
                                    <button
                                        onClick={() => handleDeleteAllProjects()}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                                    >
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                        Tout supprimer
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 flex items-center"
                            >
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
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Nouvelle réalisation
                            </button>
                        </div>
                    </div>

                    {statusMessage && (
                        <div
                            className={`p-4 mb-4 rounded-md ${
                                statusMessage.type === 'success'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {statusMessage.message}
                        </div>
                    )}

                    {/* Sélection de catégorie pour l'upload */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800 mb-3">
                            Catégorie pour l&apos;upload en lot
                        </h4>
                        <div className="flex space-x-3">
                            <div className="flex-1">
                                <select
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value="">Aucune catégorie</option>
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                    placeholder="Ou créer une nouvelle catégorie"
                                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-blue-600">
                            {uploadCategory
                                ? `Tous les médias uploadés seront assignés à la catégorie "${uploadCategory}"`
                                : 'Sélectionnez ou créez une catégorie pour l&apos;assigner automatiquement à tous les médias uploadés'}
                        </p>
                    </div>

                    {/* Zone de drop pour les médias */}
                    <div
                        className={`border-2 border-dashed p-8 mb-8 rounded-lg text-center ${
                            isDragging
                                ? 'border-primary bg-primary bg-opacity-10'
                                : 'border-gray-300'
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
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <p className="mt-2 text-gray-600">
                                    Glissez-déposez des médias ici ou{' '}
                                    <button
                                        type="button"
                                        className="text-primary hover:text-primary-dark font-medium"
                                        onClick={() =>
                                            document.getElementById('fileInput')?.click()
                                        }
                                    >
                                        parcourez votre ordinateur
                                    </button>
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Images et vidéos acceptés
                                </p>
                                <input
                                    id="fileInput"
                                    type="file"
                                    className="hidden"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={(e) =>
                                        e.target.files && handleFileUpload(e.target.files)
                                    }
                                />
                            </>
                        )}
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                {editingProject
                                    ? `Modifier: ${editingProject.title}`
                                    : 'Ajouter une nouvelle réalisation'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Titre
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) =>
                                                setFormData({ ...formData, title: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Catégorie (optionnel)
                                        </label>
                                        <div className="flex space-x-2">
                                            <select
                                                value={formData.category}
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
                                                value={formData.category}
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
                                            value={formData.format}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    format: e.target.value as
                                                        | 'portrait'
                                                        | 'paysage',
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        >
                                            <option value="portrait">Portrait</option>
                                            <option value="paysage">Paysage</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Média
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={formData.source}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        source: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="URL du média"
                                                required
                                            />
                                            <label className="px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300">
                                                Parcourir
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,video/*"
                                                    onChange={(e) =>
                                                        e.target.files &&
                                                        handleFileUpload(e.target.files)
                                                    }
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Champ pour la miniature (visible uniquement si le média est une vidéo) */}
                                    {formData.source &&
                                        formData.source.match(/\.(mp4|webm|ogg)$/i) && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Miniature personnalisée (optionnel)
                                                </label>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        value={formData.thumbnail || ''}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                thumbnail: e.target.value,
                                                            })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="URL de la miniature"
                                                    />
                                                    <label className="px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300">
                                                        Parcourir
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                e.target.files &&
                                                                handleThumbnailUpload(
                                                                    e.target.files,
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                </div>
                                                {formData.thumbnail && (
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-500 mb-1">
                                                            Aperçu de la miniature :
                                                        </p>
                                                        <div className="w-32 h-24 relative overflow-hidden rounded">
                                                            <Image
                                                                src={getMediaUrl(
                                                                    formData.thumbnail,
                                                                )}
                                                                alt="Aperçu de la miniature"
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                            Prévisualisation
                                        </h4>
                                        <div
                                            className={`w-full max-w-[400px] mx-auto relative bg-gray-100 rounded-lg overflow-hidden group ${getItemSizeClass(formData.format || 'paysage')}`}
                                        >
                                            {previewImage ? (
                                                <>
                                                    {previewImage.match(/\.(mp4|webm|ogg)$/i) ? (
                                                        <video
                                                            src={getMediaUrl(previewImage)}
                                                            controls
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Image
                                                            src={getMediaUrl(previewImage)}
                                                            alt="Prévisualisation"
                                                            fill
                                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                    )}
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
                                                    Aucun média sélectionné
                                                </div>
                                            )}
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
                                    {editingProject ? 'Mettre à jour' : 'Ajouter'}
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
                                            Media
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Miniature
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
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {projects
                                        .filter((project) =>
                                            activeTab === 'latest'
                                                ? project.isLatest
                                                : !project.isLatest,
                                        )
                                        .map((project) => (
                                            <tr key={project.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() =>
                                                                handleReorder(
                                                                    project.id!,
                                                                    project.order - 1,
                                                                )
                                                            }
                                                            disabled={project.order === 0}
                                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                        >
                                                            ↑
                                                        </button>
                                                        <span>{project.order}</span>
                                                        <button
                                                            onClick={() =>
                                                                handleReorder(
                                                                    project.id!,
                                                                    project.order + 1,
                                                                )
                                                            }
                                                            disabled={
                                                                project.order ===
                                                                projects.length - 1
                                                            }
                                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                        >
                                                            ↓
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="h-10 w-10 relative overflow-hidden rounded">
                                                        {project.source.match(
                                                            /\.(mp4|webm|ogg)$/i,
                                                        ) ? (
                                                            <video
                                                                src={getMediaUrl(project.source)}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Image
                                                                src={getMediaUrl(project.source)}
                                                                alt={project.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {project.source.match(/\.(mp4|webm|ogg)$/i) && (
                                                        <div className="h-10 w-10 relative overflow-hidden rounded">
                                                            {project.thumbnail ? (
                                                                <Image
                                                                    src={getMediaUrl(
                                                                        project.thumbnail,
                                                                    )}
                                                                    alt={`Miniature de ${project.title}`}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        className="h-6 w-6"
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
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {project.title}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {project.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {project.format}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {project.source.match(/\.(mp4|webm|ogg)$/i)
                                                        ? 'Vidéo'
                                                        : 'Image'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(project)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(project.id!)}
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
