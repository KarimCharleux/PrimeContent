'use client';

import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';

interface ContentData {
    id?: string;
    title: string;
    description: string;
    processImage: string;
    processImageAlt: string;
}

interface ContentTabProps {
    onStatusChange: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function ContentTab({ onStatusChange }: ContentTabProps) {
    const [content, setContent] = useState<ContentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ContentData>();

    // Récupérer le contenu depuis Firebase
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const contentCollection = collection(db, 'reseaux-sociaux-content');
                const contentSnapshot = await getDocs(contentCollection);

                if (!contentSnapshot.empty) {
                    const contentDoc = contentSnapshot.docs[0];
                    const contentData = { id: contentDoc.id, ...contentDoc.data() } as ContentData;
                    setContent(contentData);

                    // Remplir le formulaire
                    setValue('title', contentData.title);
                    setValue('description', contentData.description);
                    setValue('processImageAlt', contentData.processImageAlt);
                } else {
                    // Valeurs par défaut
                    const defaultContent: ContentData = {
                        title: 'GESTION DES RÉSEAUX SOCIAUX',
                        description:
                            'Nous développons votre présence digitale avec des stratégies sur mesure, du contenu engageant et une gestion complète de vos réseaux sociaux.',
                        processImage: '',
                        processImageAlt: 'Équipe en réunion stratégique',
                    };
                    setContent(defaultContent);
                    setValue('title', defaultContent.title);
                    setValue('description', defaultContent.description);
                    setValue('processImageAlt', defaultContent.processImageAlt);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération du contenu:', error);
                onStatusChange({
                    type: 'error',
                    message: 'Erreur lors de la récupération du contenu',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [setValue, onStatusChange]);

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

    // Sauvegarder le contenu
    const onSubmit = async (data: ContentData) => {
        try {
            setSaving(true);
            let processImageUrl = content?.processImage || '';

            // Upload de l'image si une nouvelle image est sélectionnée
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                formData.append('path', 'reseaux-sociaux');
                formData.append('useUuid', 'true');

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de l&apos;upload de l&apos;image');
                }

                const uploadData = await response.json();
                processImageUrl = uploadData.fileUrl;
            }

            const contentData: ContentData = {
                ...data,
                processImage: processImageUrl,
            };

            if (content?.id) {
                // Mettre à jour le document existant
                const contentRef = doc(db, 'reseaux-sociaux-content', content.id);
                await updateDoc(contentRef, contentData);
            } else {
                // Créer un nouveau document
                const contentCollection = collection(db, 'reseaux-sociaux-content');
                const docRef = await addDoc(contentCollection, contentData);
                setContent({ ...contentData, id: docRef.id });
            }

            onStatusChange({
                type: 'success',
                message: 'Contenu sauvegardé avec succès',
            });

            // Réinitialiser les états
            setImageFile(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            onStatusChange({
                type: 'error',
                message: 'Erreur lors de la sauvegarde du contenu',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Contenu Principal</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Titre */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Titre de la page
                        </label>
                        <input
                            type="text"
                            id="title"
                            {...register('title', { required: 'Le titre est requis' })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="GESTION DES RÉSEAUX SOCIAUX"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            {...register('description', { required: 'La description est requise' })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Nous développons votre présence digitale..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* Image du processus */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image du processus
                        </label>

                        {/* Image actuelle */}
                        {(content?.processImage || imagePreview) && (
                            <div className="mb-4">
                                <Image
                                    src={imagePreview || getMediaUrl(content?.processImage || '')}
                                    alt={content?.processImageAlt || 'Image du processus'}
                                    width={400}
                                    height={300}
                                    className="rounded-lg object-cover"
                                />
                            </div>
                        )}

                        {/* Input pour nouvelle image */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Formats acceptés: JPG, PNG, GIF, WebP (max 10MB)
                        </p>
                    </div>

                    {/* Alt text de l'image */}
                    <div>
                        <label
                            htmlFor="processImageAlt"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Texte alternatif de l&apos;image
                        </label>
                        <input
                            type="text"
                            id="processImageAlt"
                            {...register('processImageAlt', {
                                required: 'Le texte alternatif est requis',
                            })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Équipe en réunion stratégique"
                        />
                        {errors.processImageAlt && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.processImageAlt.message}
                            </p>
                        )}
                    </div>

                    {/* Bouton de sauvegarde */}
                    <div className="flex justify-end">
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
        </div>
    );
}
