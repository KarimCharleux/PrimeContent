'use client';

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../backoffice/lib/firebase-client';
import { TeamMember } from '../backoffice/models/teamTypes';

export const useTeamData = () => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setLoading(true);
                setError(null);

                const teamQuery = query(collection(db, 'team'), orderBy('order', 'asc'));

                const teamSnapshot = await getDocs(teamQuery);

                if (!teamSnapshot.empty) {
                    const teamData = teamSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as TeamMember[];

                    setTeamMembers(teamData);
                } else {
                    setTeamMembers([]);
                }
            } catch (err) {
                console.error('Erreur lors de la récupération des données équipe:', err);
                setError('Erreur lors du chargement des données équipe');
                setTeamMembers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, []);

    return { teamMembers, loading, error };
};
