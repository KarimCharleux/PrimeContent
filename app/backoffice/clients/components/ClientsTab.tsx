'use client';

// Imports pour drag and drop
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
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    deleteDoc,
    query,
    where,
} from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { isExternalVideo } from '../../../utils/videoManager';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';
import { ClientStats } from '../../models/types';

interface Brand {
    id?: string;
    name: string;
    imageSrc: string;
    order?: number;
}

interface Client {
    id?: string;
    name: string;
    domain: string;
    imageSrc: string;
    imageBackground: string;
    order?: number;
}

interface ClientsTabProps {
    activeTab: 'brands' | 'clients';
}

// Composant pour une carte de marque triable
function SortableBrandCard({
    brand,
    onEdit,
    onDelete,
    onManageMedia,
}: {
    brand: Brand;
    onEdit: (brand: Brand) => void;
    onDelete: (brand: Brand) => void;
    onManageMedia: (type: 'brand', brand: Brand) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: brand.id!,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
        >
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <div className="relative h-32 bg-gray-700 flex items-center justify-center">
                    <Image
                        src={getMediaUrl(brand.imageSrc)}
                        alt={brand.name}
                        fill
                        className="object-contain"
                    />
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{brand.name}</h4>
                    <button
                        {...attributes}
                        {...listeners}
                        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing text-lg"
                        title="Glisser pour réorganiser"
                    >
                        ☰
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onManageMedia('brand', brand)}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                        📁 Médias
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(brand)}
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
                        onClick={() => onDelete(brand)}
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
    );
}

// Composant pour une carte de client triable
function SortableClientCard({
    client,
    onEdit,
    onDelete,
    onManageMedia,
}: {
    client: Client;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
    onManageMedia: (type: 'client', client: Client) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: client.id!,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
        >
            <div className="relative h-48 bg-gray-700 flex items-center justify-center">
                {client.imageBackground && (
                    <Image
                        src={getMediaUrl(client.imageBackground)}
                        alt={`Arrière-plan de ${client.name}`}
                        fill
                        className="object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                <div className="relative z-10 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                        <Image
                            src={getMediaUrl(client.imageSrc)}
                            alt={client.name}
                            fill
                            className="object-contain"
                        />
                    </div>
                    <p className="text-white font-medium">{client.name}</p>
                    <p className="text-gray-300 text-sm">{client.domain}</p>
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{client.name}</h4>
                    <button
                        {...attributes}
                        {...listeners}
                        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing text-lg"
                        title="Glisser pour réorganiser"
                    >
                        ☰
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onManageMedia('client', client)}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                        📁 Médias
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(client)}
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
                        onClick={() => onDelete(client)}
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
    );
}

export default function ClientsTab({ activeTab }: ClientsTabProps) {
    const router = useRouter();

    // États pour les marques
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(true);
    const [savingBrand, setSavingBrand] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [previewBrandImage, setPreviewBrandImage] = useState<string | null>(null);

    // États pour les clients
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [savingClient, setSavingClient] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [previewClientImage, setPreviewClientImage] = useState<string | null>(null);
    const [previewClientBgImage, setPreviewClientBgImage] = useState<string | null>(null);

    // État général
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // État pour les statistiques
    const [stats, setStats] = useState<ClientStats>({
        totalBrands: 0,
        totalClients: 0,
        totalImages: 0,
        totalVideos: 0,
        totalVideosInternal: 0,
        totalVideosExternal: 0,
        totalSize: 0,
        imagesSize: 0,
        videosSize: 0,
        averageLoadTime: 0,
        byBrandType: {
            images: 0,
            videos: 0,
            size: 0,
        },
        byClientType: {
            images: 0,
            videos: 0,
            size: 0,
        },
    });

    // Fonction pour charger les vidéos Firebase d'un client
    const loadClientVideos = useCallback(
        async (clientType: 'brand' | 'celebrity', clientId: string): Promise<any[]> => {
            try {
                const videosCollection = collection(db, 'client-videos');
                const q = query(
                    videosCollection,
                    where('clientType', '==', clientType),
                    where('clientId', '==', clientId),
                );
                const videosSnapshot = await getDocs(q);

                const videos: any[] = [];
                videosSnapshot.forEach((doc) => {
                    const data = doc.data();
                    videos.push({
                        id: doc.id,
                        title: data.title,
                        source: data.source || data.youtubeUrl || '',
                        provider: data.provider || 'youtube',
                        videoId: data.videoId || data.youtubeId,
                        order: data.order || 0,
                    });
                });

                return videos;
            } catch (error) {
                console.error(
                    `Erreur lors du chargement des vidéos Firebase pour ${clientId}:`,
                    error,
                );
                return [];
            }
        },
        [],
    );

    // Fonction pour calculer les statistiques globales des médias
    const calculateStats = useCallback(async () => {
        try {
            const newStats: ClientStats = {
                totalBrands: brands.length,
                totalClients: clients.length,
                totalImages: 0,
                totalVideos: 0,
                totalVideosInternal: 0,
                totalVideosExternal: 0,
                totalSize: 0,
                imagesSize: 0,
                videosSize: 0,
                averageLoadTime: 0,
                byBrandType: {
                    images: 0,
                    videos: 0,
                    size: 0,
                },
                byClientType: {
                    images: 0,
                    videos: 0,
                    size: 0,
                },
            };

            let totalMediaCount = 0;

            // Calculer les stats pour les marques
            for (const brand of brands) {
                if (brand.name) {
                    try {
                        const clientName = brand.name.toLowerCase().replace(/\s+/g, '-');
                        const response = await fetch(
                            `/api/gallery-images?path=client/marques/${clientName}&_t=${Date.now()}`,
                        );

                        if (response.ok) {
                            const data = await response.json();

                            // Utiliser 'media' en priorité, puis 'images' pour compatibilité
                            const files = data.media || data.images || [];

                            files.forEach((file: any) => {
                                totalMediaCount++;

                                if (file.type === 'video') {
                                    newStats.totalVideos++;
                                    newStats.byBrandType.videos++;

                                    // Vérifier si c'est une vidéo externe (YouTube, Dailymotion)
                                    // Chercher dans plusieurs champs possibles pour l'URL
                                    const videoSource = file.source || file.url || file.name || '';
                                    const isExternal =
                                        isExternalVideo(videoSource) ||
                                        videoSource.includes('youtube.com') ||
                                        videoSource.includes('youtu.be') ||
                                        videoSource.includes('dailymotion.com') ||
                                        videoSource.includes('dai.ly');

                                    if (isExternal) {
                                        newStats.totalVideosExternal++;
                                        // Les vidéos externes ne comptent pas dans la taille
                                    } else {
                                        newStats.totalVideosInternal++;
                                        if (file.size && file.size > 0) {
                                            newStats.videosSize += file.size;
                                            newStats.byBrandType.size += file.size;
                                        } else {
                                            // Estimation pour les vidéos sans taille
                                            newStats.videosSize += 5 * 1024 * 1024; // 5MB
                                            newStats.byBrandType.size += 5 * 1024 * 1024;
                                        }
                                    }
                                } else {
                                    newStats.totalImages++;
                                    newStats.byBrandType.images++;

                                    if (file.size && file.size > 0) {
                                        newStats.imagesSize += file.size;
                                        newStats.byBrandType.size += file.size;
                                    } else {
                                        // Estimation pour les images sans taille
                                        newStats.imagesSize += 500 * 1024; // 500KB
                                        newStats.byBrandType.size += 500 * 1024;
                                    }
                                }
                            });
                        }

                        // Charger aussi les vidéos Firebase pour cette marque
                        if (brand.id) {
                            const firebaseVideos = await loadClientVideos('brand', brand.id);
                            firebaseVideos.forEach((video) => {
                                totalMediaCount++;
                                newStats.totalVideos++;
                                newStats.byBrandType.videos++;

                                // Toutes les vidéos Firebase sont externes par définition
                                newStats.totalVideosExternal++;
                                // Les vidéos externes ne comptent pas dans la taille
                            });
                        }
                    } catch (error) {
                        // Erreur silencieuse pour les marques sans médias
                    }
                }
            }

            // Calculer les stats pour les talents
            for (const client of clients) {
                if (client.name) {
                    try {
                        const clientName = client.name.toLowerCase().replace(/\s+/g, '-');
                        const response = await fetch(
                            `/api/gallery-images?path=client/talents/${clientName}&_t=${Date.now()}`,
                        );

                        if (response.ok) {
                            const data = await response.json();

                            // Utiliser 'media' en priorité, puis 'images' pour compatibilité
                            const files = data.media || data.images || [];

                            files.forEach((file: any) => {
                                totalMediaCount++;

                                if (file.type === 'video') {
                                    newStats.totalVideos++;
                                    newStats.byClientType.videos++;

                                    // Vérifier si c'est une vidéo externe (YouTube, Dailymotion)
                                    // Chercher dans plusieurs champs possibles pour l'URL
                                    const videoSource = file.source || file.url || file.name || '';
                                    const isExternal =
                                        isExternalVideo(videoSource) ||
                                        videoSource.includes('youtube.com') ||
                                        videoSource.includes('youtu.be') ||
                                        videoSource.includes('dailymotion.com') ||
                                        videoSource.includes('dai.ly');

                                    if (isExternal) {
                                        newStats.totalVideosExternal++;
                                        // Les vidéos externes ne comptent pas dans la taille
                                    } else {
                                        newStats.totalVideosInternal++;
                                        if (file.size && file.size > 0) {
                                            newStats.videosSize += file.size;
                                            newStats.byClientType.size += file.size;
                                        } else {
                                            // Estimation pour les vidéos sans taille
                                            newStats.videosSize += 5 * 1024 * 1024; // 5MB
                                            newStats.byClientType.size += 5 * 1024 * 1024;
                                        }
                                    }
                                } else {
                                    newStats.totalImages++;
                                    newStats.byClientType.images++;

                                    if (file.size && file.size > 0) {
                                        newStats.imagesSize += file.size;
                                        newStats.byClientType.size += file.size;
                                    } else {
                                        // Estimation pour les images sans taille
                                        newStats.imagesSize += 500 * 1024; // 500KB
                                        newStats.byClientType.size += 500 * 1024;
                                    }
                                }
                            });
                        }

                        // Charger aussi les vidéos Firebase pour ce talent
                        if (client.id) {
                            const firebaseVideos = await loadClientVideos('celebrity', client.id);
                            firebaseVideos.forEach((video) => {
                                totalMediaCount++;
                                newStats.totalVideos++;
                                newStats.byClientType.videos++;

                                // Toutes les vidéos Firebase sont externes par définition
                                newStats.totalVideosExternal++;
                                // Les vidéos externes ne comptent pas dans la taille
                            });
                        }
                    } catch (error) {
                        // Erreur silencieuse pour les talents sans médias
                    }
                }
            }

            // Calculer la taille totale et le temps de chargement moyen
            newStats.totalSize = newStats.imagesSize + newStats.videosSize;
            newStats.averageLoadTime =
                totalMediaCount > 0
                    ? (((newStats.totalSize * 8) / (15 * 1024 * 1024)) * 1000) / totalMediaCount
                    : 0;

            setStats(newStats);
        } catch (error) {
            console.error('Erreur lors du calcul des statistiques:', error);
        }
    }, [brands, clients, loadClientVideos]);

    // Configuration pour le drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // États de visibilité des formulaires
    const [showBrandForm, setShowBrandForm] = useState(false);
    const [showClientForm, setShowClientForm] = useState(false);

    // Formulaires React Hook Form
    const {
        register: registerBrand,
        handleSubmit: handleSubmitBrand,
        reset: resetBrand,
        setValue: setValueBrand,
        formState: { errors: errorsBrand },
    } = useForm<Brand>();

    const {
        register: registerClient,
        handleSubmit: handleSubmitClient,
        reset: resetClient,
        setValue: setValueClient,
        formState: { errors: errorsClient },
    } = useForm<Client>();

    // Chargement des données depuis Firebase
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Charger les marques
                setLoadingBrands(true);
                const brandsCollection = collection(db, 'brands');
                const brandsSnapshot = await getDocs(brandsCollection);

                if (!brandsSnapshot.empty) {
                    const fetchedBrands = brandsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Brand[];

                    const sortedBrands = [...fetchedBrands].sort(
                        (a, b) => (a.order || 0) - (b.order || 0),
                    );
                    setBrands(sortedBrands);
                } else {
                    setBrands([]);
                }
                setLoadingBrands(false);

                // Charger les clients
                setLoadingClients(true);
                const clientsCollection = collection(db, 'clients');
                const clientsSnapshot = await getDocs(clientsCollection);

                if (!clientsSnapshot.empty) {
                    const fetchedClients = clientsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Client[];

                    const sortedClients = [...fetchedClients].sort(
                        (a, b) => (a.order || 0) - (b.order || 0),
                    );
                    setClients(sortedClients);
                } else {
                    setClients([]);
                }
                setLoadingClients(false);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                setStatusMessage({ type: 'error', message: 'Impossible de charger les données' });
                setBrands([]);
                setClients([]);
                setLoadingBrands(false);
                setLoadingClients(false);
            }
        };

        fetchData();
    }, []);

    // Calculer les statistiques quand les données changent
    useEffect(() => {
        if (brands.length > 0 || clients.length > 0) {
            calculateStats();
        }
    }, [brands, clients, calculateStats]);

    // Fonction pour gérer la navigation vers la gestion des médias
    const handleManageMedia = (type: 'brand' | 'client', item: Brand | Client) => {
        const clientType = type === 'brand' ? 'marques' : 'talents';
        const itemName = item.name.toLowerCase().replace(/\s+/g, '-');
        router.push(`/backoffice/clients/media?type=${clientType}&name=${itemName}&id=${item.id}`);
    };

    // Fonction pour supprimer un fichier média
    const deleteMediaFile = async (fileUrl: string) => {
        if (!fileUrl) return;

        try {
            const fileName = fileUrl.split('/').pop();
            const filePath = fileUrl.substring(1, fileUrl.lastIndexOf('/'));

            if (fileName) {
                const response = await fetch(
                    `/api/delete?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`,
                    {
                        method: 'DELETE',
                    },
                );

                if (!response.ok) {
                    console.error(
                        'Erreur lors de la suppression du fichier:',
                        await response.text(),
                    );
                    return false;
                }
                return true;
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du fichier:', error);
            return false;
        }
        return false;
    };

    // Fonction pour gérer l'upload d'image pour les marques
    const handleBrandImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage({ type: 'success', message: "Chargement de l'image..." });

            const objectUrl = URL.createObjectURL(file);
            setPreviewBrandImage(objectUrl);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'client/marques');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors du téléchargement de l'image");
            }

            const data = await response.json();

            if (
                editingBrand?.id &&
                editingBrand.imageSrc &&
                editingBrand.imageSrc !== data.fileUrl
            ) {
                await deleteMediaFile(editingBrand.imageSrc);
            }

            setValueBrand('imageSrc', data.fileUrl, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });

            setStatusMessage({ type: 'success', message: 'Image téléchargée avec succès' });
        } catch (error) {
            console.error("Erreur lors du téléchargement de l'image:", error);
            setStatusMessage({
                type: 'error',
                message: "Erreur lors du téléchargement de l'image",
            });
        }
    };

    // Fonction pour gérer l'upload d'image pour les clients
    const handleClientImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage({ type: 'success', message: "Chargement de l'image..." });

            const objectUrl = URL.createObjectURL(file);
            setPreviewClientImage(objectUrl);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'client/talents');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors du téléchargement de l'image");
            }

            const data = await response.json();

            if (
                editingClient?.id &&
                editingClient.imageSrc &&
                editingClient.imageSrc !== data.fileUrl
            ) {
                await deleteMediaFile(editingClient.imageSrc);
            }

            setValueClient('imageSrc', data.fileUrl, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });

            setStatusMessage({ type: 'success', message: 'Image téléchargée avec succès' });
        } catch (error) {
            console.error("Erreur lors du téléchargement de l'image:", error);
            setStatusMessage({
                type: 'error',
                message: "Erreur lors du téléchargement de l'image",
            });
        }
    };

    // Fonction pour gérer l'upload d'image d'arrière-plan pour les clients
    const handleClientBgImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage({
                type: 'success',
                message: "Chargement de l'image d'arrière-plan...",
            });

            const objectUrl = URL.createObjectURL(file);
            setPreviewClientBgImage(objectUrl);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'client/talents');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors du téléchargement de l'image d'arrière-plan");
            }

            const data = await response.json();

            if (
                editingClient?.id &&
                editingClient.imageBackground &&
                editingClient.imageBackground !== data.fileUrl
            ) {
                await deleteMediaFile(editingClient.imageBackground);
            }

            setValueClient('imageBackground', data.fileUrl, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });

            setStatusMessage({
                type: 'success',
                message: "Image d'arrière-plan téléchargée avec succès",
            });
        } catch (error) {
            console.error("Erreur lors du téléchargement de l'image d'arrière-plan:", error);
            setStatusMessage({
                type: 'error',
                message: "Erreur lors du téléchargement de l'image d'arrière-plan",
            });
        }
    };

    // Soumission du formulaire de marque
    const onSubmitBrand = async (data: Brand) => {
        setSavingBrand(true);
        try {
            if (editingBrand?.id) {
                await updateDoc(doc(db, 'brands', editingBrand.id), {
                    name: data.name,
                    imageSrc: data.imageSrc,
                    order: editingBrand.order || 0,
                });

                setBrands((prevBrands) =>
                    prevBrands.map((brand) =>
                        brand.id === editingBrand.id
                            ? { ...data, id: brand.id, order: brand.order }
                            : brand,
                    ),
                );
                setStatusMessage({ type: 'success', message: 'Marque mise à jour avec succès' });
            } else {
                const maxOrder =
                    brands.length > 0
                        ? Math.max(...brands.map((brand) => brand.order || 0)) + 1
                        : 0;

                const docRef = await addDoc(collection(db, 'brands'), {
                    name: data.name,
                    imageSrc: data.imageSrc,
                    order: maxOrder,
                });

                setBrands((prevBrands) => [
                    ...prevBrands,
                    { ...data, id: docRef.id, order: maxOrder },
                ]);
                setStatusMessage({
                    type: 'success',
                    message: 'Nouvelle marque ajoutée avec succès',
                });
            }

            resetBrand({ name: '', imageSrc: '' });
            setEditingBrand(null);
            setPreviewBrandImage(null);
            setShowBrandForm(false);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        } finally {
            setSavingBrand(false);
        }
    };

    // Gestion de l'édition d'une marque
    const handleEditBrand = (brand: Brand) => {
        setEditingBrand(brand);
        resetBrand(brand);
        setPreviewBrandImage(brand.imageSrc);
        setShowBrandForm(true);
    };

    // Suppression d'une marque
    const handleDeleteBrand = async (brand: Brand) => {
        if (!brand.id) return;

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la marque "${brand.name}" ?`)) {
            try {
                await deleteDoc(doc(db, 'brands', brand.id));

                if (brand.imageSrc) {
                    await deleteMediaFile(brand.imageSrc);
                }

                setBrands((prevBrands) => prevBrands.filter((b) => b.id !== brand.id));
                setStatusMessage({ type: 'success', message: 'Marque supprimée avec succès' });

                if (editingBrand?.id === brand.id) {
                    setEditingBrand(null);
                    resetBrand();
                    setPreviewBrandImage(null);
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                setStatusMessage({ type: 'error', message: 'Erreur lors de la suppression' });
            }
        }
    };

    // Annuler l'édition d'une marque
    const cancelEditBrand = () => {
        setEditingBrand(null);
        resetBrand({ name: '', imageSrc: '' });
        setPreviewBrandImage(null);
    };

    // Gérer la fin du drag and drop pour les marques
    const handleBrandDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = brands.findIndex((brand) => brand.id === active.id);
            const newIndex = brands.findIndex((brand) => brand.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newBrands = arrayMove(brands, oldIndex, newIndex);

                // Mettre à jour les ordres
                newBrands.forEach((brand, idx) => {
                    brand.order = idx;
                });

                setBrands(newBrands);

                // Sauvegarder en base
                try {
                    await Promise.all(
                        newBrands.map((brand) =>
                            updateDoc(doc(db, 'brands', brand.id!), { order: brand.order }),
                        ),
                    );
                } catch (error) {
                    console.error('Erreur lors de la réorganisation des marques:', error);
                    setStatusMessage({
                        type: 'error',
                        message: 'Erreur lors de la réorganisation des marques',
                    });
                }
            }
        }
    };

    // Soumission du formulaire de client
    const onSubmitClient = async (data: Client) => {
        setSavingClient(true);
        try {
            if (editingClient?.id) {
                await updateDoc(doc(db, 'clients', editingClient.id), {
                    name: data.name,
                    domain: data.domain,
                    imageSrc: data.imageSrc,
                    imageBackground: data.imageBackground,
                    order: editingClient.order || 0,
                });

                setClients((prevClients) =>
                    prevClients.map((client) =>
                        client.id === editingClient.id
                            ? { ...data, id: client.id, order: client.order }
                            : client,
                    ),
                );
                setStatusMessage({ type: 'success', message: 'Client mis à jour avec succès' });
            } else {
                const maxOrder =
                    clients.length > 0
                        ? Math.max(...clients.map((client) => client.order || 0)) + 1
                        : 0;

                const docRef = await addDoc(collection(db, 'clients'), {
                    name: data.name,
                    domain: data.domain,
                    imageSrc: data.imageSrc,
                    imageBackground: data.imageBackground,
                    order: maxOrder,
                });

                setClients((prevClients) => [
                    ...prevClients,
                    { ...data, id: docRef.id, order: maxOrder },
                ]);
                setStatusMessage({ type: 'success', message: 'Nouveau client ajouté avec succès' });
            }

            resetClient({
                name: '',
                domain: '',
                imageSrc: '',
                imageBackground: '',
            });
            setEditingClient(null);
            setPreviewClientImage(null);
            setPreviewClientBgImage(null);
            setShowClientForm(false);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        } finally {
            setSavingClient(false);
        }
    };

    // Gestion de l'édition d'un client
    const handleEditClient = (client: Client) => {
        setEditingClient(client);
        resetClient(client);
        setPreviewClientImage(client.imageSrc);
        setPreviewClientBgImage(client.imageBackground);
        setShowClientForm(true);
    };

    // Suppression d'un client
    const handleDeleteClient = async (client: Client) => {
        if (!client.id) return;

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.name}" ?`)) {
            try {
                await deleteDoc(doc(db, 'clients', client.id));

                const imagesToDelete = [
                    { url: client.imageSrc, type: 'Image principale' },
                    { url: client.imageBackground, type: "Image d'arrière-plan" },
                ];

                for (const image of imagesToDelete) {
                    if (image.url) {
                        await deleteMediaFile(image.url);
                    }
                }

                setClients((prevClients) => prevClients.filter((c) => c.id !== client.id));
                setStatusMessage({ type: 'success', message: 'Client supprimé avec succès' });

                if (editingClient?.id === client.id) {
                    setEditingClient(null);
                    resetClient();
                    setPreviewClientImage(null);
                    setPreviewClientBgImage(null);
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                setStatusMessage({ type: 'error', message: 'Erreur lors de la suppression' });
            }
        }
    };

    // Annuler l'édition d'un client
    const cancelEditClient = () => {
        setEditingClient(null);
        resetClient({
            name: '',
            domain: '',
            imageSrc: '',
            imageBackground: '',
        });
        setPreviewClientImage(null);
        setPreviewClientBgImage(null);
    };

    // Gérer la fin du drag and drop pour les clients
    const handleClientDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = clients.findIndex((client) => client.id === active.id);
            const newIndex = clients.findIndex((client) => client.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newClients = arrayMove(clients, oldIndex, newIndex);

                // Mettre à jour les ordres
                newClients.forEach((client, idx) => {
                    client.order = idx;
                });

                setClients(newClients);

                // Sauvegarder en base
                try {
                    await Promise.all(
                        newClients.map((client) =>
                            updateDoc(doc(db, 'clients', client.id!), { order: client.order }),
                        ),
                    );
                } catch (error) {
                    console.error('Erreur lors de la réorganisation des clients:', error);
                    setStatusMessage({
                        type: 'error',
                        message: 'Erreur lors de la réorganisation des clients',
                    });
                }
            }
        }
    };

    // Fonctions utilitaires pour l'affichage
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

    const formatLoadTime = (milliseconds: number): string => {
        if (milliseconds < 1000) {
            return milliseconds.toFixed(0) + ' ms';
        } else {
            return (milliseconds / 1000).toFixed(1) + ' s';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
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

                {/* Section Statistiques Globales */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Statistiques Globales des Médias</h2>

                    {/* Statistiques des médias de tous les marques et talents */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total médias</p>
                            <p className="text-2xl font-bold text-blue-900">
                                {stats.totalImages + stats.totalVideos}
                            </p>
                            <p className="text-xs text-blue-700">
                                {stats.totalImages} images • {stats.totalVideos} vidéos
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-sm text-yellow-600 font-medium">Images</p>
                            <p className="text-2xl font-bold text-yellow-900">
                                {stats.totalImages}
                            </p>
                            <p className="text-xs text-yellow-700">
                                {formatSize(stats.imagesSize)}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Vidéos</p>
                            <p className="text-2xl font-bold text-green-900">{stats.totalVideos}</p>
                            <p className="text-xs text-green-700">
                                {stats.totalVideosInternal} internes • {stats.totalVideosExternal}{' '}
                                externes • {formatSize(stats.videosSize)}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Taille totale</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {formatSize(stats.totalSize)}
                            </p>
                            <p className="text-xs text-purple-700">
                                Temps: {formatLoadTime(stats.averageLoadTime)}
                            </p>
                        </div>
                    </div>

                    {/* Statistiques par type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                Marques ({stats.totalBrands})
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Images:</span>
                                    <span className="text-sm font-medium">
                                        {stats.byBrandType.images}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Vidéos:</span>
                                    <span className="text-sm font-medium">
                                        {stats.byBrandType.videos}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Taille:</span>
                                    <span className="text-sm font-medium">
                                        {formatSize(stats.byBrandType.size)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                Talents ({stats.totalClients})
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Images:</span>
                                    <span className="text-sm font-medium">
                                        {stats.byClientType.images}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Vidéos:</span>
                                    <span className="text-sm font-medium">
                                        {stats.byClientType.videos}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Taille:</span>
                                    <span className="text-sm font-medium">
                                        {formatSize(stats.byClientType.size)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Marques */}
                {activeTab === 'brands' && (
                    <>
                        {(showBrandForm || editingBrand) && (
                            <form
                                onSubmit={handleSubmitBrand(onSubmitBrand)}
                                className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8"
                            >
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                    {editingBrand
                                        ? `Modifier: ${editingBrand.name}`
                                        : 'Ajouter une nouvelle marque'}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom de la marque
                                            </label>
                                            <input
                                                type="text"
                                                {...registerBrand('name', {
                                                    required: 'Le nom est requis',
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            {errorsBrand.name && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errorsBrand.name.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Logo de la marque
                                            </label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    {...registerBrand('imageSrc', {
                                                        required: "L'URL de l'image est requise",
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="URL de l'image"
                                                />
                                                <label className="px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300">
                                                    Parcourir
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleBrandImageUpload}
                                                    />
                                                </label>
                                            </div>
                                            {errorsBrand.imageSrc && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errorsBrand.imageSrc.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                Prévisualisation du logo
                                            </h4>
                                            <div className="h-40 w-full flex items-center justify-center bg-gray-700 rounded-md">
                                                {previewBrandImage ? (
                                                    <div className="relative h-32 w-32">
                                                        <Image
                                                            src={getMediaUrl(previewBrandImage)}
                                                            alt="Prévisualisation"
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400">
                                                        Aucune image sélectionnée
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    {editingBrand && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                cancelEditBrand();
                                                setShowBrandForm(false);
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={savingBrand}
                                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors disabled:opacity-50 mt-6"
                                    >
                                        {savingBrand ? (
                                            <Spinner small white />
                                        ) : editingBrand ? (
                                            'Mettre à jour'
                                        ) : (
                                            'Ajouter'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Marques existantes ({brands.length})
                                </h3>
                                <button
                                    onClick={() => {
                                        setEditingBrand(null);
                                        resetBrand();
                                        setPreviewBrandImage(null);
                                        setShowBrandForm(true);
                                    }}
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
                                    <span>Nouvelle marque</span>
                                </button>
                            </div>

                            {loadingBrands ? (
                                <div className="flex justify-center py-10">
                                    <Spinner />
                                </div>
                            ) : brands.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <div className="text-gray-400 mb-4">
                                        <svg
                                            className="mx-auto h-12 w-12"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Aucune marque
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Commencez par ajouter votre première marque
                                    </p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleBrandDragEnd}
                                >
                                    <SortableContext
                                        items={brands.map((brand) => brand.id!)}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {brands.map((brand) => (
                                                <SortableBrandCard
                                                    key={brand.id}
                                                    brand={brand}
                                                    onEdit={handleEditBrand}
                                                    onDelete={handleDeleteBrand}
                                                    onManageMedia={handleManageMedia}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </>
                )}

                {/* Section Clients */}
                {activeTab === 'clients' && (
                    <>
                        {(showClientForm || editingClient) && (
                            <form
                                onSubmit={handleSubmitClient(onSubmitClient)}
                                className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8"
                            >
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                    {editingClient
                                        ? `Modifier: ${editingClient.name}`
                                        : 'Ajouter un nouveau client'}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom du client
                                            </label>
                                            <input
                                                type="text"
                                                {...registerClient('name', {
                                                    required: 'Le nom est requis',
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            {errorsClient.name && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errorsClient.name.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Domaine / Métier
                                            </label>
                                            <input
                                                type="text"
                                                {...registerClient('domain', {
                                                    required: 'Le domaine est requis',
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            {errorsClient.domain && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errorsClient.domain.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Photo du client (PNG)
                                            </label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    {...registerClient('imageSrc', {
                                                        required: "L'URL de l'image est requise",
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="URL de l'image"
                                                />
                                                <label className="px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300">
                                                    Parcourir
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleClientImageUpload}
                                                    />
                                                </label>
                                            </div>
                                            {errorsClient.imageSrc && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errorsClient.imageSrc.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Image d&apos;arrière-plan
                                            </label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    {...registerClient('imageBackground', {
                                                        required:
                                                            "L'URL de l'image d'arrière-plan est requise",
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="URL de l'image d'arrière-plan"
                                                />
                                                <label className="px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300">
                                                    Parcourir
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleClientBgImageUpload}
                                                    />
                                                </label>
                                            </div>
                                            {errorsClient.imageBackground && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errorsClient.imageBackground.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                Prévisualisation de la photo
                                            </h4>
                                            <div className="h-40 w-full flex items-center justify-center bg-gray-100 rounded-md">
                                                {previewClientImage ? (
                                                    <div className="relative h-32 w-32">
                                                        <Image
                                                            src={getMediaUrl(previewClientImage)}
                                                            alt="Prévisualisation"
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400">
                                                        Aucune image sélectionnée
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                Prévisualisation de l&apos;arrière-plan
                                            </h4>
                                            <div className="h-40 w-full flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
                                                {previewClientBgImage ? (
                                                    <div className="relative h-full w-full">
                                                        <Image
                                                            src={getMediaUrl(previewClientBgImage)}
                                                            alt="Prévisualisation de l'arrière-plan"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400">
                                                        Aucune image d&apos;arrière-plan
                                                        sélectionnée
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    {editingClient && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                cancelEditClient();
                                                setShowClientForm(false);
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={savingClient}
                                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors disabled:opacity-50 mt-6"
                                    >
                                        {savingClient ? (
                                            <Spinner small white />
                                        ) : editingClient ? (
                                            'Mettre à jour'
                                        ) : (
                                            'Ajouter'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Talents existants ({clients.length})
                                </h3>
                                <button
                                    onClick={() => {
                                        setEditingClient(null);
                                        resetClient();
                                        setPreviewClientImage(null);
                                        setPreviewClientBgImage(null);
                                        setShowClientForm(true);
                                    }}
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
                                    <span>Nouveau talent</span>
                                </button>
                            </div>

                            {loadingClients ? (
                                <div className="flex justify-center py-10">
                                    <Spinner />
                                </div>
                            ) : clients.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <div className="text-gray-400 mb-4">
                                        <svg
                                            className="mx-auto h-12 w-12"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Aucun talent
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Commencez par ajouter votre premier talent
                                    </p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleClientDragEnd}
                                >
                                    <SortableContext
                                        items={clients.map((client) => client.id!)}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {clients.map((client) => (
                                                <SortableClientCard
                                                    key={client.id}
                                                    client={client}
                                                    onEdit={handleEditClient}
                                                    onDelete={handleDeleteClient}
                                                    onManageMedia={handleManageMedia}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
