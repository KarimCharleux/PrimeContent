'use client';

import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useForm } from 'react-hook-form';

import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface ProcessStep {
    id?: string;
    number: string;
    title: string;
    description: string;
    order: number;
}

interface ProcessTabProps {
    onStatusChange: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function ProcessTab({ onStatusChange }: ProcessTabProps) {
    const [steps, setSteps] = useState<ProcessStep[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<ProcessStep>();

    // Récupérer les étapes depuis Firebase
    useEffect(() => {
        const fetchSteps = async () => {
            try {
                const stepsCollection = collection(db, 'reseaux-sociaux-process');
                const stepsSnapshot = await getDocs(stepsCollection);

                if (!stepsSnapshot.empty) {
                    const stepsData = stepsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as ProcessStep[];

                    // Trier par ordre
                    stepsData.sort((a, b) => a.order - b.order);
                    setSteps(stepsData);
                } else {
                    // Données par défaut
                    const defaultSteps: ProcessStep[] = [
                        {
                            number: '01',
                            title: 'Découverte',
                            description:
                                'Nous nous rencontrons avec vous pour mieux connaître votre entreprise, vos objectifs et votre public cible.',
                            order: 1,
                        },
                        {
                            number: '02',
                            title: 'Stratégie',
                            description:
                                'Nous élaborons une stratégie marketing sur mesure, adaptée à vos besoins et objectifs uniques.',
                            order: 2,
                        },
                        {
                            number: '03',
                            title: 'Exécution',
                            description:
                                'Nous mettons en œuvre notre stratégie en utilisant les outils et techniques de marketing digital les plus modernes.',
                            order: 3,
                        },
                        {
                            number: '04',
                            title: 'Tracking & Suivi',
                            description:
                                'Nous suivons les résultats de nos campagnes afin de pouvoir apporter des ajustements si nécessaire.',
                            order: 4,
                        },
                    ];

                    // Créer les étapes par défaut
                    for (const step of defaultSteps) {
                        const stepsCollection = collection(db, 'reseaux-sociaux-process');
                        await addDoc(stepsCollection, step);
                    }

                    setSteps(defaultSteps);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des étapes:', error);
                onStatusChange({
                    type: 'error',
                    message: 'Erreur lors de la récupération des étapes',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSteps();
    }, [onStatusChange]);

    // Gérer le drag and drop
    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(steps);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Mettre à jour l'ordre
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index + 1,
        }));

        setSteps(updatedItems);

        // Sauvegarder l'ordre dans Firebase
        try {
            for (const item of updatedItems) {
                if (item.id) {
                    const stepRef = doc(db, 'reseaux-sociaux-process', item.id);
                    await updateDoc(stepRef, { order: item.order });
                }
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'ordre:", error);
        }
    };

    // Ouvrir le formulaire d'édition
    const handleEdit = (step: ProcessStep) => {
        setEditingStep(step);
        setValue('number', step.number);
        setValue('title', step.title);
        setValue('description', step.description);
        setShowAddForm(false);
    };

    // Ouvrir le formulaire d'ajout
    const handleAdd = () => {
        setEditingStep(null);
        reset();
        setValue('number', String(steps.length + 1).padStart(2, '0'));
        setValue('order', steps.length + 1);
        setShowAddForm(true);
    };

    // Sauvegarder une étape
    const onSubmit = async (data: ProcessStep) => {
        try {
            setSaving(true);

            if (editingStep?.id) {
                // Mettre à jour l'étape existante
                const stepRef = doc(db, 'reseaux-sociaux-process', editingStep.id);
                await updateDoc(stepRef, data);

                setSteps(
                    steps.map((step) => (step.id === editingStep.id ? { ...step, ...data } : step)),
                );
            } else {
                // Créer une nouvelle étape
                const stepData = {
                    ...data,
                    order: steps.length + 1,
                };

                const stepsCollection = collection(db, 'reseaux-sociaux-process');
                const docRef = await addDoc(stepsCollection, stepData);

                setSteps([...steps, { ...stepData, id: docRef.id }]);
            }

            onStatusChange({
                type: 'success',
                message: 'Étape sauvegardée avec succès',
            });

            setEditingStep(null);
            setShowAddForm(false);
            reset();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            onStatusChange({
                type: 'error',
                message: "Erreur lors de la sauvegarde de l'étape",
            });
        } finally {
            setSaving(false);
        }
    };

    // Supprimer une étape
    const handleDelete = async (step: ProcessStep) => {
        if (!step.id || !confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) return;

        try {
            await deleteDoc(doc(db, 'reseaux-sociaux-process', step.id));
            setSteps(steps.filter((s) => s.id !== step.id));

            onStatusChange({
                type: 'success',
                message: 'Étape supprimée avec succès',
            });
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            onStatusChange({
                type: 'error',
                message: "Erreur lors de la suppression de l'étape",
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
                <h2 className="text-lg font-medium text-gray-900">Étapes du Processus</h2>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Ajouter une étape
                </button>
            </div>

            {/* Formulaire d'ajout/édition */}
            {(showAddForm || editingStep) && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingStep ? "Modifier l'étape" : 'Ajouter une étape'}
                    </h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="number"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Numéro
                                </label>
                                <input
                                    type="text"
                                    id="number"
                                    {...register('number', { required: 'Le numéro est requis' })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="01"
                                />
                                {errors.number && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.number.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="title"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Titre
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    {...register('title', { required: 'Le titre est requis' })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Découverte"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.title.message}
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
                            <textarea
                                id="description"
                                rows={3}
                                {...register('description', {
                                    required: 'La description est requise',
                                })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Description de l'étape..."
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingStep(null);
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

            {/* Liste des étapes */}
            <div className="bg-white shadow rounded-lg p-6">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="steps">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-4"
                            >
                                {steps.map((step, index) => (
                                    <Draggable
                                        key={step.id || index}
                                        draggableId={step.id || String(index)}
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`border rounded-lg p-4 ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'}`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-4 flex-1">
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
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-3 mb-2">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                                                                    {step.number}
                                                                </span>
                                                                <h3 className="text-lg font-medium text-gray-900">
                                                                    {step.title}
                                                                </h3>
                                                            </div>
                                                            <p className="text-gray-600 text-sm">
                                                                {step.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2 ml-4">
                                                        <button
                                                            onClick={() => handleEdit(step)}
                                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                        >
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(step)}
                                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                        >
                                                            Supprimer
                                                        </button>
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
