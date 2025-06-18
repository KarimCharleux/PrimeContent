'use client';

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    addDoc,
    Timestamp,
} from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';

import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';
import { Evenement, EventFilter, EventStats } from '../../models/eventTypes';

import EventForm from './EventForm';
import EventList from './EventList';

interface EvenementsTabProps {
    onStatusChange?: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function EvenementsTab({ onStatusChange }: EvenementsTabProps) {
    const [evenements, setEvenements] = useState<Evenement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Evenement | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [stats, setStats] = useState<EventStats>({
        totalEvents: 0,
        totalImages: 0,
        totalProtected: 0,
        totalVisible: 0,
        byType: {
            visionner: 0,
            selection: 0,
            paye: 0,
            non_paye: 0,
        },
    });

    const [filter, setFilter] = useState<EventFilter>({});
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<Partial<Evenement>>({
        titre: '',
        categorie: '',
        imageSrc: '',
        date: '',
        lieu: '',
        type: 'visionner',
        visible: true,
        dossierImages: '',
        images: [],
    });

    // Calculer les statistiques
    const calculateStats = useCallback(() => {
        const stats: EventStats = {
            totalEvents: evenements.length,
            totalImages: 0,
            totalProtected: 0,
            totalVisible: 0,
            byType: {
                visionner: 0,
                selection: 0,
                paye: 0,
                non_paye: 0,
            },
        };

        evenements.forEach((event) => {
            // Compter les images
            stats.totalImages += event.images.length;

            // Compter les événements protégés
            if (event.protectionMotDePasse?.actif) {
                stats.totalProtected++;
            }

            // Compter les événements visibles
            if (event.visible) {
                stats.totalVisible++;
            }

            // Compter par type
            stats.byType[event.type]++;
        });

        setStats(stats);
    }, [evenements]);

    // Récupérer les événements depuis Firestore
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const eventsCollection = collection(db, 'evenements');
            let eventsQuery = query(eventsCollection, orderBy('date', 'desc'));

            const eventsSnapshot = await getDocs(eventsQuery);

            if (!eventsSnapshot.empty) {
                const fetchedEvents = eventsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Evenement[];

                // Filtrer par terme de recherche si présent
                const filteredEvents = filter.searchTerm
                    ? fetchedEvents.filter(
                          (event) =>
                              event.titre
                                  .toLowerCase()
                                  .includes(filter.searchTerm?.toLowerCase() || '') ||
                              event.categorie
                                  ?.toLowerCase()
                                  .includes(filter.searchTerm?.toLowerCase() || '') ||
                              event.lieu
                                  ?.toLowerCase()
                                  .includes(filter.searchTerm?.toLowerCase() || ''),
                      )
                    : fetchedEvents;

                setEvenements(filteredEvents);
            } else {
                setEvenements([]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des événements:', error);
            setStatusMessage({
                type: 'error',
                message: 'Erreur lors de la récupération des événements',
            });
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        if (evenements.length > 0) {
            calculateStats();
        }
    }, [evenements, calculateStats]);

    useEffect(() => {
        onStatusChange && onStatusChange(statusMessage);
    }, [statusMessage, onStatusChange]);

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);
            setFormData((prev) => ({
                ...prev,
                _tempImagePreview: objectUrl,
            }));
        }
    };

    // Fonction utilitaire pour filtrer les champs undefined
    const removeUndefinedFields = (obj: Record<string, any>): Record<string, any> => {
        return Object.entries(obj)
            .filter(([_, value]) => value !== undefined)
            .reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: value,
                }),
                {},
            );
    };

    const handleSubmit = async (e: React.FormEvent, eventData: Partial<Evenement>) => {
        e.preventDefault();
        try {
            setUploading(true);
            let imageSrcUrl = eventData.imageSrc;

            // Upload de l'image principale si un nouveau fichier est sélectionné
            if (imageFile) {
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                imageFormData.append('path', 'evenements/covers');
                imageFormData.append('useUuid', 'true');

                const imageResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: imageFormData,
                });

                if (!imageResponse.ok) {
                    throw new Error("Erreur lors de l'upload de l'image");
                }

                const imageData = await imageResponse.json();
                imageSrcUrl = imageData.fileUrl;
            }

            const currentTime = Timestamp.now();

            // Nettoyer les données avant envoi à Firestore (supprimer les undefined)
            const cleanedData = removeUndefinedFields(eventData);

            if (editingEvent?.id) {
                // Mise à jour d'un événement existant
                const eventRef = doc(db, 'evenements', editingEvent.id);
                await updateDoc(eventRef, {
                    ...cleanedData,
                    imageSrc: imageSrcUrl,
                    updatedAt: currentTime,
                });
                setStatusMessage({
                    type: 'success',
                    message: 'Événement mis à jour avec succès',
                });
            } else {
                // Création d'un nouvel événement
                await addDoc(collection(db, 'evenements'), {
                    ...cleanedData,
                    imageSrc: imageSrcUrl,
                    createdAt: currentTime,
                    updatedAt: currentTime,
                    images: [],
                });
                setStatusMessage({
                    type: 'success',
                    message: 'Nouvel événement créé avec succès',
                });
            }

            resetForm();
            fetchEvents();
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de l'événement:", error);
            setStatusMessage({
                type: 'error',
                message: "Erreur lors de la sauvegarde de l'événement",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (event: Evenement) => {
        setEditingEvent(event);
        setFormData(event);
        setPreviewImage(event.imageSrc);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        const eventToDelete = evenements.find((e) => e.id === id);
        if (!eventToDelete) return;

        if (
            window.confirm(
                'Êtes-vous sûr de vouloir supprimer cet événement ? Tous les médias associés seront également supprimés.',
            )
        ) {
            try {
                setStatusMessage({
                    type: 'success',
                    message: 'Suppression en cours...',
                });

                // 1. Supprimer tous les médias de l'événement
                if (eventToDelete.images && eventToDelete.images.length > 0) {
                    // Supprimer les fichiers du stockage
                    for (const image of eventToDelete.images) {
                        try {
                            // Supprimer l'image principale
                            if (image.path) {
                                // Extraire le nom du fichier de l'URL
                                const fileName = image.path.split('/').pop();
                                if (fileName) {
                                    const response = await fetch(
                                        `/api/delete?path=evenements/${id}&name=${encodeURIComponent(fileName)}`,
                                        {
                                            method: 'DELETE',
                                        },
                                    );
                                    if (!response.ok) {
                                        console.warn(
                                            `Erreur lors de la suppression du fichier ${fileName}`,
                                        );
                                    }
                                }
                            }

                            // Supprimer la miniature si elle existe
                            if (image.thumbnail) {
                                const thumbnailName = image.thumbnail.split('/').pop();
                                if (thumbnailName) {
                                    const response = await fetch(
                                        `/api/delete?path=evenements/${id}/thumbnails&name=${encodeURIComponent(thumbnailName)}`,
                                        {
                                            method: 'DELETE',
                                        },
                                    );
                                    if (!response.ok) {
                                        console.warn(
                                            `Erreur lors de la suppression de la miniature ${thumbnailName}`,
                                        );
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("Erreur lors de la suppression d'un fichier:", err);
                        }
                    }
                }

                // 2. Supprimer l'image principale de l'événement (affiche)
                if (eventToDelete.imageSrc) {
                    try {
                        const imageName = eventToDelete.imageSrc.split('/').pop();
                        if (imageName) {
                            const response = await fetch(
                                `/api/delete?path=evenements/covers&name=${encodeURIComponent(imageName)}`,
                                {
                                    method: 'DELETE',
                                },
                            );
                            if (!response.ok) {
                                console.warn(
                                    `Erreur lors de la suppression de l'image principale ${imageName}`,
                                );
                            }
                        }
                    } catch (err) {
                        console.error("Erreur lors de la suppression de l'image principale:", err);
                    }
                }

                // 3. Supprimer le document de Firestore
                await deleteDoc(doc(db, 'evenements', id));

                setStatusMessage({
                    type: 'success',
                    message: 'Événement et tous ses médias supprimés avec succès',
                });

                // Fermer le formulaire si l'événement supprimé était en cours d'édition
                if (editingEvent?.id === id) {
                    resetForm();
                }

                fetchEvents();
            } catch (error) {
                console.error("Erreur lors de la suppression de l'événement:", error);
                setStatusMessage({
                    type: 'error',
                    message: "Erreur lors de la suppression de l'événement",
                });
            }
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingEvent(null);
        setFormData({
            titre: '',
            categorie: '',
            imageSrc: '',
            date: '',
            lieu: '',
            type: 'visionner',
            visible: true,
            dossierImages: '',
            images: [],
        });
        setImageFile(null);
        setPreviewImage(null);
    };

    const applyFilter = (newFilter: EventFilter) => {
        setFilter((prev) => ({
            ...prev,
            ...newFilter,
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner />
            </div>
        );
    }

    return (
        <>
            {/* Section Statistiques */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Statistiques des Événements</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">
                            Nombre total d&apos;événements
                        </p>
                        <p className="text-3xl font-bold">{stats.totalEvents}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">
                            Nombre total d&apos;images
                        </p>
                        <p className="text-3xl font-bold">{stats.totalImages}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Événements visibles</p>
                        <p className="text-3xl font-bold">
                            {stats.totalVisible} / {stats.totalEvents}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Événements protégés</p>
                        <p className="text-3xl font-bold">
                            {stats.totalProtected} / {stats.totalEvents}
                        </p>
                    </div>
                </div>

                {/* Types d'événements */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-sm text-indigo-600 font-medium">Visionnage</p>
                        <p className="text-3xl font-bold">{stats.byType.visionner}</p>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-lg">
                        <p className="text-sm text-pink-600 font-medium">Sélection</p>
                        <p className="text-3xl font-bold">{stats.byType.selection}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                        <p className="text-sm text-amber-600 font-medium">Déjà Payé</p>
                        <p className="text-3xl font-bold">{stats.byType.paye}</p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg">
                        <p className="text-sm text-teal-600 font-medium">Non Payé</p>
                        <p className="text-3xl font-bold">{stats.byType.non_paye}</p>
                    </div>
                </div>
            </div>

            {/* Gestion des événements */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Gestion des Événements</h2>
                        <div className="flex items-center gap-4">
                            {!showForm && (
                                <div className="relative w-64">
                                    <input
                                        type="text"
                                        value={filter.searchTerm || ''}
                                        onChange={(e) =>
                                            applyFilter({ searchTerm: e.target.value || undefined })
                                        }
                                        placeholder="Rechercher..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {filter.searchTerm && (
                                        <button
                                            onClick={() => setFilter({})}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowForm(true);
                                }}
                                className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 flex items-center"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2"
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
                                Nouvel événement
                            </button>
                        </div>
                    </div>

                    {statusMessage && (
                        <div
                            className={`p-4 mb-4 rounded-md ${
                                statusMessage.type === 'success'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {statusMessage.message}
                        </div>
                    )}

                    {/* Affichage du formulaire ou de la liste */}
                    {showForm ? (
                        <EventForm
                            formData={formData}
                            setFormData={setFormData}
                            handleSubmit={handleSubmit}
                            handleCancel={resetForm}
                            previewImage={previewImage}
                            handleImageFileChange={handleImageFileChange}
                            isEditing={!!editingEvent}
                            isUploading={uploading}
                        />
                    ) : (
                        <EventList
                            evenements={evenements}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
