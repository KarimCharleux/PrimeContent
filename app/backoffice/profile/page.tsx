'use client';

import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase-client';

// Formats d'image autorisés
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function ProfilePage() {
  const { user, firebaseUser, updateUserProfile, changePassword, error, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Remplir les champs avec les données utilisateur une fois chargées
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  // Gérer le changement d'avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le format du fichier
    if (!ALLOWED_FORMATS.includes(file.type)) {
      setStatusMessage({
        type: 'error',
        message: 'Format de fichier non supporté. Veuillez utiliser JPEG, PNG, GIF ou WEBP.'
      });
      return;
    }

    // Sauvegarder le fichier pour l'upload plus tard
    setSelectedFile(file);

    // Créer une URL locale pour la prévisualisation
    const fileUrl = URL.createObjectURL(file);
    setPhotoURL(fileUrl);
  };

  // Déclencher le sélecteur de fichier quand l'utilisateur clique sur l'avatar
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Sauvegarder l'image sur le serveur
  const saveImageToPublicFolder = async (file: File, oldPhotoURL?: string): Promise<string> => {
    try {
      // Générer un nom de fichier unique
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `/backoffice/users/${fileName}`;
      
      // Créer un FormData pour l'upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', 'backoffice/users');
      formData.append('fileName', fileName);
      
      // Ajouter l'ancien chemin d'image pour la suppression
      if (oldPhotoURL && oldPhotoURL.startsWith('/backoffice/users/')) {
        formData.append('oldFilePath', oldPhotoURL);
      }
      
      // Faire une requête fetch à notre API locale pour sauvegarder le fichier
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement de l\'image');
      }
      
      return filePath;
    } catch (error) {
      console.error('Erreur de sauvegarde de l\'image:', error);
      throw error;
    }
  };

  // Enregistrer les modifications du profil
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    
    try {
      let finalPhotoURL = photoURL;
      
      // Si une nouvelle image est sélectionnée, la sauvegarder dans le dossier public
      if (selectedFile) {
        // On passe l'ancienne URL de la photo pour suppression
        finalPhotoURL = await saveImageToPublicFolder(selectedFile, user?.photoURL);
      }
      
      // Mettre à jour le profil dans Firebase
      await updateUserProfile(displayName, finalPhotoURL);
      
      // Mettre à jour aussi dans Firestore si nécessaire
      if (user && user.id) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          displayName,
          photoURL: finalPhotoURL
        });
      }
      
      setStatusMessage({ 
        type: 'success', 
        message: 'Profil mis à jour avec succès!' 
      });
      
      // Réinitialiser le fichier sélectionné
      setSelectedFile(null);
    } catch (error: any) {
      setStatusMessage({ 
        type: 'error', 
        message: `Erreur lors de la mise à jour du profil : ${error.message}` 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Changer le mot de passe
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setStatusMessage({ 
        type: 'error', 
        message: 'Les mots de passe ne correspondent pas.' 
      });
      return;
    }
    
    setIsChangingPassword(true);
    setStatusMessage(null);
    
    try {
      await changePassword(currentPassword, newPassword);
      setStatusMessage({ 
        type: 'success', 
        message: 'Mot de passe modifié avec succès!' 
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setStatusMessage({ 
        type: 'error', 
        message: `Erreur lors du changement de mot de passe : ${error.message}` 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold mb-6">Profil Administrateur</h1>
      
      {statusMessage && (
        <div className={`mb-4 p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {statusMessage.message}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 cursor-pointer" onClick={triggerFileInput}>
                {photoURL ? (
                  <Image
                    src={photoURL}
                    alt="Avatar"
                    fill
                    sizes="(max-width: 768px) 100vw, 128px"
                    className="hover:opacity-80 transition-opacity object-cover"
                  />
                ) : (
                  <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                    <span className="text-gray-500 text-4xl">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center transition-opacity">
                  <span className="text-white opacity-0 hover:opacity-100">Modifier</span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
              />
              <p className="text-sm text-gray-500">Cliquez sur l&apos;image pour changer votre photo de profil</p>
              <p className="text-xs text-gray-400 mt-1">Formats acceptés: JPEG, PNG, GIF, WEBP</p>
            </div>
            
            <div className="md:w-2/3">
              <form onSubmit={handleProfileUpdate}>
                <div className="mb-4">
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">L&apos;adresse email ne peut pas être modifiée.</p>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Changer le mot de passe</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                minLength={6}
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                minLength={6}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {isChangingPassword ? 'Modification en cours...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 