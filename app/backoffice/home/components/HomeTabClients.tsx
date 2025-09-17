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
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface Brand {
    id?: string;
    name: string;
    imageSrc: string;
    href: string;
    order?: number;
}

interface Client {
    id?: string;
    name: string;
    domain: string;
    imageSrc: string;
    imageBackground: string;
    href: string;
    order?: number;
}

// Composant pour une ligne triable de marque
function SortableBrandRow({
    brand,
    index,
    onEdit,
    onDelete,
}: {
    brand: Brand;
    index: number;
    onEdit: (brand: Brand) => void;
    onDelete: (brand: Brand) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: brand.id!,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className="bg-white hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-center w-20">
                <button
                    {...attributes}
                    {...listeners}
                    className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing text-lg"
                    title="Glisser pour réorganiser"
                >
                    ☰
                </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{brand.name}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex-shrink-0 h-10 w-10">
                    <Image
                        className="h-10 w-10 object-contain"
                        src={getMediaUrl(brand.imageSrc)}
                        alt={brand.name}
                        width={40}
                        height={40}
                    />
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-blue-600 hover:text-blue-900">
                    <a href={brand.href} target="_blank" rel="noopener noreferrer">
                        {brand.href}
                    </a>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                    onClick={() => onEdit(brand)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                    Modifier
                </button>
                <button onClick={() => onDelete(brand)} className="text-red-600 hover:text-red-900">
                    Supprimer
                </button>
            </td>
        </tr>
    );
}

// Composant pour une ligne triable de client
function SortableClientRow({
    client,
    index,
    onEdit,
    onDelete,
}: {
    client: Client;
    index: number;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: client.id!,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className="bg-white hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-center w-20">
                <button
                    {...attributes}
                    {...listeners}
                    className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing text-lg"
                    title="Glisser pour réorganiser"
                >
                    ☰
                </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={getMediaUrl(client.imageSrc)}
                            alt={client.name}
                            width={40}
                            height={40}
                        />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.domain}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="relative h-20 w-32 rounded-lg overflow-hidden">
                    <Image
                        src={getMediaUrl(client.imageBackground)}
                        alt={`${client.name} background`}
                        fill
                        className="object-cover"
                    />
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                    onClick={() => onEdit(client)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                    Modifier
                </button>
                <button
                    onClick={() => onDelete(client)}
                    className="text-red-600 hover:text-red-900"
                >
                    Supprimer
                </button>
            </td>
        </tr>
    );
}

export default function HomeTabClients() {
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
    const [activeTab, setActiveTab] = useState<'brands' | 'clients'>('brands');
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // Configuration pour le drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Formulaires React Hook Form
    const {
        register: registerBrand,
        handleSubmit: handleSubmitBrand,
        reset: resetBrand,
        watch: watchBrand,
        setValue: setValueBrand,
        formState: { errors: errorsBrand },
    } = useForm<Brand>();

    const {
        register: registerClient,
        handleSubmit: handleSubmitClient,
        reset: resetClient,
        watch: watchClient,
        setValue: setValueClient,
        formState: { errors: errorsClient },
    } = useForm<Client>();

    const watchedBrandValues = watchBrand();
    const watchedClientValues = watchClient();

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

                    // Vérifier si les marques ont déjà un ordre défini
                    const hasOrderProperty = fetchedBrands.some(
                        (brand) => brand.order !== undefined,
                    );

                    if (!hasOrderProperty) {
                        // Initialiser les ordres si pas définis
                        const brandsWithOrder = fetchedBrands.map((brand, index) => ({
                            ...brand,
                            order: index,
                        }));
                        setBrands(brandsWithOrder);

                        // Mettre à jour dans Firestore
                        for (const brand of brandsWithOrder) {
                            if (brand.id) {
                                await updateDoc(doc(db, 'brands', brand.id), {
                                    order: brand.order,
                                });
                            }
                        }
                    } else {
                        // Trier par ordre si déjà défini
                        const sortedBrands = [...fetchedBrands].sort(
                            (a, b) => (a.order || 0) - (b.order || 0),
                        );
                        setBrands(sortedBrands);
                    }
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

                    // Vérifier si les clients ont déjà un ordre défini
                    const hasOrderProperty = fetchedClients.some(
                        (client) => client.order !== undefined,
                    );

                    if (!hasOrderProperty) {
                        // Initialiser les ordres si pas définis
                        const clientsWithOrder = fetchedClients.map((client, index) => ({
                            ...client,
                            order: index,
                        }));
                        setClients(clientsWithOrder);

                        // Mettre à jour dans Firestore
                        for (const client of clientsWithOrder) {
                            if (client.id) {
                                await updateDoc(doc(db, 'clients', client.id), {
                                    order: client.order,
                                });
                            }
                        }
                    } else {
                        // Trier par ordre si déjà défini
                        const sortedClients = [...fetchedClients].sort(
                            (a, b) => (a.order || 0) - (b.order || 0),
                        );
                        setClients(sortedClients);
                    }
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

            // Créer un objet URL pour la prévisualisation locale
            const objectUrl = URL.createObjectURL(file);
            setPreviewBrandImage(objectUrl);

            // Créer un FormData pour l'upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'home/brands');

            // Faire une requête fetch à notre API locale pour sauvegarder le fichier
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors du téléchargement de l'image");
            }

            const data = await response.json();

            // Si on est en train de modifier une marque existante et qu'elle a déjà une image
            if (
                editingBrand?.id &&
                editingBrand.imageSrc &&
                editingBrand.imageSrc !== data.fileUrl
            ) {
                // Supprimer l'ancienne image
                await deleteMediaFile(editingBrand.imageSrc);
            }

            // Mettre à jour le formulaire avec l'URL
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

    // Fonction pour gérer l'upload d'image pour les clients (photo principale)
    const handleClientImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage({ type: 'success', message: "Chargement de l'image..." });

            // Créer un objet URL pour la prévisualisation locale
            const objectUrl = URL.createObjectURL(file);
            setPreviewClientImage(objectUrl);

            // Créer un FormData pour l'upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'home/clients');

            // Faire une requête fetch à notre API locale pour sauvegarder le fichier
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors du téléchargement de l'image");
            }

            const data = await response.json();

            // Si on est en train de modifier un client existant et qu'il a déjà une image
            if (
                editingClient?.id &&
                editingClient.imageSrc &&
                editingClient.imageSrc !== data.fileUrl
            ) {
                // Supprimer l'ancienne image
                await deleteMediaFile(editingClient.imageSrc);
            }

            // Mettre à jour le formulaire avec l'URL
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

            // Créer un objet URL pour la prévisualisation locale
            const objectUrl = URL.createObjectURL(file);
            setPreviewClientBgImage(objectUrl);

            // Créer un FormData pour l'upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'home/clients');

            // Faire une requête fetch à notre API locale pour sauvegarder le fichier
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors du téléchargement de l'image d'arrière-plan");
            }

            const data = await response.json();

            // Si on est en train de modifier un client existant et qu'il a déjà une image d'arrière-plan
            if (
                editingClient?.id &&
                editingClient.imageBackground &&
                editingClient.imageBackground !== data.fileUrl
            ) {
                // Supprimer l'ancienne image
                await deleteMediaFile(editingClient.imageBackground);
            }

            // Mettre à jour le formulaire avec l'URL
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
                    setStatusMessage({
                        type: 'success',
                        message: 'Ordre de la marque modifié avec succès',
                    });
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

    // Soumission du formulaire de marque
    const onSubmitBrand = async (data: Brand) => {
        setSavingBrand(true);
        try {
            if (editingBrand?.id) {
                // Mise à jour d'une marque existante
                await updateDoc(doc(db, 'brands', editingBrand.id), {
                    name: data.name,
                    imageSrc: data.imageSrc,
                    href: data.href,
                    order: editingBrand.order || 0, // Conserver l'ordre existant
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
                // Ajout d'une nouvelle marque
                // Trouver l'ordre le plus élevé et ajouter 1
                const maxOrder =
                    brands.length > 0
                        ? Math.max(...brands.map((brand) => brand.order || 0)) + 1
                        : 0;

                const docRef = await addDoc(collection(db, 'brands'), {
                    name: data.name,
                    imageSrc: data.imageSrc,
                    href: data.href,
                    order: maxOrder, // Assigner le nouvel ordre
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

            resetBrand({
                name: '',
                imageSrc: '',
                href: '',
            });
            setEditingBrand(null);
            setPreviewBrandImage(null);
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
    };

    // Suppression d'une marque
    const handleDeleteBrand = async (brand: Brand) => {
        if (!brand.id) return;

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la marque "${brand.name}" ?`)) {
            try {
                // Supprimer la marque de Firestore
                await deleteDoc(doc(db, 'brands', brand.id));

                // Supprimer l'image si elle existe
                if (brand.imageSrc) {
                    await deleteMediaFile(brand.imageSrc);
                }

                setBrands((prevBrands) => prevBrands.filter((b) => b.id !== brand.id));
                setStatusMessage({ type: 'success', message: 'Marque supprimée avec succès' });

                // Si la marque en cours d'édition est supprimée, réinitialiser le formulaire
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
        resetBrand({
            name: '',
            imageSrc: '',
            href: '',
        });
        setPreviewBrandImage(null);
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
                    setStatusMessage({
                        type: 'success',
                        message: 'Ordre du client modifié avec succès',
                    });
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

    // Soumission du formulaire de client
    const onSubmitClient = async (data: Client) => {
        setSavingClient(true);
        try {
            if (editingClient?.id) {
                // Mise à jour d'un client existant
                await updateDoc(doc(db, 'clients', editingClient.id), {
                    name: data.name,
                    domain: data.domain,
                    imageSrc: data.imageSrc,
                    imageBackground: data.imageBackground,
                    href: data.href,
                    order: editingClient.order || 0, // Conserver l'ordre existant
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
                // Ajout d'un nouveau client
                // Trouver l'ordre le plus élevé et ajouter 1
                const maxOrder =
                    clients.length > 0
                        ? Math.max(...clients.map((client) => client.order || 0)) + 1
                        : 0;

                const docRef = await addDoc(collection(db, 'clients'), {
                    name: data.name,
                    domain: data.domain,
                    imageSrc: data.imageSrc,
                    imageBackground: data.imageBackground,
                    href: data.href,
                    order: maxOrder, // Assigner le nouvel ordre
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
                href: '',
            });
            setEditingClient(null);
            setPreviewClientImage(null);
            setPreviewClientBgImage(null);
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
    };

    // Suppression d'un client
    const handleDeleteClient = async (client: Client) => {
        if (!client.id) return;

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.name}" ?`)) {
            try {
                // Supprimer le client de Firestore
                await deleteDoc(doc(db, 'clients', client.id));

                // Supprimer les images si elles existent
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

                // Si le client en cours d'édition est supprimé, réinitialiser le formulaire
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
            href: '',
        });
        setPreviewClientImage(null);
        setPreviewClientBgImage(null);
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Gestion des Clients & Marques</h2>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab('brands')}
                            className={`px-4 py-2 rounded-md ${
                                activeTab === 'brands'
                                    ? 'bg-black text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            } transition-colors`}
                        >
                            Marques
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('clients')}
                            className={`px-4 py-2 rounded-md ${
                                activeTab === 'clients'
                                    ? 'bg-black text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            } transition-colors`}
                        >
                            Clients
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

                {/* Section Marques */}
                {activeTab === 'brands' && (
                    <>
                        <form
                            onSubmit={handleSubmitBrand(onSubmitBrand)}
                            className="space-y-6 mb-8"
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

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lien (href)
                                        </label>
                                        <input
                                            type="text"
                                            {...registerBrand('href', {
                                                required: 'Le lien est requis',
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errorsBrand.href && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errorsBrand.href.message}
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
                                        onClick={cancelEditBrand}
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

                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                                Marques existantes
                            </h3>
                            {loadingBrands ? (
                                <div className="flex justify-center py-10">
                                    <Spinner />
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleBrandDragEnd}
                                >
                                    <div className="overflow-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                                        Ordre
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Nom
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Logo
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Lien
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <SortableContext
                                                items={brands.map((brand) => brand.id!)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {brands
                                                        .sort(
                                                            (a, b) =>
                                                                (a.order || 0) - (b.order || 0),
                                                        )
                                                        .map((brand, index) => (
                                                            <SortableBrandRow
                                                                key={brand.id}
                                                                brand={brand}
                                                                index={index}
                                                                onEdit={handleEditBrand}
                                                                onDelete={handleDeleteBrand}
                                                            />
                                                        ))}
                                                </tbody>
                                            </SortableContext>
                                        </table>
                                    </div>
                                </DndContext>
                            )}
                        </div>
                    </>
                )}

                {/* Section Clients */}
                {activeTab === 'clients' && (
                    <>
                        <form
                            onSubmit={handleSubmitClient(onSubmitClient)}
                            className="space-y-6 mb-8"
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
                                            Lien (href)
                                        </label>
                                        <input
                                            type="text"
                                            {...registerClient('href', {
                                                required: 'Le lien est requis',
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errorsClient.href && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errorsClient.href.message}
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
                                                    Aucune image d&apos;arrière-plan sélectionnée
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
                                        onClick={cancelEditClient}
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

                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                                Clients existants
                            </h3>
                            {loadingClients ? (
                                <div className="flex justify-center py-10">
                                    <Spinner />
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleClientDragEnd}
                                >
                                    <div className="overflow-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                                        Ordre
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Client
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Arrière-plan
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <SortableContext
                                                items={clients.map((client) => client.id!)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {clients
                                                        .sort(
                                                            (a, b) =>
                                                                (a.order || 0) - (b.order || 0),
                                                        )
                                                        .map((client, index) => (
                                                            <SortableClientRow
                                                                key={client.id}
                                                                client={client}
                                                                index={index}
                                                                onEdit={handleEditClient}
                                                                onDelete={handleDeleteClient}
                                                            />
                                                        ))}
                                                </tbody>
                                            </SortableContext>
                                        </table>
                                    </div>
                                </DndContext>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
