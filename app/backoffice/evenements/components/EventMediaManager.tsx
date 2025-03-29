'use client';

import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { db } from '@/app/backoffice/lib/firebase-client';
import { Evenement, EventImage } from '@/app/backoffice/models/eventTypes';

interface EventMediaManagerProps {
    evenement: Evenement;
    onStatusChange?: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function EventMediaManager({ evenement, onStatusChange }: EventMediaManagerProps) {
    const router = useRouter();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<EventImage[]>(evenement.images || []);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [isGridView, setIsGridView] = useState(true);
    const [filterSelected, setFilterSelected] = useState(false);

    useEffect(() => {
        setImages(evenement.images || []);
    }, [evenement]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(filesArray);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const filesArray = Array.from(e.dataTransfer.files);
            setSelectedFiles(filesArray);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        try {
            setUploading(true);
            setUploadProgress(0);
            
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });
            formData.append('path', `evenements/${evenement.id}`);
            formData.append('useUuid', 'true');
            
            const response = await fetch('/api/upload/batch', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error("Erreur lors de l'upload des images");
            }
            
            const uploadResult = await response.json();
            
            // Ajouter les nouvelles images à la liste existante
            const newImages: EventImage[] = uploadResult.fileUrls.map((url: string) => ({
                id: url.split('/').pop()?.split('.')[0] || `img-${Date.now()}`,
                path: url,
                selected: false
            }));
            
            const updatedImages = [...images, ...newImages];
            
            // Mettre à jour Firestore
            const eventRef = doc(db, 'evenements', evenement.id!);
            await updateDoc(eventRef, {
                images: updatedImages
            });
            
            setImages(updatedImages);
            setSelectedFiles([]);
            
            onStatusChange?.({
                type: 'success',
                message: `${newImages.length} image(s) importée(s) avec succès`
            });
            
            // Rafraîchir la page pour montrer les nouvelles images
            router.refresh();
            
        } catch (error) {
            console.error("Erreur lors de l'upload:", error);
            onStatusChange?.({
                type: 'error',
                message: "Erreur lors de l'upload des images"
            });
        } finally {
            setUploading(false);
            setUploadProgress(100);
        }
    };

    const handleToggleImageSelection = (imageId: string) => {
        if (selectedImages.includes(imageId)) {
            setSelectedImages(selectedImages.filter(id => id !== imageId));
        } else {
            setSelectedImages([...selectedImages, imageId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedImages.length === images.length) {
            // Si toutes sont déjà sélectionnées, désélectionner tout
            setSelectedImages([]);
        } else {
            // Sinon, sélectionner toutes les images
            setSelectedImages(images.map(img => img.id));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedImages.length === 0) return;
        
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedImages.length} image(s) ?`)) {
            try {
                // Filtrer les images pour ne garder que celles qui ne sont pas sélectionnées
                const updatedImages = images.filter(img => !selectedImages.includes(img.id));
                
                // Mettre à jour Firestore
                const eventRef = doc(db, 'evenements', evenement.id!);
                await updateDoc(eventRef, {
                    images: updatedImages
                });
                
                setImages(updatedImages);
                setSelectedImages([]);
                
                onStatusChange?.({
                    type: 'success',
                    message: `${selectedImages.length} image(s) supprimée(s) avec succès`
                });
                
                // Rafraîchir la page
                router.refresh();
                
            } catch (error) {
                console.error("Erreur lors de la suppression des images:", error);
                onStatusChange?.({
                    type: 'error',
                    message: "Erreur lors de la suppression des images"
                });
            }
        }
    };

    const handleToggleSelection = async (imageId: string) => {
        try {
            const updatedImages = images.map(img => {
                if (img.id === imageId) {
                    return { ...img, selected: !img.selected };
                }
                return img;
            });
            
            // Mettre à jour Firestore
            const eventRef = doc(db, 'evenements', evenement.id!);
            await updateDoc(eventRef, {
                images: updatedImages
            });
            
            setImages(updatedImages);
            
            onStatusChange?.({
                type: 'success',
                message: `Image ${updatedImages.find(img => img.id === imageId)?.selected ? 'sélectionnée' : 'désélectionnée'}`
            });
            
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la sélection:", error);
            onStatusChange?.({
                type: 'error',
                message: "Erreur lors de la mise à jour de la sélection"
            });
        }
    };

    // Filtrer les images si nécessaire
    const filteredImages = filterSelected 
        ? images.filter(img => img.selected) 
        : images;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">
                Gestion des médias pour "{evenement.titre}"
            </h2>
            
            {/* Section pour l'import des images */}
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Importer des images</h3>
                
                <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                >
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                    
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    
                    <p className="text-gray-600 mb-2">
                        Glissez-déposez vos images ici ou cliquez pour parcourir
                    </p>
                    <p className="text-gray-500 text-sm">
                        JPG, PNG, GIF (max 10Mo par image)
                    </p>
                </div>
                
                {selectedFiles.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-gray-600">
                                {selectedFiles.length} fichier(s) sélectionné(s)
                            </p>
                            <button 
                                onClick={() => setSelectedFiles([])}
                                className="text-red-500 hover:text-red-700 text-sm"
                            >
                                Réinitialiser
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    <Image 
                                        src={URL.createObjectURL(file)} 
                                        alt={file.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full py-2 bg-black text-white rounded-md hover:bg-black/80 flex items-center justify-center"
                        >
                            {uploading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Upload en cours... {uploadProgress}%
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Importer {selectedFiles.length} fichier(s)
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
            
            {/* Section de gestion des images */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                        Gestion des images ({filteredImages.length})
                    </h3>
                    
                    <div className="flex items-center space-x-4">
                        {/* Toggle pour filtrer les images sélectionnées */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="filter-selected"
                                checked={filterSelected}
                                onChange={() => setFilterSelected(!filterSelected)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="filter-selected" className="ml-2 text-sm text-gray-600">
                                Afficher uniquement les sélectionnées
                            </label>
                        </div>
                        
                        {/* Boutons de vue */}
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsGridView(true)}
                                className={`p-2 rounded-md ${isGridView ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsGridView(false)}
                                className={`p-2 rounded-md ${!isGridView ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Actions sur les images sélectionnées */}
                <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="select-all"
                            checked={selectedImages.length > 0 && selectedImages.length === images.length}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="select-all" className="ml-2 text-sm text-gray-700">
                            {selectedImages.length === 0 
                                ? 'Tout sélectionner' 
                                : `${selectedImages.length} image(s) sélectionnée(s)`
                            }
                        </label>
                    </div>
                    
                    {selectedImages.length > 0 && (
                        <div className="flex space-x-2">
                            <button
                                onClick={handleDeleteSelected}
                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                            >
                                Supprimer la sélection
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Affichage des images en mode grille */}
                {isGridView && (
                    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`}>
                        {filteredImages.map((image) => (
                            <div 
                                key={image.id} 
                                className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden ${
                                    selectedImages.includes(image.id) ? 'ring-2 ring-indigo-500' : ''
                                }`}
                            >
                                <Image 
                                    src={image.path} 
                                    alt={`Image ${image.id}`}
                                    fill
                                    className="object-cover"
                                />
                                
                                {/* Overlay pour la sélection */}
                                <div 
                                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    onClick={() => handleToggleImageSelection(image.id)}
                                >
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="p-2 bg-white rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                        <span className="text-white text-xs font-medium">
                                            {selectedImages.includes(image.id) ? 'Désélectionner' : 'Sélectionner'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Badge pour indiquer si l'image est sélectionnée pour l'événement */}
                                <div 
                                    className={`absolute top-2 right-2 p-1.5 rounded-full cursor-pointer transition-colors
                                        ${image.selected ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                    onClick={() => handleToggleSelection(image.id)}
                                    title={image.selected ? 'Désélectionner pour l\'événement' : 'Sélectionner pour l\'événement'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={image.selected ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                
                                {/* Checkbox pour la sélection multiple */}
                                <div className="absolute top-2 left-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedImages.includes(image.id)}
                                        onChange={() => handleToggleImageSelection(image.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Affichage des images en mode liste */}
                {!isGridView && (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="w-12 px-3 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedImages.length > 0 && selectedImages.length === images.length}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </th>
                                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aperçu
                                    </th>
                                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chemin
                                    </th>
                                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sélectionnée
                                    </th>
                                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredImages.map((image) => (
                                    <tr key={image.id} className={selectedImages.includes(image.id) ? 'bg-indigo-50' : ''}>
                                        <td className="px-3 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedImages.includes(image.id)}
                                                onChange={() => handleToggleImageSelection(image.id)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="w-16 h-16 relative">
                                                <Image 
                                                    src={image.path} 
                                                    alt={`Image ${image.id}`}
                                                    fill
                                                    className="object-cover rounded-md"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {image.id}
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="max-w-xs truncate">
                                                {image.path}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button
                                                onClick={() => handleToggleSelection(image.id)}
                                                className={`p-1.5 rounded-full ${
                                                    image.selected ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                }`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={image.selected ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            </button>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedImages([image.id]);
                                                    handleDeleteSelected();
                                                }}
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
                
                {filteredImages.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500">
                            {filterSelected 
                                ? "Aucune image sélectionnée pour cet événement" 
                                : "Aucune image n'a encore été ajoutée à cet événement"
                            }
                        </p>
                        {filterSelected && (
                            <button
                                onClick={() => setFilterSelected(false)}
                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                            >
                                Afficher toutes les images
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 