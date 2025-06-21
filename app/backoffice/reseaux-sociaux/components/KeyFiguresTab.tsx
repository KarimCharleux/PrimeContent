'use client';

import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useForm } from 'react-hook-form';

import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface KeyFigure {
    id?: string;
    value: number;
    suffix: string;
    description: string;
    isPercentage: boolean;
    order: number;
}

interface KeyFiguresTabProps {
    onStatusChange: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function KeyFiguresTab({ onStatusChange }: KeyFiguresTabProps) {
    const [figures, setFigures] = useState<KeyFigure[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingFigure, setEditingFigure] = useState<KeyFigure | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm<KeyFigure>();

    const isPercentage = watch('isPercentage');

    // Récupérer les chiffres depuis Firebase
    useEffect(() => {
        const fetchFigures = async () => {
            try {
                const figuresCollection = collection(db, 'reseaux-sociaux-figures');
                const figuresSnapshot = await getDocs(figuresCollection);

                if (!figuresSnapshot.empty) {
                    const figuresData = figuresSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as KeyFigure[];

                    // Trier par ordre
                    figuresData.sort((a, b) => a.order - b.order);
                    setFigures(figuresData);
                } else {
                    // Données par défaut
                    const defaultFigures: KeyFigure[] = [
                        {
                            value: 2,
                            suffix: 'M',
                            description: "Taux d'investissement",
                            isPercentage: false,
                            order: 1,
                        },
                        {
                            value: 150,
                            suffix: 'K',
                            description: 'Taux de connexion',
                            isPercentage: false,
                            order: 2,
                        },
                        {
                            value: 5,
                            suffix: 'M',
                            description: "Taux d'acquisition",
                            isPercentage: false,
                            order: 3,
                        },
                        {
                            value: 85,
                            suffix: '%',
                            description: "Taux d'engagement",
                            isPercentage: true,
                            order: 4,
                        },
                        {
                            value: 500,
                            suffix: 'K',
                            description: "Chiffre d'affaires",
                            isPercentage: false,
                            order: 5,
                        },
                    ];

                    // Créer les chiffres par défaut
                    for (const figure of defaultFigures) {
                        const figuresCollection = collection(db, 'reseaux-sociaux-figures');
                        await addDoc(figuresCollection, figure);
                    }

                    setFigures(defaultFigures);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des chiffres:', error);
                onStatusChange({
                    type: 'error',
                    message: 'Erreur lors de la récupération des chiffres',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchFigures();
    }, [onStatusChange]);

    // Gérer le drag and drop
    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(figures);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Mettre à jour l'ordre
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index + 1,
        }));

        setFigures(updatedItems);

        // Sauvegarder l'ordre dans Firebase
        try {
            for (const item of updatedItems) {
                if (item.id) {
                    const figureRef = doc(db, 'reseaux-sociaux-figures', item.id);
                    await updateDoc(figureRef, { order: item.order });
                }
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'ordre:", error);
        }
    };

    // Ouvrir le formulaire d'édition
    const handleEdit = (figure: KeyFigure) => {
        setEditingFigure(figure);
        setValue('value', figure.value);
        setValue('suffix', figure.suffix);
        setValue('description', figure.description);
        setValue('isPercentage', figure.isPercentage);
        setShowAddForm(false);
    };

    // Ouvrir le formulaire d'ajout
    const handleAdd = () => {
        setEditingFigure(null);
        reset();
        setValue('isPercentage', false);
        setValue('order', figures.length + 1);
        setShowAddForm(true);
    };

    // Sauvegarder un chiffre
    const onSubmit = async (data: KeyFigure) => {
        try {
            setSaving(true);

            // Ajuster le suffix si c&apos;est un pourcentage
            const figureData = {
                ...data,
                suffix: data.isPercentage ? '%' : data.suffix,
            };

            if (editingFigure?.id) {
                // Mettre à jour le chiffre existant
                const figureRef = doc(db, 'reseaux-sociaux-figures', editingFigure.id);
                await updateDoc(figureRef, figureData);

                setFigures(
                    figures.map((figure) =>
                        figure.id === editingFigure.id ? { ...figure, ...figureData } : figure,
                    ),
                );
            } else {
                // Créer un nouveau chiffre
                const newFigureData = {
                    ...figureData,
                    order: figures.length + 1,
                };

                const figuresCollection = collection(db, 'reseaux-sociaux-figures');
                const docRef = await addDoc(figuresCollection, newFigureData);

                setFigures([...figures, { ...newFigureData, id: docRef.id }]);
            }

            onStatusChange({
                type: 'success',
                message: 'Chiffre sauvegardé avec succès',
            });

            setEditingFigure(null);
            setShowAddForm(false);
            reset();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            onStatusChange({
                type: 'error',
                message: 'Erreur lors de la sauvegarde du chiffre',
            });
        } finally {
            setSaving(false);
        }
    };

    // Supprimer un chiffre
    const handleDelete = async (figure: KeyFigure) => {
        if (!figure.id || !confirm('Êtes-vous sûr de vouloir supprimer ce chiffre ?')) return;

        try {
            await deleteDoc(doc(db, 'reseaux-sociaux-figures', figure.id));
            setFigures(figures.filter((f) => f.id !== figure.id));

            onStatusChange({
                type: 'success',
                message: 'Chiffre supprimé avec succès',
            });
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            onStatusChange({
                type: 'error',
                message: 'Erreur lors de la suppression du chiffre',
            });
        }
    };

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Chiffres Clés</h2>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Ajouter un chiffre
                </button>
            </div>

            {/* Formulaire d'ajout/édition */}
            {(showAddForm || editingFigure) && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingFigure ? 'Modifier le chiffre' : 'Ajouter un chiffre'}
                    </h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="value"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Valeur
                                </label>
                                <input
                                    type="number"
                                    id="value"
                                    {...register('value', {
                                        required: 'La valeur est requise',
                                        min: { value: 0, message: 'La valeur doit être positive' },
                                    })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="100"
                                />
                                {errors.value && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.value.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="suffix"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Suffixe
                                </label>
                                <input
                                    type="text"
                                    id="suffix"
                                    disabled={isPercentage}
                                    {...register('suffix', {
                                        required: !isPercentage ? 'Le suffixe est requis' : false,
                                    })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                                    placeholder="K, M, etc."
                                />
                                {errors.suffix && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.suffix.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Description
                            </label>
                            <input
                                type="text"
                                id="description"
                                {...register('description', {
                                    required: 'La description est requise',
                                })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Description du chiffre..."
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isPercentage"
                                {...register('isPercentage')}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                                htmlFor="isPercentage"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                C&apos;est un pourcentage (%)
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingFigure(null);
                                    setShowAddForm(false);
                                    reset();
                                }}
                                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Liste des chiffres */}
            <div className="bg-white shadow rounded-lg p-6">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="figures">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {figures.map((figure, index) => (
                                    <Draggable
                                        key={figure.id || index}
                                        draggableId={figure.id || String(index)}
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`border rounded-lg p-4 ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'}`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="cursor-move text-gray-400 hover:text-gray-600"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M7 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zM7 8a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1zM7 14a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM13 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zM13 8a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1zM13 14a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(figure)}
                                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                        >
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(figure)}
                                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                                                        +{figure.value}
                                                        {figure.isPercentage ? '%' : figure.suffix}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {figure.description}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    );
}
