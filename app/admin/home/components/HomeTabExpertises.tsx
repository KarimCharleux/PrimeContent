'use client';

import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Spinner } from '@/app/admin/components/Spinner';
import { db, storage } from '@/app/admin/lib/firebase-client';
import ExpertiseCard from '@/app/components/ExpertiseCard';

interface Expertise {
  id?: string;
  title: string;
  description: string;
  backgroundImage: string;
  href: string;
  iconName: string;
}

export default function HomeTabExpertises() {
  const [expertises, setExpertises] = useState<Expertise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingExpertise, setEditingExpertise] = useState<Expertise | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<Expertise>();
  const watchedValues = watch();

  // Charger les expertises depuis Firestore ou utiliser les données par défaut
  useEffect(() => {
    const fetchExpertises = async () => {
      try {
        const expertisesCollection = collection(db, 'expertises');
        const expertisesSnapshot = await getDocs(expertisesCollection);

        if (expertisesSnapshot.empty) {
          // Expertises vide
          setExpertises([]);
        } else {
          const fetchedExpertises = expertisesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Expertise[];
          setExpertises(fetchedExpertises);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des expertises:", error);
        setStatusMessage({ type: 'error', message: "Impossible de charger les expertises" });
        setExpertises([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpertises();
  }, []);

  // Fonction pour extraire le nom de l'icône à partir du SVG
  const getIconNameFromSvg = (iconNode: React.ReactNode): string => {
    // Cette fonction est une simplification, en pratique vous devriez stocker le nom de l'icône
    // Ici, on fait une déduction basée sur le path ou viewBox du SVG
    const svgString = JSON.stringify(iconNode);
    if (svgString.includes('M15 10l4.553-2.276')) return 'video';
    if (svgString.includes('M3 9a2 2 0 012-2h.93')) return 'photo';
    if (svgString.includes('M13 10V3L4 14h7v7l9-11h-7z')) return 'social';
    if (svgString.includes('M7 21a4 4 0 01-4-4V5')) return 'branding';
    if (svgString.includes('M9.75 17L9 20l-1 1h8l-1-1')) return 'web';
    return 'default';
  };

  // Fonction pour obtenir l'icône à partir du nom
  const getIconFromName = (iconName: string): React.ReactNode => {
    switch (iconName) {
      case 'video':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 md:h-7 md:w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="black"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      case 'photo':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 md:h-7 md:w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="black"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
          </svg>
        );
      case 'social':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 md:h-7 md:w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="black"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'branding':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 md:h-7 md:w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="black"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        );
      case 'web':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 md:h-7 md:w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="black"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 md:h-7 md:w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="black"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const onSubmit = async (data: Expertise) => {
    setSaving(true);
    try {
      if (editingExpertise?.id) {
        // Mise à jour d'une expertise existante
        await updateDoc(doc(db, 'expertises', editingExpertise.id), {
          title: data.title,
          description: data.description,
          backgroundImage: data.backgroundImage,
          href: data.href,
          iconName: data.iconName
        });

        setExpertises(prevExpertises => prevExpertises.map(exp => 
          exp.id === editingExpertise.id ? { ...data, id: exp.id } : exp
        ));
        setStatusMessage({ type: 'success', message: 'Expertise mise à jour avec succès' });
      } else {
        // Ajout d'une nouvelle expertise
        const docRef = await addDoc(collection(db, 'expertises'), {
          title: data.title,
          description: data.description,
          backgroundImage: data.backgroundImage,
          href: data.href,
          iconName: data.iconName
        });

        setExpertises(prevExpertises => [...prevExpertises, { ...data, id: docRef.id }]);
        setStatusMessage({ type: 'success', message: 'Nouvelle expertise ajoutée avec succès' });
      }

      setEditingExpertise(null);
      reset();
      setPreviewImage(null);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setStatusMessage({ type: 'error', message: "Erreur lors de la sauvegarde" });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStatusMessage({ type: 'success', message: 'Chargement de l\'image...' });

      // Créer un objet URL pour la prévisualisation locale
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);

      // Télécharger le fichier vers Firebase Storage
      const storageRef = ref(storage, `expertises/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      
      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(storageRef);
      
      // Mettre à jour le formulaire avec l'URL
      setValue('backgroundImage', downloadURL);
      setStatusMessage({ type: 'success', message: 'Image téléchargée avec succès' });
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image:", error);
      setStatusMessage({ type: 'error', message: "Erreur lors du téléchargement de l'image" });
    }
  };

  const handleEditExpertise = (expertise: Expertise) => {
    setEditingExpertise(expertise);
    reset(expertise);
    setPreviewImage(expertise.backgroundImage);
  };

  const handleDeleteExpertise = async (expertise: Expertise) => {
    if (!expertise.id) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'expertise "${expertise.title}" ?`)) {
      try {
        await deleteDoc(doc(db, 'expertises', expertise.id));
        setExpertises(prevExpertises => prevExpertises.filter(exp => exp.id !== expertise.id));
        setStatusMessage({ type: 'success', message: 'Expertise supprimée avec succès' });
        
        // Si l'expertise en cours d'édition est supprimée, réinitialiser le formulaire
        if (editingExpertise?.id === expertise.id) {
          setEditingExpertise(null);
          reset();
          setPreviewImage(null);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setStatusMessage({ type: 'error', message: "Erreur lors de la suppression" });
      }
    }
  };

  const cancelEdit = () => {
    setEditingExpertise(null);
    reset();
    setPreviewImage(null);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Gestion des Expertises</h2>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
          >
            {previewMode ? "Mode Édition" : "Mode Prévisualisation"}
          </button>
        </div>
        
        {statusMessage && (
          <div className={`p-4 mb-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {statusMessage.message}
          </div>
        )}

        {previewMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {expertises.map((expertise) => (
              <ExpertiseCard
                key={expertise.id}
                title={expertise.title}
                description={expertise.description}
                icon={getIconFromName(expertise.iconName)}
                backgroundImage={expertise.backgroundImage}
                href={expertise.href}
              />
            ))}
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                {editingExpertise ? `Modifier: ${editingExpertise.title}` : "Ajouter une nouvelle expertise"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      type="text"
                      {...register('title', { required: 'Le titre est requis' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      {...register('description', { required: 'La description est requise' })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lien (href)</label>
                    <input
                      type="text"
                      {...register('href', { required: 'Le lien est requis' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {errors.href && <p className="mt-1 text-sm text-red-600">{errors.href.message}</p>}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d'icône</label>
                    <select
                      {...register('iconName', { required: 'Le type d\'icône est requis' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Sélectionner une icône</option>
                      <option value="video">Vidéo</option>
                      <option value="photo">Photo</option>
                      <option value="social">Réseaux Sociaux</option>
                      <option value="branding">Branding</option>
                      <option value="web">Web</option>
                    </select>
                    {errors.iconName && <p className="mt-1 text-sm text-red-600">{errors.iconName.message}</p>}
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image d'arrière-plan</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        {...register('backgroundImage', { required: 'L\'URL de l\'image est requise' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="URL de l'image"
                      />
                      <label className="px-3 py-2 bg-gray-200 text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-300">
                        Parcourir
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                    {errors.backgroundImage && <p className="mt-1 text-sm text-red-600">{errors.backgroundImage.message}</p>}
                  </div>
                  
                  <div className="mt-4">
                    <p className="block text-sm font-medium text-gray-700 mb-1">Prévisualisation</p>
                    {previewImage ? (
                      <div className="relative w-full h-64 rounded-lg overflow-hidden">
                        <Image 
                          src={previewImage} 
                          alt="Prévisualisation" 
                          fill 
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                        <p className="text-gray-500">Aucune image sélectionnée</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Prévisualisation de la carte</h4>
                    <div className="h-[280px] w-full">
                      {watchedValues.title && watchedValues.description && watchedValues.iconName && (
                        <ExpertiseCard
                          title={watchedValues.title}
                          description={watchedValues.description}
                          icon={getIconFromName(watchedValues.iconName)}
                          backgroundImage={previewImage || '/placeholder.jpg'}
                          href={watchedValues.href || '#'}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                {editingExpertise && (
                  <button
                    type="button"
                    onClick={cancelEdit}
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
                  {saving ? <Spinner small white /> : (editingExpertise ? "Mettre à jour" : "Ajouter")}
                </button>
              </div>
            </form>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Expertises existantes</h3>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expertises.map((expertise) => (
                        <tr key={expertise.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{expertise.title}</td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs truncate">{expertise.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-10 w-10 relative overflow-hidden rounded">
                              <Image 
                                src={expertise.backgroundImage} 
                                alt={expertise.title} 
                                fill 
                                className="object-cover"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEditExpertise(expertise)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpertise(expertise)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 