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
import { useEffect, useState } from 'react';

import { Spinner } from '@/app/admin/components/Spinner';
import { db } from '@/app/admin/lib/firebase-client';

interface Project {
    id?: string;
    title: string;
    category: string;
    source: string;
    isVideo?: boolean;
    format: 'portrait' | 'paysage';
    order: number;
    isLatest?: boolean;
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
    });

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
    const calculateStats = async () => {
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
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (projects.length > 0) {
            calculateStats();
        }
    }, [projects]);

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
                await updateDoc(doc(db, 'projects', editingProject.id), formData);
                setStatusMessage({ type: 'success', message: 'Projet mis à jour avec succès' });
            } else {
                const newProject = {
                    ...formData,
                    order: projects.length,
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
            });
            setPreviewImage(null);
            fetchProjects();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du projet:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage({ type: 'success', message: 'Chargement du média...' });

            // Créer un objet URL pour la prévisualisation locale
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);

            // Créer un FormData pour l'upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'home/projects');

            // Faire une requête fetch à notre API locale pour sauvegarder le fichier
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement du média');
            }

            const data = await response.json();

            // Mettre à jour le formulaire avec l'URL
            setFormData((prev) => ({ ...prev, source: data.fileUrl }));

            // Mettre à jour le message de statut pour confirmer que l'image est chargée
            setStatusMessage({ type: 'success', message: 'Média téléchargé avec succès' });
        } catch (error) {
            console.error('Erreur lors du téléchargement du média:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors du téléchargement du média' });
        }
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setFormData(project);
        setPreviewImage(project.source);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
            try {
                const project = projects.find(p => p.id === id);
                if (!project) return;

                // Supprimer le média si une source est définie
                if (project.source) {
                    const fileName = project.source.split('/').pop();
                    const filePath = project.source.substring(1, project.source.lastIndexOf('/'));
                    
                    if (fileName) {
                        try {
                            const response = await fetch(`/api/delete?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`, {
                                method: 'DELETE',
                            });
                            
                            if (!response.ok) {
                                console.error('Erreur lors de la suppression du média:', await response.text());
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
        });
        setPreviewImage(null);
        setShowForm(false);
        setStatusMessage(null);
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
                        <h2 className="text-xl font-semibold">Gestion des Réalisations</h2>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingProject(null);
                                    setFormData({
                                        title: '',
                                        category: '',
                                        source: '',
                                        format: 'portrait',
                                        order: 0,
                                        isLatest: false,
                                    });
                                    setPreviewImage(null);
                                    setShowForm(true);
                                }}
                                className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
                            >
                                Nouvelle réalisation
                            </button>
                        </div>
                    </div>

                    {statusMessage && (
                        <div
                            className={`p-4 mb-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                        >
                            {statusMessage.message}
                        </div>
                    )}

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
                                            required
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

                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.isLatest}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        isLatest: e.target.checked,
                                                    })
                                                }
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-sm text-gray-700">
                                                Projet récent
                                            </label>
                                        </div>
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
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                            Prévisualisation
                                        </h4>
                                        <div className="h-[280px] w-full relative bg-gray-100 rounded-lg overflow-hidden">
                                            {previewImage &&
                                                (previewImage.match(/\.(mp4|webm|ogg)$/i) ? (
                                                    <video
                                                        src={previewImage}
                                                        controls
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Image
                                                        src={previewImage}
                                                        alt="Prévisualisation"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ))}
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
                        <div className="flex space-x-4 mb-4">
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
                                                                src={project.source}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Image
                                                                src={project.source}
                                                                alt={project.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        )}
                                                    </div>
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
