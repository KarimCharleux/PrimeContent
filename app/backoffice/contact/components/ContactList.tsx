'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

import { ContactMessage, MessageStatus } from '../../models/contactTypes';

interface ContactListProps {
    readonly messages: ContactMessage[];
    readonly onViewMessage: (message: ContactMessage) => void;
    readonly onStatusChange: (messageId: string, newStatus: MessageStatus) => void;
    readonly onDelete: (messageId: string) => void;
}

export default function ContactList({
    messages,
    onViewMessage,
    onStatusChange,
    onDelete,
}: ContactListProps) {
    const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

    const getStatusBadge = (status: MessageStatus) => {
        let colorClass = '';

        switch (status) {
            case 'nouveau':
                colorClass = 'bg-yellow-100 text-yellow-800';
                break;
            case 'lu':
                colorClass = 'bg-blue-100 text-blue-800';
                break;
            case 'répondu':
                colorClass = 'bg-green-100 text-green-800';
                break;
            case 'archivé':
                colorClass = 'bg-gray-100 text-gray-800';
                break;
            default:
                colorClass = 'bg-gray-100 text-gray-800';
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                {status}
            </span>
        );
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';

        try {
            const date = timestamp.toDate();
            return formatDistanceToNow(date, { addSuffix: true, locale: fr });
        } catch (error) {
            return 'Date invalide';
        }
    };

    const toggleExpand = (messageId: string) => {
        if (expandedMessage === messageId) {
            setExpandedMessage(null);
        } else {
            setExpandedMessage(messageId);

            // Marquer comme lu si c'est un nouveau message
            const message = messages.find((m) => m.id === messageId);
            if (message && message.status === 'nouveau') {
                onStatusChange(messageId, 'lu');
            }
        }
    };

    if (messages.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Aucun message trouvé</p>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                </svg>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Contact
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Message
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Date
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Statut
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {messages.map((message) => (
                        <tr
                            key={message.id}
                            className={`hover:bg-gray-50 ${message.status === 'nouveau' ? 'bg-yellow-50' : ''}`}
                            onClick={() => toggleExpand(message.id!)}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {message.prenom} {message.nom}
                                        </div>
                                        <div className="text-sm text-gray-500">{message.email}</div>
                                        {message.telephone && (
                                            <div className="text-sm text-gray-500">
                                                {message.telephone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-sm text-gray-900 line-clamp-2">
                                    {message.message}
                                </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(message.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(message.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewMessage(message);
                                        }}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        Détails
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(message.id!);
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
