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

interface ProcessStep {
    id: string;
    number: string;
    title: string;
    description: string;
    order: number;
}

interface ProcessStepForm {
    number: string;
    title: string;
    description: string;
}

function SortableItem({
    step,
    onEdit,
    onDelete,
}: {
    step: ProcessStep;
    onEdit: (step: ProcessStep) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: step.id,
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
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2 py-1 rounded mr-3">
                            {step.number}
                        </span>
                        <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">{step.description}</p>
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
                        onClick={() => onEdit(step)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifier"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(step.id)}
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

export default function ProcessTab() {
    const [steps, setSteps] = useState<ProcessStep[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
    const [showForm, setShowForm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProcessStepForm>();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => {
        fetchSteps();
    }, []);

    const fetchSteps = async () => {
        try {
            const stepsCollection = collection(db, 'web-process');
            const stepsSnapshot = await getDocs(stepsCollection);
            const stepsData = stepsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as ProcessStep[];

            stepsData.sort((a, b) => a.order - b.order);
            setSteps(stepsData);
        } catch (error) {
            console.error('Erreur lors de la récupération des étapes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = steps.findIndex((step) => step.id === active.id);
            const newIndex = steps.findIndex((step) => step.id === over?.id);

            const newSteps = arrayMove(steps, oldIndex, newIndex);
            setSteps(newSteps);

            // Mettre à jour l'ordre dans Firebase
            try {
                const updatePromises = newSteps.map((step, index) =>
                    updateDoc(doc(db, 'web-process', step.id), { order: index + 1 }),
                );
                await Promise.all(updatePromises);
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l&apos;ordre:', error);
                fetchSteps(); // Recharger en cas d'erreur
            }
        }
    };

    const onSubmit = async (data: ProcessStepForm) => {
        try {
            if (editingStep) {
                // Modification
                await updateDoc(doc(db, 'web-process', editingStep.id), data);
            } else {
                // Ajout
                const newOrder = steps.length + 1;
                await addDoc(collection(db, 'web-process'), {
                    ...data,
                    order: newOrder,
                });
            }

            reset();
            setEditingStep(null);
            setShowForm(false);
            fetchSteps();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde');
        }
    };

    const handleEdit = (step: ProcessStep) => {
        setEditingStep(step);
        reset({
            number: step.number,
            title: step.title,
            description: step.description,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) {
            try {
                await deleteDoc(doc(db, 'web-process', id));
                fetchSteps();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    const handleCancel = () => {
        reset();
        setEditingStep(null);
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
                <h2 className="text-xl font-semibold">Étapes du Processus</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Ajouter une étape
                </button>
            </div>

            {/* Formulaire */}
            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-4">
                        {editingStep ? 'Modifier l&apos;étape' : 'Nouvelle étape'}
                    </h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Numéro
                            </label>
                            <input
                                type="text"
                                {...register('number', { required: 'Le numéro est requis' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="01, 02, 03..."
                            />
                            {errors.number && (
                                <p className="text-red-500 text-sm mt-1">{errors.number.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Titre
                            </label>
                            <input
                                type="text"
                                {...register('title', { required: 'Le titre est requis' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Titre de l'étape"
                            />
                            {errors.title && (
                                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                {...register('description', {
                                    required: 'La description est requise',
                                })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Description de l'étape"
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
                                {editingStep ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Liste des étapes */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={steps.map((step) => step.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div>
                        {steps.map((step) => (
                            <SortableItem
                                key={step.id}
                                step={step}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {steps.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    Aucune étape configurée. Cliquez sur "Ajouter une étape" pour commencer.
                </div>
            )}
        </div>
    );
}
