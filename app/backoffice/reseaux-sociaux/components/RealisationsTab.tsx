'use client';

import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useForm } from 'react-hook-form';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface Realisation {
    id?: string;
    date: string;
    title: string;
    category: string;
    description: string;
    image: string;
    order: number;
}

interface RealisationsTabProps {
    onStatusChange: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function RealisationsTab({ onStatusChange }: RealisationsTabProps) {
    const [realisations, setRealisations] = useState<Realisation[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRealisation, setEditingRealisation] = useState<Realisation | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<Realisation>();

    // Récupérer les réalisations depuis Firebase
    useEffect(() => {
        const fetchRealisations = async () => {
            try {
                const realisationsCollection = collection(db, 'reseaux-sociaux-realisations');
                const realisationsSnapshot = await getDocs(realisationsCollection);

                if (!realisationsSnapshot.empty) {
                    const realisationsData = realisationsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Realisation[];

                    // Trier par ordre
                    realisationsData.sort((a, b) => a.order - b.order);
                    setRealisations(realisationsData);
                } else {
                    // Données par défaut
                    const defaultRealisations: Realisation[] = [
                        {
                            date: 'Nov 2024',
                            title: 'Flavor Fusion',
                            category: 'Fitness',
                            description:
                                'Nous avons développé une campagne axée sur le bien-être pour FlavorFit.',
                            image: '/home/projects/image1.jpg',
                            order: 1,
                        },
                        {
                            date: 'Jan 2024',
                            title: 'Taste the Tradition',
                            category: 'Products',
                            description:
                                "Pour NovoSoft, nous avons mis en valeur l'art derrière chaque produit.",
                            image: '/home/projects/image2.jpg',
                            order: 2,
                        },
                    ];

                    setRealisations(defaultRealisations);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des réalisations:', error);
                onStatusChange({
                    type: 'error',
                    message: 'Erreur lors de la récupération des réalisations',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRealisations();
    }, [onStatusChange]);

    // Gérer le drag and drop
    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(realisations);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Mettre à jour l'ordre
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index + 1,
        }));

        setRealisations(updatedItems);

        // Sauvegarder l'ordre dans Firebase
        try {
            for (const item of updatedItems) {
                if (item.id) {
                    const realisationRef = doc(db, 'reseaux-sociaux-realisations', item.id);
                    await updateDoc(realisationRef, { order: item.order });
                }
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'ordre:", error);
        }
    };

    // Gérer la sélection d'image
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Ouvrir le formulaire d'édition
    const handleEdit = (realisation: Realisation) => {
        setEditingRealisation(realisation);
        setValue('date', realisation.date);
        setValue('title', realisation.title);
        setValue('category', realisation.category);
        setValue('description', realisation.description);
        setShowAddForm(false);
        setImagePreview(null);
        setImageFile(null);
    };

    // Ouvrir le formulaire d'ajout
    const handleAdd = () => {
        setEditingRealisation(null);
        reset();
        setValue('order', realisations.length + 1);
        setShowAddForm(true);
        setImagePreview(null);
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Sauvegarder une réalisation
    const onSubmit = async (data: Realisation) => {
        try {
            setSaving(true);
            let imageUrl = editingRealisation?.image || '';

            // Upload de l'image si une nouvelle image est sélectionnée
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                formData.append('path', 'reseaux-sociaux/realisations');
                formData.append('useUuid', 'true');

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de l&apos;upload de l&apos;image');
                }

                const uploadData = await response.json();
                imageUrl = uploadData.fileUrl;
            }

            const realisationData: Realisation = {
                ...data,
                image: imageUrl,
            };

            if (editingRealisation?.id) {
                // Mettre à jour la réalisation existante
                const realisationRef = doc(
                    db,
                    'reseaux-sociaux-realisations',
                    editingRealisation.id,
                );
                await updateDoc(realisationRef, realisationData as any);

                setRealisations(
                    realisations.map((realisation) =>
                        realisation.id === editingRealisation.id
                            ? { ...realisation, ...realisationData }
                            : realisation,
                    ),
                );
            } else {
                // Créer une nouvelle réalisation
                const newRealisationData = {
                    ...realisationData,
                    order: realisations.length + 1,
                };

                const realisationsCollection = collection(db, 'reseaux-sociaux-realisations');
                const docRef = await addDoc(realisationsCollection, newRealisationData);

                setRealisations([...realisations, { ...newRealisationData, id: docRef.id }]);
            }

            onStatusChange({
                type: 'success',
                message: 'Réalisation sauvegardée avec succès',
            });

            setEditingRealisation(null);
            setShowAddForm(false);
            setImageFile(null);
            setImagePreview(null);
            reset();
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            onStatusChange({
                type: 'error',
                message: 'Erreur lors de la sauvegarde de la réalisation',
            });
        } finally {
            setSaving(false);
        }
    };

    // Supprimer une réalisation
    const handleDelete = async (realisation: Realisation) => {
        if (!realisation.id || !confirm('Êtes-vous sûr de vouloir supprimer cette réalisation ?'))
            return;

        try {
            await deleteDoc(doc(db, 'reseaux-sociaux-realisations', realisation.id));
            setRealisations(realisations.filter((r) => r.id !== realisation.id));

            onStatusChange({
                type: 'success',
                message: 'Réalisation supprimée avec succès',
            });
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            onStatusChange({
                type: 'error',
                message: 'Erreur lors de la suppression de la réalisation',
            });
        }
    };

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Réalisations</h2>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    Ajouter une réalisation
                </button>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <p>Composant RealisationsTab en cours de développement...</p>
            </div>
        </div>
    );
}
