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
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { uploadFileWithUUID } from '../../../utils/uploadUtils';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';
import { type Couple } from '../../models/types';
import CoupleMediaManager from '../media/components/CoupleMediaManager';
import CoupleVideosManager from '../media/components/CoupleVideosManager';

type DetailTab = 'infos' | 'media' | 'videos';

// Carte de couple triable (vue liste)
function SortableCoupleCard({
    couple,
    onSelect,
    onDelete,
}: {
    couple: Couple;
    onSelect: (couple: Couple) => void;
    onDelete: (couple: Couple) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: couple.id!,
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
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-medium text-gray-900">
                            {couple.person1Name} & {couple.person2Name}
                        </h4>
                        {couple.password && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                                Protégé
                            </span>
                        )}
                    </div>
                    <button
                        {...attributes}
                        {...listeners}
                        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing text-lg"
                        title="Glisser pour réorganiser"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 8h16M4 16h16"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex items-center justify-center mb-4 space-x-4">
                    <div className="flex flex-col items-center">
                        <div className="relative w-16 h-16 mb-2">
                            <Image
                                src={getMediaUrl(couple.person1Image)}
                                alt={couple.person1Name}
                                fill
                                className="object-cover rounded-full"
                            />
                        </div>
                        <p className="text-sm text-gray-600">{couple.person1Name}</p>
                    </div>
                    <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                    <div className="flex flex-col items-center">
                        <div className="relative w-16 h-16 mb-2">
                            <Image
                                src={getMediaUrl(couple.person2Image)}
                                alt={couple.person2Name}
                                fill
                                className="object-cover rounded-full"
                            />
                        </div>
                        <p className="text-sm text-gray-600">{couple.person2Name}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onSelect(couple)}
                        className="flex-1 px-3 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors text-sm font-medium"
                    >
                        <span className="inline-flex items-center gap-1.5">
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
                            Modifier
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(couple)}
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

export default function MariagesTab() {
    const [couples, setCouples] = useState<Couple[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mdpGenere, setMdpGenere] = useState<string | null>(null);

    // null = vue liste, Couple = vue détail
    const [selectedCouple, setSelectedCouple] = useState<Couple | null>(null);
    const [detailTab, setDetailTab] = useState<DetailTab>('infos');

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [previewPerson1Image, setPreviewPerson1Image] = useState<string | null>(null);
    const [previewPerson2Image, setPreviewPerson2Image] = useState<string | null>(null);

    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<Couple>();

    useEffect(() => {
        const fetchCouples = async () => {
            try {
                setLoading(true);
                const snapshot = await getDocs(collection(db, 'couples'));
                const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Couple[];
                setCouples(fetched.sort((a, b) => (a.order || 0) - (b.order || 0)));
            } catch {
                setStatusMessage({ type: 'error', message: 'Impossible de charger les couples' });
                setCouples([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCouples();
    }, []);

    const handleSelectCouple = (couple: Couple) => {
        setSelectedCouple(couple);
        setDetailTab('infos');
        reset(couple);
        setPreviewPerson1Image(couple.person1Image);
        setPreviewPerson2Image(couple.person2Image);
        setShowPassword(false);
        setStatusMessage(null);
    };

    const handleBackToList = () => {
        setSelectedCouple(null);
        setShowCreateForm(false);
        reset({
            person1Name: '',
            person2Name: '',
            person1Image: '',
            person2Image: '',
            password: '',
        });
        setPreviewPerson1Image(null);
        setPreviewPerson2Image(null);
        setStatusMessage(null);
    };

    const deleteMediaFile = async (fileUrl: string) => {
        if (!fileUrl) return;
        try {
            const fileName = fileUrl.split('/').pop();
            const filePath = fileUrl.substring(1, fileUrl.lastIndexOf('/'));
            if (fileName) {
                await fetch(
                    `/api/delete?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`,
                    { method: 'DELETE' },
                );
            }
        } catch {
            // silencieux
        }
    };

    const genererMotDePasse = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let mdp = '';
        for (let i = 0; i < 8; i++) {
            mdp += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setMdpGenere(mdp);
        setValue('password', mdp);
    };

    const handlePerson1ImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setPreviewPerson1Image(URL.createObjectURL(file));
            if (selectedCouple?.id && selectedCouple.person1Image)
                await deleteMediaFile(selectedCouple.person1Image);
            const result = await uploadFileWithUUID(file, 'mariages', (msg) =>
                setStatusMessage({ type: 'success', message: msg }),
            );
            setValue('person1Image', result.fileUrl, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
        } catch {
            setStatusMessage({
                type: 'error',
                message: "Erreur lors du téléchargement de l'image",
            });
        }
    };

    const handlePerson2ImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setPreviewPerson2Image(URL.createObjectURL(file));
            if (selectedCouple?.id && selectedCouple.person2Image)
                await deleteMediaFile(selectedCouple.person2Image);
            const result = await uploadFileWithUUID(file, 'mariages', (msg) =>
                setStatusMessage({ type: 'success', message: msg }),
            );
            setValue('person2Image', result.fileUrl, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
        } catch {
            setStatusMessage({
                type: 'error',
                message: "Erreur lors du téléchargement de l'image",
            });
        }
    };

    const onSubmit = async (data: Couple) => {
        setSaving(true);
        try {
            if (selectedCouple?.id) {
                await updateDoc(doc(db, 'couples', selectedCouple.id), {
                    person1Name: data.person1Name,
                    person2Name: data.person2Name,
                    person1Image: data.person1Image,
                    person2Image: data.person2Image,
                    coupleDisplayName: `${data.person1Name} & ${data.person2Name}`,
                    order: selectedCouple.order || 0,
                    password: data.password || '',
                    updatedAt: new Date(),
                });
                const updated: Couple = {
                    ...data,
                    id: selectedCouple.id,
                    order: selectedCouple.order,
                    coupleDisplayName: `${data.person1Name} & ${data.person2Name}`,
                };
                setCouples((prev) => prev.map((c) => (c.id === selectedCouple.id ? updated : c)));
                setSelectedCouple(updated);
                setStatusMessage({ type: 'success', message: 'Couple mis à jour avec succès' });
            } else {
                const maxOrder =
                    couples.length > 0 ? Math.max(...couples.map((c) => c.order || 0)) + 1 : 0;
                const docRef = await addDoc(collection(db, 'couples'), {
                    person1Name: data.person1Name,
                    person2Name: data.person2Name,
                    person1Image: data.person1Image,
                    person2Image: data.person2Image,
                    coupleDisplayName: `${data.person1Name} & ${data.person2Name}`,
                    order: maxOrder,
                    password: data.password || '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                setCouples((prev) => [
                    ...prev,
                    {
                        ...data,
                        id: docRef.id,
                        order: maxOrder,
                        coupleDisplayName: `${data.person1Name} & ${data.person2Name}`,
                    },
                ]);
                setStatusMessage({ type: 'success', message: 'Nouveau couple ajouté avec succès' });
                setShowCreateForm(false);
                reset({
                    person1Name: '',
                    person2Name: '',
                    person1Image: '',
                    person2Image: '',
                    password: '',
                });
                setPreviewPerson1Image(null);
                setPreviewPerson2Image(null);
            }
        } catch {
            setStatusMessage({ type: 'error', message: 'Erreur lors de la sauvegarde' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (couple: Couple) => {
        if (!couple.id) return;
        if (
            !window.confirm(
                `Êtes-vous sûr de vouloir supprimer le couple "${couple.person1Name} & ${couple.person2Name}" ?`,
            )
        )
            return;
        try {
            await deleteDoc(doc(db, 'couples', couple.id));
            if (couple.person1Image) await deleteMediaFile(couple.person1Image);
            if (couple.person2Image) await deleteMediaFile(couple.person2Image);
            setCouples((prev) => prev.filter((c) => c.id !== couple.id));
            if (selectedCouple?.id === couple.id) handleBackToList();
            setStatusMessage({ type: 'success', message: 'Couple supprimé avec succès' });
        } catch {
            setStatusMessage({ type: 'error', message: 'Erreur lors de la suppression' });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = couples.findIndex((c) => c.id === active.id);
        const newIndex = couples.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const newCouples = arrayMove(couples, oldIndex, newIndex).map((c, idx) => ({
            ...c,
            order: idx,
        }));
        setCouples(newCouples);
        try {
            await Promise.all(
                newCouples.map((c) => updateDoc(doc(db, 'couples', c.id!), { order: c.order })),
            );
        } catch {
            setStatusMessage({ type: 'error', message: 'Erreur lors de la réorganisation' });
        }
    };

    // ── Formulaire partagé création / édition ──────────────────────────────────
    const renderForm = (isEditing: boolean) => (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personne 1 */}
                <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4">Personne 1</h4>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prénom
                        </label>
                        <input
                            type="text"
                            {...register('person1Name', { required: 'Le prénom est requis' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {errors.person1Name && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.person1Name.message}
                            </p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo de profil
                        </label>
                        <input
                            type="text"
                            {...register('person1Image', { required: true })}
                            className="hidden"
                        />
                        <label className="w-full px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300 text-center border border-gray-300 block">
                            {previewPerson1Image ? 'Changer la photo' : 'Choisir une photo'}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handlePerson1ImageUpload}
                            />
                        </label>
                        {errors.person1Image && (
                            <p className="mt-1 text-sm text-red-600">Une photo est requise</p>
                        )}
                    </div>
                    <div className="h-40 flex items-center justify-center bg-gray-100 rounded-md">
                        {previewPerson1Image ? (
                            <div className="relative h-32 w-32">
                                <Image
                                    src={getMediaUrl(previewPerson1Image)}
                                    alt="Prévisualisation"
                                    fill
                                    className="object-cover rounded-full"
                                />
                            </div>
                        ) : (
                            <p className="text-gray-400">Aucune image</p>
                        )}
                    </div>
                </div>

                {/* Personne 2 */}
                <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4">Personne 2</h4>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prénom
                        </label>
                        <input
                            type="text"
                            {...register('person2Name', { required: 'Le prénom est requis' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {errors.person2Name && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.person2Name.message}
                            </p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo de profil
                        </label>
                        <input
                            type="text"
                            {...register('person2Image', { required: true })}
                            className="hidden"
                        />
                        <label className="w-full px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300 text-center border border-gray-300 block">
                            {previewPerson2Image ? 'Changer la photo' : 'Choisir une photo'}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handlePerson2ImageUpload}
                            />
                        </label>
                        {errors.person2Image && (
                            <p className="mt-1 text-sm text-red-600">Une photo est requise</p>
                        )}
                    </div>
                    <div className="h-40 flex items-center justify-center bg-gray-100 rounded-md">
                        {previewPerson2Image ? (
                            <div className="relative h-32 w-32">
                                <Image
                                    src={getMediaUrl(previewPerson2Image)}
                                    alt="Prévisualisation"
                                    fill
                                    className="object-cover rounded-full"
                                />
                            </div>
                        ) : (
                            <p className="text-gray-400">Aucune image</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Mot de passe optionnel */}
            <div className="p-6 border rounded-lg">
                <h4 className="text-md font-medium mb-4">
                    Protection par mot de passe{' '}
                    <span className="text-sm font-normal text-gray-500">(optionnel)</span>
                </h4>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            {...register('password')}
                            placeholder="Laisser vide = accès libre"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                            type="button"
                            onClick={genererMotDePasse}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Générer
                        </button>
                    </div>
                </div>

                {mdpGenere && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-yellow-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Mot de passe généré : <strong>{mdpGenere}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 p-4 rounded-md">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Comment ça marche ?</h5>
                    <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                        <li>
                            L&apos;accès aux photos de ce couple nécessitera la saisie du mot de
                            passe
                        </li>
                        <li>Partagez le mot de passe uniquement avec les personnes autorisées</li>
                        <li>Laisser le champ vide pour un accès libre sans protection</li>
                    </ul>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => {
                            setShowCreateForm(false);
                            reset({
                                person1Name: '',
                                person2Name: '',
                                person1Image: '',
                                person2Image: '',
                                password: '',
                            });
                            setPreviewPerson1Image(null);
                            setPreviewPerson2Image(null);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Annuler
                    </button>
                )}
                <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors disabled:opacity-50"
                >
                    {saving ? <Spinner small white /> : isEditing ? 'Mettre à jour' : 'Ajouter'}
                </button>
            </div>
        </form>
    );

    // ── VUE DÉTAIL ─────────────────────────────────────────────────────────────
    if (selectedCouple) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            type="button"
                            onClick={handleBackToList}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
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
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Retour
                        </button>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {selectedCouple.person1Name} & {selectedCouple.person2Name}
                            </h3>
                            {selectedCouple.password && (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                    <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                    Protégé
                                </span>
                            )}
                        </div>
                    </div>

                    {statusMessage && (
                        <div
                            className={`p-4 mb-6 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                        >
                            {statusMessage.message}
                        </div>
                    )}

                    {/* Onglets */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-6">
                            {(
                                [
                                    {
                                        key: 'infos',
                                        label: 'Informations',
                                        icon: (
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
                                        ),
                                    },
                                    {
                                        key: 'media',
                                        label: 'Photos & Vidéos',
                                        icon: (
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
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        ),
                                    },
                                    {
                                        key: 'videos',
                                        label: 'YouTube & Dailymotion',
                                        icon: (
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
                                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        ),
                                    },
                                ] as { key: DetailTab; label: string; icon: React.ReactNode }[]
                            ).map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setDetailTab(tab.key)}
                                    className={`inline-flex items-center gap-1.5 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                        detailTab === tab.key
                                            ? 'border-black text-black'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Contenu */}
                    {detailTab === 'infos' && renderForm(true)}
                    {detailTab === 'media' && (
                        <CoupleMediaManager
                            coupleId={selectedCouple.id!}
                            coupleName={`${selectedCouple.person1Name} & ${selectedCouple.person2Name}`}
                            onStatusChange={setStatusMessage}
                        />
                    )}
                    {detailTab === 'videos' && (
                        <CoupleVideosManager
                            coupleId={selectedCouple.id!}
                            coupleName={`${selectedCouple.person1Name} & ${selectedCouple.person2Name}`}
                            onStatusChange={setStatusMessage}
                        />
                    )}
                </div>
            </div>
        );
    }

    // ── VUE LISTE ──────────────────────────────────────────────────────────────
    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                {statusMessage && (
                    <div
                        className={`p-4 mb-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                    >
                        {statusMessage.message}
                    </div>
                )}

                {/* Formulaire de création */}
                {showCreateForm && (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-6">
                            Ajouter un nouveau couple
                        </h3>
                        {renderForm(false)}
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        Couples existants ({couples.length})
                    </h3>
                    {!showCreateForm && (
                        <button
                            onClick={() => {
                                reset({
                                    person1Name: '',
                                    person2Name: '',
                                    person1Image: '',
                                    person2Image: '',
                                    password: '',
                                });
                                setPreviewPerson1Image(null);
                                setPreviewPerson2Image(null);
                                setShowCreateForm(true);
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
                            <span>Nouveau couple</span>
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Spinner />
                    </div>
                ) : couples.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun couple</h3>
                        <p className="text-gray-500">Commencez par ajouter votre premier couple</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={couples.map((c) => c.id!)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {couples.map((couple) => (
                                    <SortableCoupleCard
                                        key={couple.id}
                                        couple={couple}
                                        onSelect={handleSelectCouple}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
