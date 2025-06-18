'use client';

import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../lib/firebase-client';

export interface Notification {
    id: string;
    type: 'contact' | 'system';
    title: string;
    message: string;
    createdAt: any;
    read: boolean;
    data?: any;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Écouter les nouveaux messages en temps réel
        const messagesCollection = collection(db, 'contacts');
        const newMessagesQuery = query(
            messagesCollection,
            where('status', '==', 'nouveau'),
            orderBy('createdAt', 'desc'),
            limit(10),
        );

        const unsubscribe = onSnapshot(
            newMessagesQuery,
            (snapshot) => {
                const contactNotifications: Notification[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        type: 'contact' as const,
                        title: 'Nouveau message de contact',
                        message: `${data.prenom} ${data.nom} vous a envoyé un message`,
                        createdAt: data.createdAt,
                        read: false,
                        data: {
                            email: data.email,
                            messagePreview:
                                data.message.substring(0, 50) +
                                (data.message.length > 50 ? '...' : ''),
                        },
                    };
                });

                setNotifications(contactNotifications);
                setNewMessagesCount(contactNotifications.length);
                setLoading(false);
            },
            (error) => {
                console.error("Erreur lors de l'écoute des notifications:", error);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, []);

    return {
        notifications,
        newMessagesCount,
        loading,
    };
}
