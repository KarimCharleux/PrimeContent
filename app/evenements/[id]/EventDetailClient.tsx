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
    const [foundSelection, setFoundSelection] = useState<any>(null);
    const [searchingSelection, setSearchingSelection] = useState(false);
    const [showFoundSelectionOption, setShowFoundSelectionOption] = useState(false);
    const [waitingToSearch, setWaitingToSearch] = useState(false);

    // Validation de l'email en temps réel
    const isEmailValid = userEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail);

    // Hook pour la persistance des sélections (utilisé pour sauvegarder email/Instagram)
    const { saveSelection, findSelectionByEmail, loadSelectionByUserId } =
        useSelectionPersistence(eventId);

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

    // Recherche automatique d'une sélection existante lors de la saisie de l'email
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const searchExistingSelection = async () => {
            if (!userEmail.trim() || userEmail.length < 5) {
                setFoundSelection(null);
                setShowFoundSelectionOption(false);
                setWaitingToSearch(false);
                return;
            }

            // Validation basique du format email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userEmail)) {
                setFoundSelection(null);
                setShowFoundSelectionOption(false);
                setWaitingToSearch(false);
                return;
            }

            setSearchingSelection(true);
            setWaitingToSearch(false); // On n'attend plus, on cherche !
            console.log('🔍 Début de la recherche pour:', userEmail);
            try {
                const existingSelection = await findSelectionByEmail(userEmail);
                if (existingSelection) {
                    console.log('✅ Sélection trouvée:', existingSelection);
                    setFoundSelection(existingSelection);
                    setShowFoundSelectionOption(true);
                    setUserInstagram(existingSelection.instagram || '');
                } else {
                    console.log('❌ Aucune sélection trouvée');
                    setFoundSelection(null);
                    setShowFoundSelectionOption(false);
                }
            } catch (error) {
                console.error('Erreur lors de la recherche de sélection:', error);
            } finally {
                setSearchingSelection(false);
                console.log('🔍 Fin de la recherche');
            }
        };

        // Si l'email est valide, on indique qu'on va bientôt chercher
        if (
            userEmail.trim() &&
            userEmail.length >= 5 &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)
        ) {
            setWaitingToSearch(true);
            console.log('⏳ En attente avant recherche pour:', userEmail);
        } else {
            setWaitingToSearch(false);
        }

        // Débounce pour éviter trop de requêtes
        timeoutId = setTimeout(searchExistingSelection, 800);

        return () => {
            clearTimeout(timeoutId);
            // Si le timeout est annulé, on n'attend plus
            if (timeoutId) {
                setWaitingToSearch(false);
            }
        };
    }, [userEmail, findSelectionByEmail]);

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

    // Fonction pour récupérer la sélection existante
    const handleLoadExistingSelection = async () => {
        if (!foundSelection) return;

        try {
            setUserInfoError(null);
            await loadSelectionByUserId(foundSelection.userId);

            // Fermer la modal après avoir chargé la sélection
            setShowUserInfoModal(false);
            setShowFoundSelectionOption(false);
        } catch (error) {
            console.error('Erreur lors du chargement de la sélection existante:', error);
            setUserInfoError('Erreur lors du chargement de votre sélection existante');
        }
    };

    // Fonction pour continuer avec une nouvelle sélection
    const handleContinueWithNewSelection = () => {
        setShowFoundSelectionOption(false);
        setFoundSelection(null);
        setWaitingToSearch(false);
        setSearchingSelection(false);
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
            // Sauvegarder les informations utilisateur (email en minuscules pour cohérence)
            await saveSelection([], userEmail.toLowerCase().trim(), userInstagram);

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

    // Fonction pour rendre le contenu approprié
    const renderContent = () => {
        if (showPasswordModal) {
            return (
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
            );
        }

        if (showUserInfoModal) {
            return (
                <div className="password-modal-container">
                    <div className="password-modal">
                        <h2 className="modal-title">Vos informations</h2>
                        <p className="modal-description">
                            Pour accéder à cet événement, veuillez saisir vos informations
                            ci-dessous.
                        </p>

                        <form onSubmit={handleUserInfoSubmit} className="password-form">
                            <label
                                htmlFor="user-email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                <div className="flex items-center">
                                    Adresse email *
                                    {waitingToSearch && (
                                        <div className="ml-2 text-xs text-orange-600">
                                            Chargement...
                                        </div>
                                    )}
                                    {searchingSelection && (
                                        <div className="ml-2 text-xs text-blue-600">
                                            Recherche en cours...
                                        </div>
                                    )}
                                </div>
                            </label>
                            <input
                                id="user-email"
                                type="email"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                placeholder="exemple@email.com"
                                className="password-input"
                                required
                            />

                            {/* Affichage de la sélection trouvée */}
                            {showFoundSelectionOption && foundSelection && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="text-sm text-blue-800 mb-2">
                                        <strong>Sélection existante trouvée !</strong>
                                    </div>
                                    <div className="text-xs text-blue-700 mb-3">
                                        Vous avez déjà {foundSelection.medias?.length || 0} média(s)
                                        sélectionné(s) pour cet événement.
                                        {foundSelection.instagram &&
                                            ` • Instagram: ${foundSelection.instagram}`}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={handleLoadExistingSelection}
                                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                        >
                                            Récupérer ma sélection
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleContinueWithNewSelection}
                                            className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                        >
                                            Nouvelle sélection
                                        </button>
                                    </div>
                                </div>
                            )}

                            <label
                                htmlFor="user-instagram"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                <div className="flex items-center">Instagram (optionnel)</div>
                            </label>
                            <input
                                id="user-instagram"
                                type="text"
                                value={userInstagram}
                                onChange={(e) => setUserInstagram(e.target.value)}
                                placeholder="@instagram"
                                className="password-input"
                            />

                            {userInfoError && <div className="password-error">{userInfoError}</div>}

                            {/* Debug: États actuels */}
                            {console.log('🔄 États bouton:', {
                                userEmail: userEmail.trim(),
                                isEmailValid,
                                waitingToSearch,
                                searchingSelection,
                                showFoundSelectionOption,
                                disabled:
                                    !isEmailValid ||
                                    waitingToSearch ||
                                    searchingSelection ||
                                    showFoundSelectionOption,
                            })}

                            <button
                                type="submit"
                                className={`password-submit ${!isEmailValid || waitingToSearch || searchingSelection || showFoundSelectionOption ? 'disabled-button' : ''}`}
                                disabled={
                                    !isEmailValid ||
                                    waitingToSearch ||
                                    searchingSelection ||
                                    showFoundSelectionOption
                                }
                                style={{
                                    backgroundColor:
                                        !isEmailValid ||
                                        waitingToSearch ||
                                        searchingSelection ||
                                        showFoundSelectionOption
                                            ? '#ccc'
                                            : '#000',
                                    color:
                                        !isEmailValid ||
                                        waitingToSearch ||
                                        searchingSelection ||
                                        showFoundSelectionOption
                                            ? '#666'
                                            : 'white',
                                    cursor:
                                        !isEmailValid ||
                                        waitingToSearch ||
                                        searchingSelection ||
                                        showFoundSelectionOption
                                            ? 'not-allowed'
                                            : 'pointer',
                                    opacity:
                                        !isEmailValid ||
                                        waitingToSearch ||
                                        searchingSelection ||
                                        showFoundSelectionOption
                                            ? 0.7
                                            : 1,
                                }}
                            >
                                <div className="flex items-center justify-center">
                                    {(() => {
                                        if (!userEmail.trim()) {
                                            return 'Saisissez votre email';
                                        }
                                        if (!isEmailValid) {
                                            return 'Email invalide';
                                        }
                                        if (waitingToSearch) {
                                            return 'Préparation recherche...';
                                        }
                                        if (searchingSelection) {
                                            return 'Recherche en cours...';
                                        }
                                        if (showFoundSelectionOption) {
                                            return 'Choisissez une option ci-dessus';
                                        }
                                        return 'Accéder aux photos';
                                    })()}
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            );
        }

        return <EventPage evenement={evenement} key={`event-${evenement.id}`} />;
    };

    return <>{renderContent()}</>;
}
