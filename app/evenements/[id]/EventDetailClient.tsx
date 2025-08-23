'use client';

import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { db } from '../../backoffice/lib/firebase-client';
import { Evenement } from '../../backoffice/models/eventTypes';
import { useSelectionPersistence } from '../../hooks/useSelectionPersistence';

import EventPage from './EventPage';

interface EventDetailClientProps {
    readonly eventId: string;
}

export default function EventDetailClient({ eventId }: EventDetailClientProps) {
    const router = useRouter();
    const [evenement, setEvenement] = useState<Evenement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [showUserInfoModal, setShowUserInfoModal] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userInstagram, setUserInstagram] = useState('');
    const [userInfoError, setUserInfoError] = useState<string | null>(null);

    // Hook pour la persistance des sélections (utilisé pour sauvegarder email/Instagram)
    const { saveSelection } = useSelectionPersistence(eventId);

    useEffect(() => {
        const fetchEvenement = async () => {
            try {
                setLoading(true);

                const eventRef = doc(db, 'evenements', eventId);
                const eventDoc = await getDoc(eventRef);

                if (eventDoc.exists()) {
                    const eventData = {
                        id: eventDoc.id,
                        ...eventDoc.data(),
                    } as Evenement;

                    setEvenement(eventData);

                    // Vérifier si l'événement est protégé par mot de passe
                    if (eventData.protectionMotDePasse?.actif) {
                        setShowPasswordModal(true);
                    } else if (
                        eventData.type === 'selection' &&
                        eventData.demanderInfosUtilisateur
                    ) {
                        // Si pas de protection par mot de passe mais demande d'infos utilisateur pour les sélections
                        setShowUserInfoModal(true);
                    }
                } else {
                    setError('Événement non trouvé');
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de l'événement:", error);
                setError("Une erreur est survenue lors du chargement de l'événement");
            } finally {
                setLoading(false);
            }
        };

        fetchEvenement();
    }, [eventId]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!evenement || !evenement.protectionMotDePasse) return;

        if (password === evenement.protectionMotDePasse.motDePasse) {
            setShowPasswordModal(false);
            setPasswordError(null);

            // Après validation du mot de passe, vérifier s'il faut demander les infos utilisateur
            if (evenement.type === 'selection' && evenement.demanderInfosUtilisateur) {
                setShowUserInfoModal(true);
            }
        } else {
            setPasswordError('Mot de passe incorrect');
        }
    };

    const handleUserInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation de l'email (obligatoire)
        if (!userEmail.trim()) {
            setUserInfoError("L'adresse email est obligatoire");
            return;
        }

        // Validation basique du format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            setUserInfoError('Veuillez saisir une adresse email valide');
            return;
        }

        try {
            // Sauvegarder les informations utilisateur
            await saveSelection([], userEmail, userInstagram);

            // Fermer la modal
            setShowUserInfoModal(false);
            setUserInfoError(null);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des informations utilisateur:', error);
            setUserInfoError('Une erreur est survenue lors de la sauvegarde de vos informations');
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="photos-loader">
                    <div className="loader-spinner"></div>
                    <div className="loading-text">Chargement de l&apos;événement...</div>
                </div>
            </div>
        );
    }

    if (error || !evenement) {
        return (
            <section className="px-4 py-12">
                <div className="container">
                    <div className="error-container">
                        <div className="error-message">{error || 'Événement non trouvé'}</div>
                        <button onClick={() => router.push('/evenements')} className="back-button">
                            Retour aux événements
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            {showPasswordModal ? (
                <div className="password-modal-container">
                    <div className="password-modal">
                        <h2 className="modal-title">Événement protégé</h2>
                        <p className="modal-description">
                            Cet événement est protégé par un mot de passe. Veuillez saisir le mot de
                            passe pour continuer.
                        </p>

                        <form onSubmit={handlePasswordSubmit} className="password-form">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mot de passe"
                                className="password-input"
                            />

                            {passwordError && <div className="password-error">{passwordError}</div>}

                            <button type="submit" className="password-submit">
                                Accéder aux photos
                            </button>
                        </form>
                    </div>
                </div>
            ) : showUserInfoModal ? (
                <div className="password-modal-container">
                    <div className="password-modal">
                        <h2 className="modal-title">Vos informations</h2>
                        <p className="modal-description">
                            Pour accéder à cet événement, veuillez saisir vos informations
                            ci-dessous.
                        </p>

                        <form onSubmit={handleUserInfoSubmit} className="password-form">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center">Adresse email *</div>
                            </label>
                            <input
                                type="email"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                placeholder="exemple@email.com"
                                className="password-input"
                                required
                            />

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center">Instagram (optionnel)</div>
                            </label>
                            <input
                                type="text"
                                value={userInstagram}
                                onChange={(e) => setUserInstagram(e.target.value)}
                                placeholder="@instagram"
                                className="password-input"
                            />

                            {userInfoError && <div className="password-error">{userInfoError}</div>}

                            <button type="submit" className="password-submit">
                                <div className="flex items-center justify-center">
                                    Accéder aux photos
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <EventPage evenement={evenement} key={`event-${evenement.id}`} />
            )}
        </>
    );
}
