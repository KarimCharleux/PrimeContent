'use client';

import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { getMediaUrl } from '../../../utils/mediaUrl';
import { Spinner } from '../../components/Spinner';
import { db } from '../../lib/firebase-client';
import { TeamMember } from '../../models/teamTypes';

export default function HomeTabTeam() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // État du formulaire
    const [formName, setFormName] = useState<string>('');
    const [formTitle, setFormTitle] = useState<string>('');
    const [formDescription, setFormDescription] = useState<string>('');
    const [formImageFile, setFormImageFile] = useState<File | null>(null);
    const [formImagePreview, setFormImagePreview] = useState<string>('');
    const [formError, setFormError] = useState<string>('');
    const [formSuccess, setFormSuccess] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Récupérer les membres de l'équipe depuis Firestore
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                setLoading(true);
                const teamCollection = collection(db, 'team');
                const teamSnapshot = await getDocs(teamCollection);

                if (!teamSnapshot.empty) {
                    const fetchedMembers = teamSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as TeamMember[];

                    // Trier par ordre
                    fetchedMembers.sort((a, b) => a.order - b.order);
                    setTeamMembers(fetchedMembers);
                } else {
                    setTeamMembers([]);
                }

                setLoading(false);
            } catch (error) {
                console.error("Erreur lors de la récupération de l'équipe:", error);
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, []);

    // Réinitialiser le formulaire
    const resetForm = () => {
        setFormName('');
        setFormTitle('');
        setFormDescription('');
        setFormImageFile(null);
        setFormImagePreview('');
        setFormError('');
        setFormSuccess('');
        setCurrentMember(null);
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

    // Modifier un membre
    const handleEditClick = (member: TeamMember) => {
        setCurrentMember(member);
        setFormName(member.name);
        setFormTitle(member.title);
        setFormDescription(member.description);
        setFormImagePreview(member.imagePath ? getMediaUrl(member.imagePath) : '');
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

    // Supprimer un membre
    const handleDeleteClick = async (memberId: string) => {
        if (!memberId || !window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
            return;
        }

        try {
            setIsSubmitting(true);
            await deleteDoc(doc(db, 'team', memberId));

            // Mettre à jour la liste
            setTeamMembers((prev) => prev.filter((member) => member.id !== memberId));
            setFormSuccess('Membre supprimé avec succès !');

            setTimeout(() => {
                setFormSuccess('');
            }, 3000);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            setFormError('Erreur lors de la suppression du membre.');

            setTimeout(() => {
                setFormError('');
            }, 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gérer le changement d'image
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                // 5MB max
                setFormError("L'image ne doit pas dépasser 5MB");
                return;
            }

            if (!file.type.startsWith('image/')) {
                setFormError('Veuillez sélectionner un fichier image valide');
                return;
            }

            setFormImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload d'image
    const uploadImage = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', 'team');

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Erreur upload:', errorData);
            throw new Error(`Erreur lors de l'upload de l'image: ${response.status}`);
        }

        const result = await response.json();

        if (!result.fileUrl) {
            throw new Error("Aucun chemin d'image retourné par l'API");
        }

        return result.fileUrl;
    };

    // Soumettre le formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        // Validation
        if (!formName.trim()) {
            setFormError('Le nom est requis');
            return;
        }

        if (!formTitle.trim()) {
            setFormError('Le titre est requis');
            return;
        }

        if (!formDescription.trim()) {
            setFormError('La description est requise');
            return;
        }

        if (!isEditing && !formImageFile) {
            setFormError('Une image est requise');
            return;
        }

        try {
            setIsSubmitting(true);

            let imagePath = currentMember?.imagePath || '';

            // Upload de l'image si nécessaire
            if (formImageFile) {
                try {
                    imagePath = await uploadImage(formImageFile);
                    if (!imagePath) {
                        throw new Error("L'upload de l'image a échoué");
                    }
                } catch (uploadError) {
                    console.error('Erreur upload image:', uploadError);
                    setFormError("Erreur lors de l'upload de l'image. Veuillez réessayer.");
                    setIsSubmitting(false);
                    return;
                }
            }

            // Vérifier qu'on a bien un chemin d'image pour les nouveaux membres
            if (!isEditing && !imagePath) {
                setFormError('Une image est requise pour créer un membre');
                setIsSubmitting(false);
                return;
            }

            const memberData: Omit<TeamMember, 'id'> = {
                name: formName.trim(),
                title: formTitle.trim(),
                description: formDescription.trim(),
                imagePath: imagePath || '',
                order:
                    isEditing && currentMember
                        ? currentMember.order
                        : teamMembers.length > 0
                          ? Math.max(...teamMembers.map((member) => member.order)) + 1
                          : 0,
            };

            if (isEditing && currentMember?.id) {
                // Mise à jour
                const memberRef = doc(db, 'team', currentMember.id);
                await updateDoc(memberRef, memberData);

                // Mettre à jour la liste
                setTeamMembers((prev) =>
                    prev.map((member) =>
                        member.id === currentMember.id
                            ? { ...memberData, id: currentMember.id }
                            : member,
                    ),
                );

                setFormSuccess('Membre mis à jour avec succès !');
            } else {
                // Création
                const docRef = await addDoc(collection(db, 'team'), memberData);

                // Ajouter à la liste
                setTeamMembers((prev) => [...prev, { ...memberData, id: docRef.id }]);

                setFormSuccess('Membre ajouté avec succès !');
            }

            // Réinitialiser le formulaire après un délai
            setTimeout(() => {
                setIsFormVisible(false);
                resetForm();
            }, 2000);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setFormError('Erreur lors de la sauvegarde. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Déplacer vers le haut
    const handleMoveUp = async (index: number) => {
        if (index === 0) return;

        const newMembers = [...teamMembers];
        [newMembers[index], newMembers[index - 1]] = [newMembers[index - 1], newMembers[index]];

        // Mettre à jour les ordres
        newMembers.forEach((member, idx) => {
            member.order = idx;
        });

        setTeamMembers(newMembers);

        // Sauvegarder en base
        try {
            await Promise.all(
                newMembers
                    .slice(index - 1, index + 1)
                    .map((member) =>
                        updateDoc(doc(db, 'team', member.id!), { order: member.order }),
                    ),
            );
        } catch (error) {
            console.error('Erreur lors de la réorganisation:', error);
        }
    };

    // Déplacer vers le bas
    const handleMoveDown = async (index: number) => {
        if (index === teamMembers.length - 1) return;

        const newMembers = [...teamMembers];
        [newMembers[index], newMembers[index + 1]] = [newMembers[index + 1], newMembers[index]];

        // Mettre à jour les ordres
        newMembers.forEach((member, idx) => {
            member.order = idx;
        });

        setTeamMembers(newMembers);

        // Sauvegarder en base
        try {
            await Promise.all(
                newMembers
                    .slice(index, index + 2)
                    .map((member) =>
                        updateDoc(doc(db, 'team', member.id!), { order: member.order }),
                    ),
            );
        } catch (error) {
            console.error('Erreur lors de la réorganisation:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Gestion de l&apos;équipe</h2>
                <button
                    onClick={handleAddClick}
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                    Ajouter un membre
                </button>
            </div>

            {/* Messages de statut */}
            {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                    {formError}
                </div>
            )}

            {formSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                    {formSuccess}
                </div>
            )}

            {/* Liste des membres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member, index) => (
                    <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        {member.imagePath && (
                            <div className="aspect-video relative">
                                <Image
                                    src={getMediaUrl(member.imagePath)}
                                    alt={member.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1">{member.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{member.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-3">
                                {member.description}
                            </p>

                            <div className="mt-4 flex justify-between items-center">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === teamMembers.length - 1}
                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        ↓
                                    </button>
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEditClick(member)}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(member.id!)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                        disabled={isSubmitting}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {teamMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    Aucun membre d&apos;équipe configuré. Cliquez sur &quot;Ajouter un membre&quot;
                    pour commencer.
                </div>
            )}

            {/* Formulaire d'ajout/modification */}
            {isFormVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">
                            {isEditing ? 'Modifier le membre' : 'Ajouter un membre'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    placeholder="Prénom Nom"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titre/Poste *
                                </label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    placeholder="Ex: Co-fondateur, Directeur artistique"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    placeholder="Courte description du membre et de son rôle..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Photo {!isEditing && '*'}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                />
                                {formImagePreview && (
                                    <div className="mt-2 relative w-24 h-24">
                                        <Image
                                            src={formImagePreview}
                                            alt="Aperçu"
                                            fill
                                            className="object-cover rounded-md"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCancelClick}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting
                                        ? 'Enregistrement...'
                                        : isEditing
                                          ? 'Mettre à jour'
                                          : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
