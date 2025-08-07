import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    DocumentReference,
    DocumentData,
} from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../backoffice/lib/firebase-client';

interface SelectionData {
    userId: string;
    medias: string[];
    email?: string;
    instagram?: string;
    deviceInfo?: {
        userAgent: string;
        platform: string;
        language: string;
    };
    createdAt?: any;
    updatedAt?: any;
}

export function useSelectionPersistence(eventId: string) {
    const [userId, setUserId] = useState<string | null>(null);
    const [selection, setSelection] = useState<SelectionData | null>(null);
    const [loading, setLoading] = useState(true);

    // Génère ou récupère le userId local
    useEffect(() => {
        let storedId = localStorage.getItem('selection_userId');
        if (!storedId) {
            storedId = uuidv4();
            localStorage.setItem('selection_userId', storedId);
        }
        setUserId(storedId);
    }, []);

    // Charge la sélection existante
    useEffect(() => {
        if (!userId || !eventId) return;
        setLoading(true);
        const ref = doc(db, 'evenements', eventId, 'selections', userId);
        getDoc(ref).then((snap) => {
            if (snap.exists()) {
                setSelection(snap.data() as SelectionData);
            } else {
                setSelection({ userId, medias: [] });
            }
            setLoading(false);
        });
    }, [userId, eventId]);

    // Met à jour la sélection dans Firestore
    const saveSelection = useCallback(
        async (medias: string[], email?: string, instagram?: string) => {
            if (!userId || !eventId) {
                return;
            }
            const ref: DocumentReference<DocumentData> = doc(
                db,
                'evenements',
                eventId,
                'selections',
                userId,
            );
            const deviceInfo = {
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                platform: typeof navigator !== 'undefined' ? navigator.platform : '',
                language: typeof navigator !== 'undefined' ? navigator.language : '',
            };
            const data: any = {
                userId,
                medias,
                updatedAt: serverTimestamp(),
                deviceInfo,
            };
            if (email) data.email = email;
            if (instagram) data.instagram = instagram;
            if (!selection?.createdAt) {
                data.createdAt = serverTimestamp();
            }
            try {
                await setDoc(ref, data, { merge: true });
                setSelection((prev) => ({ ...data, createdAt: prev?.createdAt || data.createdAt }));
            } catch (err) {
                console.error('Erreur lors de la sauvegarde de la sélection:', err);
            }
        },
        [userId, eventId, selection?.createdAt],
    );

    return {
        userId,
        selection,
        loading,
        saveSelection,
    };
}
