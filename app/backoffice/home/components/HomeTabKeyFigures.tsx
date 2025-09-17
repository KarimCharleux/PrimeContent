'use client';

// Imports pour drag and drop
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
import React, { useEffect, useState } from 'react';

import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface KeyFigure {
    id?: string;
    value: number;
    prefix?: string;
    suffix?: string;
    description: string;
    isPercentage?: boolean;
    order: number;
}

// Composant pour les lignes triables
interface SortableRowProps {
    figure: KeyFigure;
    onEdit: (figure: KeyFigure) => void;
    onDelete: (figureId: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ figure, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: figure.id!,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <tr ref={setNodeRef} style={style} className={isDragging ? 'shadow-lg' : ''}>
            <td className="px-3 py-4 whitespace-nowrap text-center w-16">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Glisser pour réorganiser"
                >
                    ☰
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {figure.value}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {figure.description}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {figure.prefix || ''} / {figure.suffix || ''}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {figure.isPercentage ? 'Oui' : 'Non'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={() => onEdit(figure)}
                        className="text-indigo-600 hover:text-indigo-900"
                    >
                        Modifier
                    </button>
                    <button
                        onClick={() => figure.id && onDelete(figure.id)}
                        className="text-red-600 hover:text-red-900"
                    >
                        Supprimer
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default function HomeTabKeyFigures() {
    const [keyFigures, setKeyFigures] = useState<KeyFigure[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [currentFigure, setCurrentFigure] = useState<KeyFigure | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // État du formulaire
    const [formValue, setFormValue] = useState<number>(0);
    const [formPrefix, setFormPrefix] = useState<string>('+');
    const [formSuffix, setFormSuffix] = useState<string>('');
    const [formDescription, setFormDescription] = useState<string>('');
    const [formIsPercentage, setFormIsPercentage] = useState<boolean>(false);
    const [formError, setFormError] = useState<string>('');
    const [formSuccess, setFormSuccess] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Configuration des capteurs pour le drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Fonction pour gérer la fin du drag and drop
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!active || !over || active.id === over.id) {
            return;
        }

        const oldIndex = keyFigures.findIndex((figure) => figure.id === active.id);
        const newIndex = keyFigures.findIndex((figure) => figure.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Réorganiser localement
        const newKeyFigures = arrayMove(keyFigures, oldIndex, newIndex);

        // Mettre à jour les ordres
        const updatedKeyFigures = newKeyFigures.map((figure, index) => ({
            ...figure,
            order: index,
        }));

        setKeyFigures(updatedKeyFigures);

        // Sauvegarder en base de données
        try {
            const updatePromises = updatedKeyFigures.map((figure) => {
                if (figure.id) {
                    return updateDoc(doc(db, 'keyFigures', figure.id), { order: figure.order });
                }
                return Promise.resolve();
            });

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la réorganisation:', error);
            // Rollback en cas d'erreur
            setKeyFigures(keyFigures);
        }
    };

    // Récupérer les chiffres clés depuis Firestore
    useEffect(() => {
        const fetchKeyFigures = async () => {
            try {
                setLoading(true);
                const keyFiguresCollection = collection(db, 'keyFigures');
                const keyFiguresSnapshot = await getDocs(keyFiguresCollection);

                if (!keyFiguresSnapshot.empty) {
                    const fetchedKeyFigures = keyFiguresSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as KeyFigure[];

                    // Trier par ordre
                    fetchedKeyFigures.sort((a, b) => a.order - b.order);
                    setKeyFigures(fetchedKeyFigures);
                } else {
                    setKeyFigures([]);
                }

                setLoading(false);
            } catch (error) {
                console.error('Erreur lors de la récupération des chiffres clés:', error);
                setLoading(false);
            }
        };

        fetchKeyFigures();
    }, []);

    // Réinitialiser le formulaire
    const resetForm = () => {
        setFormValue(0);
        setFormPrefix('+');
        setFormSuffix('');
        setFormDescription('');
        setFormIsPercentage(false);
        setFormError('');
        setFormSuccess('');
        setCurrentFigure(null);
        setIsEditing(false);
    };

    // Afficher le formulaire d'ajout
    const handleAddClick = () => {
        resetForm();
        setIsFormVisible(true);
    };

    // Fermer le formulaire
    const handleCancelClick = () => {
        setIsFormVisible(false);
        resetForm();
    };

    // Modifier un chiffre clé
    const handleEditClick = (figure: KeyFigure) => {
        setCurrentFigure(figure);
        setFormValue(figure.value);
        setFormPrefix(figure.prefix || '+');
        setFormSuffix(figure.suffix || '');
        setFormDescription(figure.description);
        setFormIsPercentage(figure.isPercentage || false);
        setIsFormVisible(true);
        setIsEditing(true);

        // Faire défiler la page jusqu'au formulaire
        setTimeout(() => {
            const formElement = document.querySelector('form');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    // Supprimer un chiffre clé
    const handleDeleteClick = async (figureId: string) => {
        if (!figureId || !window.confirm('Êtes-vous sûr de vouloir supprimer ce chiffre clé ?')) {
            return;
        }

        try {
            setIsSubmitting(true);
            await deleteDoc(doc(db, 'keyFigures', figureId));

            // Mettre à jour la liste
            setKeyFigures((prev) => prev.filter((figure) => figure.id !== figureId));
            setFormSuccess('Chiffre clé supprimé avec succès !');

            setTimeout(() => {
                setFormSuccess('');
            }, 3000);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            setFormError('Erreur lors de la suppression du chiffre clé.');

            setTimeout(() => {
                setFormError('');
            }, 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Soumettre le formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        // Validation
        if (!formDescription.trim()) {
            setFormError('La description est requise');
            return;
        }

        if (formValue < 0) {
            setFormError('La valeur doit être positive');
            return;
        }

        try {
            setIsSubmitting(true);

            const figureData: Omit<KeyFigure, 'id'> = {
                value: formValue,
                prefix: formPrefix,
                suffix: formSuffix,
                description: formDescription,
                isPercentage: formIsPercentage,
                order:
                    isEditing && currentFigure
                        ? currentFigure.order
                        : keyFigures.length > 0
                          ? Math.max(...keyFigures.map((fig) => fig.order)) + 1
                          : 0,
            };

            if (isEditing && currentFigure?.id) {
                // Mise à jour
                const figureRef = doc(db, 'keyFigures', currentFigure.id);
                await updateDoc(figureRef, figureData);

                // Mettre à jour la liste
                setKeyFigures((prev) =>
                    prev.map((fig) =>
                        fig.id === currentFigure.id ? { ...figureData, id: currentFigure.id } : fig,
                    ),
                );

                setFormSuccess('Chiffre clé mis à jour avec succès !');
            } else {
                // Création
                const docRef = await addDoc(collection(db, 'keyFigures'), figureData);

                // Ajouter à la liste
                setKeyFigures((prev) => [...prev, { ...figureData, id: docRef.id }]);

                setFormSuccess('Chiffre clé ajouté avec succès !');
            }

            // Réinitialiser le formulaire après un délai
            setTimeout(() => {
                setIsFormVisible(false);
                resetForm();
            }, 2000);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement:", error);
            setFormError(
                `Erreur lors de ${isEditing ? 'la mise à jour' : "l'ajout"} du chiffre clé.`,
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Chiffres Clés</h2>
                    {!isFormVisible && (
                        <button
                            onClick={handleAddClick}
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
                        >
                            Ajouter un chiffre clé
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                ) : (
                    <>
                        {/* Liste des chiffres clés */}
                        {keyFigures.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16"
                                                    >
                                                        Ordre
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Valeur
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Description
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Préfixe/Suffixe
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Pourcentage
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <SortableContext
                                                items={keyFigures.map((figure) => figure.id!)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {keyFigures.map((figure) => (
                                                        <SortableRow
                                                            key={figure.id}
                                                            figure={figure}
                                                            onEdit={handleEditClick}
                                                            onDelete={handleDeleteClick}
                                                        />
                                                    ))}
                                                </tbody>
                                            </SortableContext>
                                        </table>
                                    </DndContext>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                <p>
                                    Aucun chiffre clé n&apos;a été ajouté. Cliquez sur &quot;Ajouter
                                    un chiffre clé&quot; pour commencer.
                                </p>
                            </div>
                        )}

                        {/* Messages d'erreur ou de succès globaux */}
                        {formError && !isFormVisible && (
                            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                                {formError}
                            </div>
                        )}

                        {formSuccess && !isFormVisible && (
                            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                                {formSuccess}
                            </div>
                        )}

                        {/* Formulaire d'ajout/modification */}
                        {isFormVisible && (
                            <div className="mt-6 border border-gray-200 rounded-md p-4">
                                <h3 className="text-lg font-medium mb-4">
                                    {isEditing
                                        ? 'Modifier le chiffre clé'
                                        : 'Ajouter un nouveau chiffre clé'}
                                </h3>

                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Valeur
                                            </label>
                                            <input
                                                type="number"
                                                value={formValue}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLInputElement>,
                                                ) => setFormValue(parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                value={formDescription}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLInputElement>,
                                                ) => setFormDescription(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Préfixe (optionnel)
                                            </label>
                                            <input
                                                type="text"
                                                value={formPrefix}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLInputElement>,
                                                ) => setFormPrefix(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Suffixe (optionnel)
                                            </label>
                                            <input
                                                type="text"
                                                value={formSuffix}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLInputElement>,
                                                ) => setFormSuffix(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Format de pourcentage
                                            </label>
                                            <select
                                                value={formIsPercentage ? 'true' : 'false'}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLSelectElement>,
                                                ) => setFormIsPercentage(e.target.value === 'true')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="false">Non</option>
                                                <option value="true">Oui</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Messages d'erreur ou de succès */}
                                    {formError && (
                                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                                            {formError}
                                        </div>
                                    )}

                                    {formSuccess && (
                                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                                            {formSuccess}
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleCancelClick}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            Annuler
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors disabled:opacity-50 mt-6"
                                        >
                                            {isSubmitting ? (
                                                <Spinner small white />
                                            ) : isEditing ? (
                                                'Mettre à jour'
                                            ) : (
                                                'Ajouter'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
