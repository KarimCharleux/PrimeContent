'use client';

import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';

interface GalleryImage {
  url: string;
  name: string;
  size: number;
  dimensions?: { width: number; height: number };
  lastModified?: Date;
}

interface GalleryStats {
  totalImages: number;
  totalSize: number;
  averageLoadTime: number;
}

interface HomeTabGalleryProps {
  onStatusChange?: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function HomeTabGallery({ onStatusChange }: HomeTabGalleryProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [stats, setStats] = useState<GalleryStats>({
    totalImages: 0,
    totalSize: 0,
    averageLoadTime: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Charger les données de la galerie
  useEffect(() => {
    fetchGalleryImages();
  }, []);

  // Propager les messages de statut au parent si nécessaire
  useEffect(() => {
    if (onStatusChange && statusMessage) {
      onStatusChange(statusMessage);
    }
  }, [statusMessage, onStatusChange]);

  const fetchGalleryImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/home/gallery');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des images');
      }
      
      const data = await response.json();
      
      // Trier les images par nom de fichier
      const sortedImages = [...data.images].sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      
      setImages(sortedImages);
      setStats(data.stats);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setStatusMessage({
        type: 'error',
        message: 'Erreur lors du chargement des images de la galerie'
      });
      setIsLoading(false);
    }
  };

  // Gérer le drag & drop des fichiers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Déclencher la sélection de fichiers
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Gérer le changement de fichiers sélectionnés
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  // Télécharger les fichiers sur le serveur
  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
      // Ajouter le nom original du fichier
      formData.append('originalNames', files[i].name);
    }

    try {
      const response = await fetch('/api/home/gallery/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement des images');
      }

      const result = await response.json();
      setStatusMessage({
        type: 'success',
        message: `${result.uploaded} images téléchargées avec succès`
      });

      // Rafraîchir la liste des images
      fetchGalleryImages();
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      setStatusMessage({
        type: 'error',
        message: 'Erreur lors du téléchargement des images'
      });
    } finally {
      setUploading(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Supprimer une image
  const handleDeleteImage = async (imageName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'image "${imageName}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/delete?path=${encodeURIComponent('home/gallery')}&name=${encodeURIComponent(imageName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l&apos;image');
      }

      setStatusMessage({
        type: 'success',
        message: `L'image "${imageName}" a été supprimée avec succès`
      });

      // Rafraîchir la liste des images
      fetchGalleryImages();
    } catch (error) {
      console.error('Erreur de suppression:', error);
      setStatusMessage({
        type: 'error',
        message: `Erreur lors de la suppression de l'image "${imageName}"`
      });
    }
  };

  // Supprimer toutes les images
  const handleDeleteAllImages = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer toutes les photos (${images.length} images) ? Cette action est irréversible.`)) {
      return;
    }

    try {
      // Supprimer toutes les images sans demander de confirmation individuelle
      await Promise.all(images.map(image => 
        fetch(`/api/delete?path=${encodeURIComponent('home/gallery')}&name=${encodeURIComponent(image.name)}`, {
          method: 'DELETE',
        })
      ));

      setStatusMessage({
        type: 'success',
        message: `Toutes les photos (${images.length} images) ont été supprimées avec succès`
      });

      // Rafraîchir la liste des images
      fetchGalleryImages();
    } catch (error) {
      console.error('Erreur lors de la suppression des photos:', error);
      setStatusMessage({
        type: 'error',
        message: 'Erreur lors de la suppression des photos'
      });
    }
  };

  // Télécharger une image individuelle
  const handleDownloadImage = (imageUrl: string, imageName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Télécharger toutes les images
  const handleDownloadAllImages = async () => {
    if (images.length === 0) return;
    
    setIsDownloadingZip(true);
    setDownloadProgress(0);
    setStatusMessage({
      type: 'success',
      message: 'Préparation du téléchargement, veuillez patienter...'
    });
    
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("images");
      
      let completedCount = 0;
      
      // Pour chaque image, la télécharger et l'ajouter au zip
      const fetchPromises = images.map(async (image) => {
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          imgFolder?.file(image.name, blob);
          
          completedCount++;
          setDownloadProgress(Math.round((completedCount / images.length) * 100));
          
          return true;
        } catch (error) {
          console.error(`Erreur lors du téléchargement de ${image.name}:`, error);
          return false;
        }
      });
      
      await Promise.all(fetchPromises);
      
      setStatusMessage({
        type: 'success',
        message: 'Création du fichier ZIP...'
      });
      
      // Générer le zip et le télécharger
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      saveAs(content, "gallery-images.zip");
      
      setStatusMessage({
        type: 'success',
        message: 'Téléchargement terminé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la création du fichier ZIP:', error);
      setStatusMessage({
        type: 'error',
        message: 'Erreur lors de la création du fichier ZIP'
      });
    } finally {
      setIsDownloadingZip(false);
      setDownloadProgress(0);
    }
  };

  // Formater la taille en ko, Mo ou Go
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + ' octets';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' Ko';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
    }
  };

  // Formater le temps de chargement
  const formatLoadTime = (ms: number): string => {
    if (ms < 1000) {
      return ms.toFixed(0) + ' ms';
    } else {
      return (ms / 1000).toFixed(2) + ' s';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Statistiques de la Galerie</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Nombre d&apos;images</p>
            <p className="text-3xl font-bold">{stats.totalImages}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Taille totale</p>
            <p className="text-3xl font-bold">{formatSize(stats.totalSize)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Temps de chargement moyen</p>
            <p className="text-3xl font-bold">{formatLoadTime(stats.averageLoadTime)}</p>
            <p className="text-xs text-gray-500">Estimation basée sur une connexion moyenne en France (15 Mbps)</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Photos de la Galerie</h2>
          <div className="flex space-x-2">
            {images.length > 0 && (
              <>
                <button
                  onClick={handleDownloadAllImages}
                  disabled={isDownloadingZip}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isDownloadingZip ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {downloadProgress}%
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Tout télécharger
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeleteAllImages}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Tout supprimer
                </button>
              </>
            )}
            <button
              onClick={triggerFileInput}
              disabled={uploading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 flex items-center"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Téléchargement...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter des photos
                </>
              )}
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileChange}
          />
        </div>
        
        {/* Zone de drop pour les images */}
        <div
          className={`border-2 border-dashed p-8 mb-8 rounded-lg text-center ${isDragging ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-2 text-gray-600">
            Glissez-déposez des images ici ou{' '}
            <button 
              type="button" 
              className="text-primary hover:text-primary-dark font-medium"
              onClick={triggerFileInput}
            >
              parcourez votre ordinateur
            </button>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF, WEBP acceptés
          </p>
        </div>
        
        {/* Liste des images de la galerie */}
        {images.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Aucune image dans la galerie. Ajoutez des images pour commencer.
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Les photos sont triées alphabétiquement par nom de fichier.
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-w-1 aspect-h-1 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={image.url}
                      alt={image.name}
                      width={300}
                      height={300}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownloadImage(image.url, image.name)}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                        title="Télécharger"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.name)}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                        title="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate">{image.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatSize(image.size)} 
                      {image.dimensions && ` - ${image.dimensions.width}×${image.dimensions.height}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 