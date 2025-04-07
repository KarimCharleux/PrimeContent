'use client';

import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    setDoc,
    Timestamp,
    where,
    orderBy,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { Spinner } from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase-client';
import {
    ContactFilter,
    ContactInfo,
    ContactMessage,
    ContactStats,
    MessageStatus,
} from '../models/contactTypes';

import ContactInfoForm from './components/ContactInfoForm';
import ContactList from './components/ContactList';
import MessageDetailsModal from './components/MessageDetailsModal';

export default function ContactPage() {
    const { loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'messages' | 'info'>('messages');
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [filter, setFilter] = useState<ContactFilter>({});
    const [stats, setStats] = useState<ContactStats>({
        totalMessages: 0,
        nouveauxMessages: 0,
        messagesRepondus: 0,
        messagesArchives: 0,
    });

    // Récupérer les messages depuis Firestore
    const fetchMessages = async () => {
        try {
            setLoading(true);
            const messagesCollection = collection(db, 'contacts');

            // Construire la requête avec les filtres
            let messagesQuery = query(messagesCollection, orderBy('createdAt', 'desc'));

            if (filter.status) {
                messagesQuery = query(
                    messagesCollection,
                    where('status', '==', filter.status),
                    orderBy('createdAt', 'desc'),
                );
            }

            const messagesSnapshot = await getDocs(messagesQuery);

            if (!messagesSnapshot.empty) {
                const fetchedMessages = messagesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as ContactMessage[];

                // Filtrer par terme de recherche si présent
                const filteredMessages = filter.searchTerm
                    ? fetchedMessages.filter(
                          (message) =>
                              `${message.prenom} ${message.nom}`
                                  .toLowerCase()
                                  .includes(filter.searchTerm?.toLowerCase() || '') ||
                              message.email
                                  .toLowerCase()
                                  .includes(filter.searchTerm?.toLowerCase() || '') ||
                              message.message
                                  .toLowerCase()
                                  .includes(filter.searchTerm?.toLowerCase() || ''),
                      )
                    : fetchedMessages;

                setMessages(filteredMessages);

                // Calculer les statistiques
                const statsData: ContactStats = {
                    totalMessages: fetchedMessages.length,
                    nouveauxMessages: fetchedMessages.filter((m) => m.status === 'nouveau').length,
                    messagesRepondus: fetchedMessages.filter((m) => m.status === 'répondu').length,
                    messagesArchives: fetchedMessages.filter((m) => m.status === 'archivé').length,
                };

                setStats(statsData);
            } else {
                setMessages([]);
                setStats({
                    totalMessages: 0,
                    nouveauxMessages: 0,
                    messagesRepondus: 0,
                    messagesArchives: 0,
                });
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des messages:', error);
        } finally {
            setLoading(false);
        }
    };

    // Récupérer les informations de contact
    const fetchContactInfo = async () => {
        try {
            const contactInfoDoc = await getDoc(doc(db, 'configuration', 'contact'));

            if (contactInfoDoc.exists()) {
                setContactInfo(contactInfoDoc.data() as ContactInfo);
            } else {
                // Créer un document par défaut si inexistant
                const defaultContactInfo: ContactInfo = {
                    telephone: '+33 6 49 09 57 95',
                    email: 'contact@primecontent.fr',
                    adresse: 'Paris, France',
                    reseauxSociaux: {
                        instagram: '',
                        facebook: '',
                        twitter: '',
                        linkedin: '',
                        tiktok: '',
                    },
                    heuresOuverture: '',
                    calendlyUrl: 'https://calendly.com',
                    texteBienvenue: "Boostez Votre Présence Aujourd'hui !",
                    texteFormulaire:
                        "Votre image mérite d'être vue, entendue, ressentie. Rejoignez Primecontent pour propulser votre présence visuelle et numérique au niveau supérieur.",
                };

                await setDoc(doc(db, 'configuration', 'contact'), defaultContactInfo);
                setContactInfo(defaultContactInfo);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des informations de contact:', error);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchMessages();
            fetchContactInfo();
        }
    }, [authLoading, filter]);

    const handleViewMessage = (message: ContactMessage) => {
        setSelectedMessage(message);
    };

    const handleStatusChange = async (messageId: string, newStatus: MessageStatus) => {
        try {
            await updateDoc(doc(db, 'contacts', messageId), {
                status: newStatus,
                updatedAt: Timestamp.now(),
            });

            // Mettre à jour l'interface utilisateur
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    message.id === messageId
                        ? { ...message, status: newStatus, updatedAt: Timestamp.now() }
                        : message,
                ),
            );

            // Mettre à jour le message sélectionné s'il est ouvert
            if (selectedMessage?.id === messageId) {
                setSelectedMessage((prev) =>
                    prev ? { ...prev, status: newStatus, updatedAt: Timestamp.now() } : null,
                );
            }

            // Rafraîchir les statistiques
            fetchMessages();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
        }
    };

    const handleNotesChange = async (messageId: string, notes: string) => {
        try {
            await updateDoc(doc(db, 'contacts', messageId), {
                notes,
                updatedAt: Timestamp.now(),
            });

            // Mettre à jour l'interface utilisateur
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    message.id === messageId
                        ? { ...message, notes, updatedAt: Timestamp.now() }
                        : message,
                ),
            );

            // Mettre à jour le message sélectionné s'il est ouvert
            if (selectedMessage?.id === messageId) {
                setSelectedMessage((prev) =>
                    prev ? { ...prev, notes, updatedAt: Timestamp.now() } : null,
                );
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des notes:', error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (
            confirm(
                'Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.',
            )
        ) {
            try {
                await deleteDoc(doc(db, 'contacts', messageId));

                // Mettre à jour l'interface utilisateur
                setMessages((prevMessages) =>
                    prevMessages.filter((message) => message.id !== messageId),
                );

                // Fermer le modal si le message supprimé est celui affiché
                if (selectedMessage?.id === messageId) {
                    setSelectedMessage(null);
                }

                // Rafraîchir les statistiques
                fetchMessages();
            } catch (error) {
                console.error('Erreur lors de la suppression du message:', error);
            }
        }
    };

    const handleSaveContactInfo = async (info: ContactInfo) => {
        try {
            await setDoc(doc(db, 'configuration', 'contact'), info);
            setContactInfo(info);
            alert('Les informations de contact ont été enregistrées avec succès.');
        } catch (error) {
            console.error("Erreur lors de l'enregistrement des informations de contact:", error);
            throw error;
        }
    };

    const applyFilter = (newFilter: ContactFilter) => {
        setFilter({
            ...filter,
            ...newFilter,
        });
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Gestion des Contacts</h1>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total messages</p>
                    <p className="text-2xl font-bold">{stats.totalMessages}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Nouveaux</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.nouveauxMessages}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Répondus</p>
                    <p className="text-2xl font-bold text-green-600">{stats.messagesRepondus}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Archivés</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.messagesArchives}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`px-4 py-2 font-medium ${
                        activeTab === 'messages'
                            ? 'border-b-2 border-black text-black'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('messages')}
                >
                    Messages
                </button>
                <button
                    className={`px-4 py-2 font-medium ${
                        activeTab === 'info'
                            ? 'border-b-2 border-black text-black'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('info')}
                >
                    Informations de contact
                </button>
            </div>

            {/* Filters (for messages tab) */}
            {activeTab === 'messages' && (
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Rechercher un message..."
                            value={filter.searchTerm || ''}
                            onChange={(e) => applyFilter({ searchTerm: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => applyFilter({ status: undefined })}
                            className={`px-3 py-1 rounded-md ${
                                !filter.status
                                    ? 'bg-black text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => applyFilter({ status: 'nouveau' })}
                            className={`px-3 py-1 rounded-md ${
                                filter.status === 'nouveau'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            Nouveaux
                        </button>
                        <button
                            onClick={() => applyFilter({ status: 'répondu' })}
                            className={`px-3 py-1 rounded-md ${
                                filter.status === 'répondu'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            Répondus
                        </button>
                        <button
                            onClick={() => applyFilter({ status: 'archivé' })}
                            className={`px-3 py-1 rounded-md ${
                                filter.status === 'archivé'
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            Archivés
                        </button>
                    </div>
                </div>
            )}

            {/* Main content */}
            {loading ? (
                <div className="flex justify-center my-12">
                    <Spinner />
                </div>
            ) : (
                <div>
                    {activeTab === 'messages' && (
                        <ContactList
                            messages={messages}
                            onViewMessage={handleViewMessage}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteMessage}
                        />
                    )}

                    {activeTab === 'info' && contactInfo && (
                        <ContactInfoForm initialInfo={contactInfo} onSave={handleSaveContactInfo} />
                    )}
                </div>
            )}

            {/* Modal pour afficher les détails d'un message */}
            {selectedMessage && (
                <MessageDetailsModal
                    message={selectedMessage}
                    onClose={() => setSelectedMessage(null)}
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
                />
            )}
        </div>
    );
}
