import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
  StorageReference
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

import { MediaItem } from '../models/types';

import { storage } from './firebase-client';
import { galleryService } from './firestore-service';

// Générer un nom unique pour le fichier
const generateUniqueFilename = (originalFilename: string): string => {
  const extension = originalFilename.split('.').pop();
  const uniqueId = uuidv4().substring(0, 8);
  const timestamp = Date.now();
  
  // Nettoyer le nom de fichier des caractères spéciaux et espaces
  const cleanName = originalFilename
    .split('.')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40); // Limiter la longueur
    
  return `${cleanName}-${uniqueId}-${timestamp}.${extension}`;
};

// Créer les métadonnées Firestore pour un média
const createMediaMetadata = async (
  file: File, 
  downloadUrl: string, 
  filename: string, 
  options?: {
    alt?: string;
    title?: string;
    description?: string;
    category?: string;
    order?: number;
  }
): Promise<MediaItem> => {
  const mediaData = {
    url: downloadUrl,
    filename: filename,
    alt: options?.alt || file.name,
    title: options?.title || '',
    description: options?.description || '',
    category: options?.category || 'default',
    order: options?.order || 0
  };
  
  return await galleryService.create(mediaData) as MediaItem;
};

// Service pour gérer le stockage des médias
export class StorageService {
  folderPath: string;
  
  constructor(folderPath: string = 'media') {
    this.folderPath = folderPath;
  }
  
  // Changer de dossier
  setFolder(folder: string): void {
    this.folderPath = folder;
  }
  
  // Obtenir la référence à un chemin
  getReference(path: string): StorageReference {
    return ref(storage, path);
  }
  
  // Uploader un fichier
  async uploadFile(
    file: File, 
    options?: {
      alt?: string;
      title?: string;
      description?: string;
      category?: string;
      order?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<MediaItem> {
    // Générer un nom de fichier unique
    const uniqueFilename = generateUniqueFilename(file.name);
    const storagePath = `${this.folderPath}/${uniqueFilename}`;
    const storageRef = this.getReference(storagePath);
    
    // Uploader le fichier avec rapport de progression
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Retourner une promesse pour l'upload
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (options?.onProgress) {
            options.onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            // Upload terminé, obtenir l'URL de téléchargement
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Créer les métadonnées dans Firestore
            const mediaItem = await createMediaMetadata(
              file, 
              downloadUrl, 
              uniqueFilename, 
              options
            );
            
            resolve(mediaItem);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }
  
  // Supprimer un fichier
  async deleteFile(mediaItem: MediaItem): Promise<void> {
    try {
      // Supprimer de Storage
      const storageRef = this.getReference(`${this.folderPath}/${mediaItem.filename}`);
      await deleteObject(storageRef);
      
      // Supprimer de Firestore
      await galleryService.delete(mediaItem.id);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  }
  
  // Lister tous les fichiers dans un dossier
  async listFiles(subfolder: string = ''): Promise<string[]> {
    const path = subfolder ? `${this.folderPath}/${subfolder}` : this.folderPath;
    const folderRef = this.getReference(path);
    
    try {
      const fileList = await listAll(folderRef);
      return fileList.items.map(item => item.fullPath);
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw error;
    }
  }
}

export const mediaStorage = new StorageService('media');
export const photoStorage = new StorageService('photos');
export const videoStorage = new StorageService('videos');
export const clientLogoStorage = new StorageService('logos'); 