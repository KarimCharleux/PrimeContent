'use client';

import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '../../backoffice/lib/firebase-client';

import './mariageDetail.scss';
import MariagePage from './MariagePage';

interface Couple {
    id: string;
    coupleDisplayName: string;
    person1Name: string;
    person2Name: string;
    person1Image: string;
    person2Image: string;
    password?: string;
}

interface MariageDetailClientProps {
    readonly coupleId: string;
}

export default function MariageDetailClient({ coupleId }: MariageDetailClientProps) {
    const [couple, setCouple] = useState<Couple | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const fetchCouple = async () => {
            try {
                const docRef = doc(db, 'couples', coupleId);
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    setError('Ce mariage est introuvable.');
                    setLoading(false);
                    return;
                }
                const data = docSnap.data();
                if (!data?.coupleDisplayName) {
                    setError('Données du couple incomplètes.');
                    setLoading(false);
                    return;
                }
                const coupleData = { id: docSnap.id, ...data } as Couple;
                setCouple(coupleData);
                if (coupleData.password) {
                    setShowPasswordModal(true);
                } else {
                    setAuthenticated(true);
                }
            } catch (err) {
                console.error('Erreur chargement couple:', err);
                setError('Erreur lors du chargement des données.');
            } finally {
                setLoading(false);
            }
        };
        fetchCouple();
    }, [coupleId]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (couple && password === couple.password) {
            setShowPasswordModal(false);
            setPasswordError(null);
            setPassword('');
            setAuthenticated(true);
        } else {
            setPasswordError('Mot de passe incorrect. Veuillez réessayer.');
        }
    };

    if (loading) {
        return (
            <div className="photos-loader">
                <div className="loader-spinner" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    if (showPasswordModal && couple) {
        return (
            <div className="mariage-password-modal-container">
                <div className="mariage-password-modal">
                    <h2 className="mariage-modal-title">Mariage protégé</h2>
                    <p className="mariage-modal-description">
                        Ce mariage est protégé par un mot de passe. Veuillez saisir le mot de passe
                        pour accéder aux photos.
                    </p>
                    <form onSubmit={handlePasswordSubmit} className="mariage-password-form">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mot de passe"
                            className="mariage-password-input"
                            autoFocus
                        />
                        {passwordError && (
                            <div className="mariage-password-error">{passwordError}</div>
                        )}
                        <button type="submit" className="mariage-password-submit">
                            Accéder aux photos
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (authenticated && couple) {
        return <MariagePage couple={couple} />;
    }

    return (
        <div className="flex items-center justify-center py-20">
            <p className="text-gray-400">Impossible de charger ce mariage.</p>
        </div>
    );
}
