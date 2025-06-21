'use client';

import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { db } from '../../lib/firebase-client';

interface ContentData {
    id?: string;
    title: string;
    description: string;
    processImage: string;
    processImageAlt: string;
}

export default function ContentTab() {
    const [content, setContent] = useState<ContentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ContentData>();

    const watchedProcessImage = watch('processImage');

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const contentCollection = collection(db, 'web-content');
            const contentSnapshot = await getDocs(contentCollection);

            if (!contentSnapshot.empty) {
                const contentDoc = contentSnapshot.docs[0];
                const contentData = { id: contentDoc.id, ...contentDoc.data() } as ContentData;
                setContent(contentData);

                // Remplir le formulaire avec les données existantes
                setValue('title', contentData.title);
                setValue('description', contentData.description);
                setValue('processImage', contentData.processImage);
                setValue('processImageAlt', contentData.processImageAlt);
            } else {
                // Valeurs par défaut
                const defaultContent = {
                    title: 'CONCEPTION INTERFACES MOBILE/WEB',
                    description:
                        'Nous créons des interfaces utilisateur modernes et intuitives pour vos applications mobiles et web, en mettant l&apos;accent sur l&apos;expérience utilisateur et le design responsive.',
                    processImage: '/home/projects/GROUP PHOTO - CELEBRITES - Â© bastian huber.jpg',
                    processImageAlt: 'Équipe travaillant sur des interfaces',
                };

                setValue('title', defaultContent.title);
                setValue('description', defaultContent.description);
                setValue('processImage', defaultContent.processImage);
                setValue('processImageAlt', defaultContent.processImageAlt);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du contenu:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setValue('processImage', data.path);
            } else {
                alert('Erreur lors de l&apos;upload de l&apos;image');
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            alert('Erreur lors de l&apos;upload de l&apos;image');
        } finally {
            setUploadingImage(false);
        }
    };

    const onSubmit = async (data: ContentData) => {
        setUploading(true);
        try {
            if (content?.id) {
                // Mise à jour
                const docRef = doc(db, 'web-content', content.id);
                await updateDoc(docRef, data);
            } else {
                // Création
                await addDoc(collection(db, 'web-content'), data);
            }

            alert('Contenu sauvegardé avec succès !');
            fetchContent();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setUploading(false);
        }
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
            <h2 className="text-xl font-semibold mb-6">Contenu Principal</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Titre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre de la page
                    </label>
                    <input
                        type="text"
                        {...register('title', { required: 'Le titre est requis' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Titre de la page"
                    />
                    {errors.title && (
                        <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        {...register('description', { required: 'La description est requise' })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description de la page"
                    />
                    {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                </div>

                {/* Image du processus */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image du processus
                    </label>

                    {watchedProcessImage && (
                        <div className="mb-4">
                            <Image
                                src={getMediaUrl(watchedProcessImage)}
                                alt="Aperçu de l'image du processus"
                                width={300}
                                height={200}
                                className="rounded-lg object-cover"
                            />
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {uploadingImage && (
                        <p className="text-blue-500 text-sm mt-1">Upload en cours...</p>
                    )}
                </div>

                {/* Alt text de l'image */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texte alternatif de l&apos;image
                    </label>
                    <input
                        type="text"
                        {...register('processImageAlt', {
                            required: 'Le texte alternatif est requis',
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description de l'image pour l'accessibilité"
                    />
                    {errors.processImageAlt && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.processImageAlt.message}
                        </p>
                    )}
                </div>

                {/* Bouton de sauvegarde */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={uploading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>
            </form>
        </div>
    );
}
