'use client';

import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../backoffice/lib/firebase-client';

interface Brand {
    id?: string;
    name: string;
    imageSrc: string;
    href: string;
}

interface Client {
    id?: string;
    name: string;
    domain: string;
    imageSrc: string;
    imageBackground: string;
    href: string;
}

export function useHomeData() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                // Récupérer les marques
                const brandsCollection = collection(db, 'brands');
                const brandsSnapshot = await getDocs(brandsCollection);
                const brandsData = brandsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Brand[];
                setBrands(brandsData);

                // Récupérer les clients
                const clientsCollection = collection(db, 'clients');
                const clientsSnapshot = await getDocs(clientsCollection);
                const clientsData = clientsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Client[];
                setClients(clientsData);
            } catch (err) {
                console.error('Erreur lors du chargement des données:', err);
                setError('Impossible de charger les données');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { brands, clients, loading, error };
}

export default useHomeData;
