'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

import { ContactMessage, MessageStatus } from '../../models/contactTypes';

interface MessageDetailsModalProps {
    readonly message: ContactMessage;
    readonly onClose: () => void;
    readonly onStatusChange: (messageId: string, newStatus: MessageStatus) => void;
    readonly onNotesChange: (messageId: string, notes: string) => void;
}

export default function MessageDetailsModal({
    message,
    onClose,
    onStatusChange,
    onNotesChange,
}: MessageDetailsModalProps) {
    const [notes, setNotes] = useState(message.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';

        try {
            const date = timestamp.toDate();
            return format(date, 'PPP à HH:mm', { locale: fr });
        } catch (error) {
            return 'Date invalide';
        }
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    const saveNotes = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            await onNotesChange(message.id!, notes);
            setSaveStatus({
                type: 'success',
                message: 'Notes enregistrées avec succès',
            });

            // Effacer le message après 3 secondes
            setTimeout(() => {
                setSaveStatus(null);
            }, 3000);
        } catch (error) {
            setSaveStatus({
                type: 'error',
                message: "Erreur lors de l'enregistrement des notes",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                        Message de {message.prenom} {message.nom}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">
                            Informations de contact
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="mb-3">
                                <p className="text-xs text-gray-500">Nom</p>
                                <p className="text-sm font-medium">
                                    {message.prenom} {message.nom}
                                </p>
                            </div>
                            <div className="mb-3">
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium">{message.email}</p>
                            </div>
                            {message.telephone && (
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500">Téléphone</p>
                                    <p className="text-sm font-medium">{message.telephone}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-500">Date</p>
                                <p className="text-sm font-medium">
                                    {formatDate(message.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Statut</h4>
                            <div className="flex flex-wrap gap-2">
                                {(['nouveau', 'lu', 'répondu', 'archivé'] as MessageStatus[]).map(
                                    (status) => (
                                        <button
                                            key={status}
                                            onClick={() => onStatusChange(message.id!, status)}
                                            className={`px-4 py-2 rounded-md text-sm transition-colors ${
                                                message.status === status
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Message</h4>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>

                        <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                        <div>
                            {saveStatus && (
                                <div
                                    className={`mb-3 p-2 rounded-md flex items-center ${
                                        saveStatus.type === 'success'
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mr-2">
                                        {saveStatus.type === 'success' ? (
                                            <svg
                                                className="h-4 w-4 text-green-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="h-4 w-4 text-red-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <p className="text-sm">{saveStatus.message}</p>
                                </div>
                            )}
                            <textarea
                                value={notes}
                                onChange={handleNotesChange}
                                rows={5}
                                className="w-full rounded-md border border-gray-300 shadow-sm p-3 text-sm"
                                placeholder="Ajoutez des notes ou un suivi concernant ce message..."
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={saveNotes}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                >
                                    {isSaving ? 'Enregistrement...' : 'Enregistrer les notes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
