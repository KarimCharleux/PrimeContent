'use client';

import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { db } from '../../lib/firebase-client';

interface KeyFigure {
    id: string;
    value: number;
    suffix: string;
    description: string;
    isPercentage: boolean;
    order: number;
}

interface KeyFigureForm {
    value: number;
    suffix: string;
    description: string;
    isPercentage: boolean;
}

function SortableItem({
    figure,
    onEdit,
    onDelete,
}: {
    figure: KeyFigure;
    onEdit: (figure: KeyFigure) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: figure.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white border border-gray-200 rounded-lg p-4 mb-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <span className="text-2xl font-bold text-blue-600 mr-3">
                            {figure.value}
                            {figure.isPercentage ? '%' : figure.suffix}
                        </span>
                        {figure.isPercentage && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                C&apos;est un pourcentage
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 text-sm">{figure.description}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                    <button
                        {...attributes}
                        {...listeners}
                        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                        title="Glisser pour réorganiser"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onEdit(figure)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifier"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(figure.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function KeyFiguresTab() {
    const [figures, setFigures] = useState<KeyFigure[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingFigure, setEditingFigure] = useState<KeyFigure | null>(null);
    const [showForm, setShowForm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<KeyFigureForm>();

    const watchIsPercentage = watch('isPercentage');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => {
        fetchFigures();
    }, []);

    const fetchFigures = async () => {
        try {
            const figuresCollection = collection(db, 'web-figures');
            const figuresSnapshot = await getDocs(figuresCollection);
            const figuresData = figuresSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as KeyFigure[];

            figuresData.sort((a, b) => a.order - b.order);
            setFigures(figuresData);
        } catch (error) {
            console.error('Erreur lors de la récupération des chiffres:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = figures.findIndex((figure) => figure.id === active.id);
            const newIndex = figures.findIndex((figure) => figure.id === over?.id);

            const newFigures = arrayMove(figures, oldIndex, newIndex);
            setFigures(newFigures);

            // Mettre à jour l'ordre dans Firebase
            try {
                const updatePromises = newFigures.map((figure, index) =>
                    updateDoc(doc(db, 'web-figures', figure.id), { order: index + 1 }),
                );
                await Promise.all(updatePromises);
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l&apos;ordre:', error);
                fetchFigures(); // Recharger en cas d'erreur
            }
        }
    };

    const onSubmit = async (data: KeyFigureForm) => {
        try {
            if (editingFigure) {
                // Modification
                await updateDoc(doc(db, 'web-figures', editingFigure.id), data);
            } else {
                // Ajout
                const newOrder = figures.length + 1;
                await addDoc(collection(db, 'web-figures'), {
                    ...data,
                    order: newOrder,
                });
            }

            reset();
            setEditingFigure(null);
            setShowForm(false);
            fetchFigures();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde');
        }
    };

    const handleEdit = (figure: KeyFigure) => {
        setEditingFigure(figure);
        reset({
            value: figure.value,
            suffix: figure.suffix,
            description: figure.description,
            isPercentage: figure.isPercentage,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce chiffre ?')) {
            try {
                await deleteDoc(doc(db, 'web-figures', id));
                fetchFigures();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    const handleCancel = () => {
        reset();
        setEditingFigure(null);
        setShowForm(false);
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Chiffres Clés</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Ajouter un chiffre
                </button>
            </div>

            {/* Formulaire */}
            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-4">
                        {editingFigure ? 'Modifier le chiffre' : 'Nouveau chiffre'}
                    </h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valeur
                            </label>
                            <input
                                type="number"
                                {...register('value', {
                                    required: 'La valeur est requise',
                                    valueAsNumber: true,
                                    min: { value: 0, message: 'La valeur doit être positive' },
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="100"
                            />
                            {errors.value && (
                                <p className="text-red-500 text-sm mt-1">{errors.value.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    {...register('isPercentage')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    C&apos;est un pourcentage
                                </span>
                            </label>
                        </div>

                        {!watchIsPercentage && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Suffixe (optionnel)
                                </label>
                                <input
                                    type="text"
                                    {...register('suffix')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="K, M, +, etc."
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                {...register('description', {
                                    required: 'La description est requise',
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Description du chiffre"
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {editingFigure ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Liste des chiffres */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={figures.map((figure) => figure.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div>
                        {figures.map((figure) => (
                            <SortableItem
                                key={figure.id}
                                figure={figure}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {figures.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    Aucun chiffre configuré. Cliquez sur "Ajouter un chiffre" pour commencer.
                </div>
            )}
        </div>
    );
}
