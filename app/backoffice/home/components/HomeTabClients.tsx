'use client';

import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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

export default function HomeTabClients() {
    // États pour les marques
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(true);
    const [savingBrand, setSavingBrand] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [previewBrandImage, setPreviewBrandImage] = useState<string | null>(null);
    const [updatingBrandOrder, setUpdatingBrandOrder] = useState(false);

    // États pour les clients
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [savingClient, setSavingClient] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [previewClientImage, setPreviewClientImage] = useState<string | null>(null);
    const [previewClientBgImage, setPreviewClientBgImage] = useState<string | null>(null);
    const [updatingClientOrder, setUpdatingClientOrder] = useState(false);

    // État général
    const [activeTab, setActiveTab] = useState<'brands' | 'clients'>('brands');
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

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

    // Fonction pour gérer le changement d'ordre d'une marque
    const handleReorderBrand = async (brandId: string | undefined, direction: 'up' | 'down') => {
        if (!brandId) return;

        try {
            // Trier les marques par ordre
            const sortedBrands = [...brands].sort((a, b) => (a.order || 0) - (b.order || 0));

            // Trouver l'index actuel de la marque
            const currentIndex = sortedBrands.findIndex((brand) => brand.id === brandId);
            if (currentIndex === -1) return;

            // Déterminer le nouvel index en fonction de la direction
            const newIndex =
                direction === 'up'
                    ? Math.max(0, currentIndex - 1)
                    : Math.min(sortedBrands.length - 1, currentIndex + 1);

            // Si l'index ne change pas (déjà en haut ou en bas), ne rien faire
            if (newIndex === currentIndex) return;

            // Échanger les ordres entre les deux marques
            const targetBrand = sortedBrands[newIndex];
            const currentBrand = sortedBrands[currentIndex];

            const currentOrder = currentBrand.order || 0;
            const targetOrder = targetBrand.order || 0;

            // Mettre à jour les ordres
            const updatedBrands = sortedBrands.map((brand) => {
                if (brand.id === brandId) {
                    return { ...brand, order: targetOrder };
                } else if (brand.id === targetBrand.id) {
                    return { ...brand, order: currentOrder };
                }
                return brand;
            });

            // Mettre à jour l'état local
            setBrands(updatedBrands);

            // Mettre à jour Firestore
            if (currentBrand.id) {
                await updateDoc(doc(db, 'brands', currentBrand.id), {
                    order: targetOrder,
                });
            }

            if (targetBrand.id) {
                await updateDoc(doc(db, 'brands', targetBrand.id), {
                    order: currentOrder,
                });
            }

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

    // Fonction pour gérer le changement d'ordre d'un client
    const handleReorderClient = async (clientId: string | undefined, direction: 'up' | 'down') => {
        if (!clientId) return;

        try {
            // Trier les clients par ordre
            const sortedClients = [...clients].sort((a, b) => (a.order || 0) - (b.order || 0));

            // Trouver l'index actuel du client
            const currentIndex = sortedClients.findIndex((client) => client.id === clientId);
            if (currentIndex === -1) return;

            // Déterminer le nouvel index en fonction de la direction
            const newIndex =
                direction === 'up'
                    ? Math.max(0, currentIndex - 1)
                    : Math.min(sortedClients.length - 1, currentIndex + 1);

            // Si l'index ne change pas (déjà en haut ou en bas), ne rien faire
            if (newIndex === currentIndex) return;

            // Échanger les ordres entre les deux clients
            const targetClient = sortedClients[newIndex];
            const currentClient = sortedClients[currentIndex];

            const currentOrder = currentClient.order || 0;
            const targetOrder = targetClient.order || 0;

            // Mettre à jour les ordres
            const updatedClients = sortedClients.map((client) => {
                if (client.id === clientId) {
                    return { ...client, order: targetOrder };
                } else if (client.id === targetClient.id) {
                    return { ...client, order: currentOrder };
                }
                return client;
            });

            // Mettre à jour l'état local
            setClients(updatedClients);

            // Mettre à jour Firestore
            if (currentClient.id) {
                await updateDoc(doc(db, 'clients', currentClient.id), {
                    order: targetOrder,
                });
            }

            if (targetClient.id) {
                await updateDoc(doc(db, 'clients', targetClient.id), {
                    order: currentOrder,
                });
            }

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

    // Fonctions pour gérer le drag and drop des marques
    const handleDragEndBrands = async (result: DropResult) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;

        const items = Array.from(brands);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Mettre à jour les ordres
        const updatedBrands = items.map((brand, index) => ({
            ...brand,
            order: index,
        }));

        setBrands(updatedBrands);

        // Mettre à jour dans Firestore
        try {
            setUpdatingBrandOrder(true);
            setStatusMessage({ type: 'success', message: "Mise à jour de l'ordre des marques..." });

            for (const brand of updatedBrands) {
                if (brand.id) {
                    await updateDoc(doc(db, 'brands', brand.id), {
                        order: brand.order,
                    });
                }
            }

            setStatusMessage({ type: 'success', message: 'Ordre des marques mis à jour' });
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'ordre des marques:", error);
            setStatusMessage({
                type: 'error',
                message: "Erreur lors de la mise à jour de l'ordre des marques",
            });
        } finally {
            setUpdatingBrandOrder(false);
        }
    };

    // Fonctions pour gérer le drag and drop des clients
    const handleDragEndClients = async (result: DropResult) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;

        const items = Array.from(clients);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Mettre à jour les ordres
        const updatedClients = items.map((client, index) => ({
            ...client,
            order: index,
        }));

        setClients(updatedClients);

        // Mettre à jour dans Firestore
        try {
            setUpdatingClientOrder(true);
            setStatusMessage({ type: 'success', message: "Mise à jour de l'ordre des clients..." });

            for (const client of updatedClients) {
                if (client.id) {
                    await updateDoc(doc(db, 'clients', client.id), {
                        order: client.order,
                    });
                }
            }

            setStatusMessage({ type: 'success', message: 'Ordre des clients mis à jour' });
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'ordre des clients:", error);
            setStatusMessage({
                type: 'error',
                message: "Erreur lors de la mise à jour de l'ordre des clients",
            });
        } finally {
            setUpdatingClientOrder(false);
        }
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
                                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors disabled:opacity-50"
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
                                <div className="overflow-auto">
                                    <DragDropContext onDragEnd={handleDragEndBrands}>
                                        <Droppable droppableId="brands">
                                            {(provided) => (
                                                <table
                                                    className="min-w-full divide-y divide-gray-200"
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {brands
                                                            .sort(
                                                                (a, b) =>
                                                                    (a.order || 0) - (b.order || 0),
                                                            )
                                                            .map((brand, index) => (
                                                                <Draggable
                                                                    key={`brand-${index}`}
                                                                    draggableId={`brand-${index}`}
                                                                    index={index}
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <tr
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            className={`${snapshot.isDragging ? 'bg-gray-100' : ''}`}
                                                                        >
                                                                            <td
                                                                                className="px-6 py-4 whitespace-nowrap"
                                                                                {...provided.dragHandleProps}
                                                                            >
                                                                                <div className="flex flex-col items-center">
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            handleReorderBrand(
                                                                                                brand.id,
                                                                                                'up',
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            brand.order ===
                                                                                                0 ||
                                                                                            updatingBrandOrder
                                                                                        }
                                                                                        className={`text-gray-500 hover:text-gray-700 mb-1 ${
                                                                                            brand.order ===
                                                                                                0 ||
                                                                                            updatingBrandOrder
                                                                                                ? 'opacity-30 cursor-not-allowed'
                                                                                                : ''
                                                                                        }`}
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
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M5 15l7-7 7 7"
                                                                                            />
                                                                                        </svg>
                                                                                    </button>
                                                                                    <span className="text-sm font-medium flex items-center">
                                                                                        <svg
                                                                                            className="h-5 w-5 text-gray-400 mr-1"
                                                                                            fill="none"
                                                                                            viewBox="0 0 24 24"
                                                                                            stroke="currentColor"
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M4 8h16M4 16h16"
                                                                                            />
                                                                                        </svg>
                                                                                        {brand.order !==
                                                                                        undefined
                                                                                            ? brand.order
                                                                                            : '?'}
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            handleReorderBrand(
                                                                                                brand.id,
                                                                                                'down',
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            brand.order ===
                                                                                                brands.length -
                                                                                                    1 ||
                                                                                            updatingBrandOrder
                                                                                        }
                                                                                        className={`text-gray-500 hover:text-gray-700 mt-1 ${
                                                                                            brand.order ===
                                                                                                brands.length -
                                                                                                    1 ||
                                                                                            updatingBrandOrder
                                                                                                ? 'opacity-30 cursor-not-allowed'
                                                                                                : ''
                                                                                        }`}
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
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M19 9l-7 7-7-7"
                                                                                            />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                {brand.name}
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <div className="h-10 w-24 relative bg-gray-200 rounded-md">
                                                                                    <Image
                                                                                        src={getMediaUrl(
                                                                                            brand.imageSrc,
                                                                                        )}
                                                                                        alt={
                                                                                            brand.name
                                                                                        }
                                                                                        fill
                                                                                        className="object-contain"
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <div className="max-w-xs truncate">
                                                                                    {brand.href}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleEditBrand(
                                                                                            brand,
                                                                                        )
                                                                                    }
                                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                                >
                                                                                    Modifier
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleDeleteBrand(
                                                                                            brand,
                                                                                        )
                                                                                    }
                                                                                    className="text-red-600 hover:text-red-900"
                                                                                >
                                                                                    Supprimer
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                        {provided.placeholder}
                                                    </tbody>
                                                </table>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                    {updatingBrandOrder && (
                                        <div className="flex justify-center py-2">
                                            <Spinner small />
                                        </div>
                                    )}
                                </div>
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
                                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors disabled:opacity-50"
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
                                <div className="overflow-auto">
                                    <DragDropContext onDragEnd={handleDragEndClients}>
                                        <Droppable droppableId="clients">
                                            {(provided) => (
                                                <table
                                                    className="min-w-full divide-y divide-gray-200"
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Ordre
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Nom
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Domaine
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Photo
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Arrière-plan
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {clients
                                                            .sort(
                                                                (a, b) =>
                                                                    (a.order || 0) - (b.order || 0),
                                                            )
                                                            .map((client, index) => (
                                                                <Draggable
                                                                    key={`client-${index}`}
                                                                    draggableId={`client-${index}`}
                                                                    index={index}
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <tr
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            className={`${snapshot.isDragging ? 'bg-gray-100' : ''}`}
                                                                        >
                                                                            <td
                                                                                className="px-6 py-4 whitespace-nowrap"
                                                                                {...provided.dragHandleProps}
                                                                            >
                                                                                <div className="flex flex-col items-center">
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            handleReorderClient(
                                                                                                client.id,
                                                                                                'up',
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            client.order ===
                                                                                                0 ||
                                                                                            updatingClientOrder
                                                                                        }
                                                                                        className={`text-gray-500 hover:text-gray-700 mb-1 ${
                                                                                            client.order ===
                                                                                                0 ||
                                                                                            updatingClientOrder
                                                                                                ? 'opacity-30 cursor-not-allowed'
                                                                                                : ''
                                                                                        }`}
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
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M5 15l7-7 7 7"
                                                                                            />
                                                                                        </svg>
                                                                                    </button>
                                                                                    <span className="text-sm font-medium flex items-center">
                                                                                        <svg
                                                                                            className="h-5 w-5 text-gray-400 mr-1"
                                                                                            fill="none"
                                                                                            viewBox="0 0 24 24"
                                                                                            stroke="currentColor"
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M4 8h16M4 16h16"
                                                                                            />
                                                                                        </svg>
                                                                                        {client.order !==
                                                                                        undefined
                                                                                            ? client.order
                                                                                            : '?'}
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            handleReorderClient(
                                                                                                client.id,
                                                                                                'down',
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            client.order ===
                                                                                                clients.length -
                                                                                                    1 ||
                                                                                            updatingClientOrder
                                                                                        }
                                                                                        className={`text-gray-500 hover:text-gray-700 mt-1 ${
                                                                                            client.order ===
                                                                                                clients.length -
                                                                                                    1 ||
                                                                                            updatingClientOrder
                                                                                                ? 'opacity-30 cursor-not-allowed'
                                                                                                : ''
                                                                                        }`}
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
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M19 9l-7 7-7-7"
                                                                                            />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                {client.name}
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                {client.domain}
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <div className="h-12 w-12 relative">
                                                                                    <Image
                                                                                        src={getMediaUrl(
                                                                                            client.imageSrc,
                                                                                        )}
                                                                                        alt={
                                                                                            client.name
                                                                                        }
                                                                                        fill
                                                                                        className="object-cover rounded-full"
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <div className="h-12 w-24 relative">
                                                                                    <Image
                                                                                        src={getMediaUrl(
                                                                                            client.imageBackground,
                                                                                        )}
                                                                                        alt={`${client.name} background`}
                                                                                        fill
                                                                                        className="object-cover rounded-md"
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleEditClient(
                                                                                            client,
                                                                                        )
                                                                                    }
                                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                                >
                                                                                    Modifier
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleDeleteClient(
                                                                                            client,
                                                                                        )
                                                                                    }
                                                                                    className="text-red-600 hover:text-red-900"
                                                                                >
                                                                                    Supprimer
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                        {provided.placeholder}
                                                    </tbody>
                                                </table>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                    {updatingClientOrder && (
                                        <div className="flex justify-center py-2">
                                            <Spinner small />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
