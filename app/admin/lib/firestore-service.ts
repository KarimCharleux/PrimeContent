import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';

import { db } from './firebase-client';

// Convertir les Timestamps Firestore en Date JavaScript
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  const result = { ...data };
  
  Object.keys(result).forEach(key => {
    // Si c'est un Timestamp, le convertir en Date
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    } 
    // Si c'est un objet contenant potentiellement des Timestamps, appliquer récursivement
    else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertTimestamps(result[key]);
    }
  });
  
  return result;
};

// Service générique pour les opérations CRUD
export class FirestoreService<T extends { id?: string }> {
  collection: string;
  
  constructor(collectionName: string) {
    this.collection = collectionName;
  }
  
  // Créer un nouvel élément
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const dataWithTimestamps = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, this.collection), dataWithTimestamps);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Document non créé dans ${this.collection}`);
    }
    
    const createdData = {
      id: snapshot.id,
      ...convertTimestamps(snapshot.data())
    } as T;
    
    return createdData;
  }
  
  // Récupérer un élément par ID
  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collection, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...convertTimestamps(snapshot.data())
    } as T;
  }
  
  // Récupérer tous les éléments avec options de filtrage et tri
  async getAll(options?: {
    constraints?: QueryConstraint[],
    orderByField?: string,
    orderDirection?: 'asc' | 'desc',
    limitCount?: number
  }): Promise<T[]> {
    const constraints: QueryConstraint[] = options?.constraints || [];
    
    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }
    
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    
    const q = query(collection(db, this.collection), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as T));
  }
  
  // Mettre à jour un élément
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const docRef = doc(db, this.collection, id);
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, dataWithTimestamp);
    const updated = await this.getById(id);
    
    if (!updated) {
      throw new Error(`Document ${id} non trouvé dans ${this.collection}`);
    }
    
    return updated;
  }
  
  // Supprimer un élément
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }
  
  // Récupérer les éléments par ordre
  async getByOrder(direction: 'asc' | 'desc' = 'asc', limitCount?: number): Promise<T[]> {
    return this.getAll({
      orderByField: 'order',
      orderDirection: direction,
      limitCount
    });
  }
  
  // Récupérer les éléments par catégorie
  async getByCategory(category: string): Promise<T[]> {
    return this.getAll({
      constraints: [where('category', '==', category)]
    });
  }
  
  // Récupérer les éléments mis en avant
  async getHighlighted(): Promise<T[]> {
    return this.getAll({
      constraints: [where('isHighlighted', '==', true)]
    });
  }
}

// Exporter des instances pour les différentes collections
export const galleryService = new FirestoreService('gallery');
export const expertisesService = new FirestoreService('expertises');
export const clientsService = new FirestoreService('clients');
export const keyFiguresService = new FirestoreService('keyFigures');
export const projectsService = new FirestoreService('projects');
export const testimonialsService = new FirestoreService('testimonials');
export const eventsService = new FirestoreService('events');
export const weddingsService = new FirestoreService('weddings');
export const usersService = new FirestoreService('users'); 