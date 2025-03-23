'use client';

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
      
      setImages(data.images);
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/delete?path=${encodeURIComponent('home/gallery')}&name=${encodeURIComponent(imageName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'image');
      }

      setStatusMessage({
        type: 'success',
        message: 'Image supprimée avec succès'
      });

      // Rafraîchir la liste des images
      fetchGalleryImages();
    } catch (error) {
      console.error('Erreur de suppression:', error);
      setStatusMessage({
        type: 'error',
        message: 'Erreur lors de la suppression de l\'image'
      });
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
            <p className="text-sm text-blue-600 font-medium">Nombre d'images</p>
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
          <button
            onClick={triggerFileInput}
            disabled={uploading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
          >
            {uploading ? 'Téléchargement...' : 'Ajouter des photos'}
          </button>
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
        )}
      </div>
    </div>
  );
} 