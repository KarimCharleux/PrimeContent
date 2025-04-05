import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

import { db } from '../lib/firebase-client';
import { Evenement } from '../models/eventTypes';

/**
 * Récupère un événement par son ID
 */
export async function getEventById(id: string): Promise<Evenement | null> {
    try {
        const eventRef = doc(db, 'evenements', id);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
            console.log(`Événement avec l'ID ${id} non trouvé`);
            return null;
        }

        return {
            id: eventSnap.id,
            ...eventSnap.data(),
        } as Evenement;
    } catch (error) {
        console.error("Erreur lors de la récupération de l'événement:", error);
        return null;
    }
}

/**
 * Récupère tous les événements visibles
 */
export async function getAllEvents(): Promise<Evenement[]> {
    try {
        const eventsCollection = collection(db, 'evenements');
        const eventsQuery = query(
            eventsCollection,
            where('visible', '==', true),
            orderBy('date', 'desc'),
        );

        const eventsSnapshot = await getDocs(eventsQuery);

        if (eventsSnapshot.empty) {
            return [];
        }

        return eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Evenement[];
    } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        return [];
    }
}
