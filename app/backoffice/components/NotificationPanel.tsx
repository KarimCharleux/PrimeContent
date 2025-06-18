'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

import { Notification } from '../hooks/useNotifications';

interface NotificationPanelProps {
    notifications: Notification[];
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationPanel({
    notifications,
    isOpen,
    onClose,
}: NotificationPanelProps) {
    const router = useRouter();

    const handleNotificationClick = (notification: Notification) => {
        if (notification.type === 'contact') {
            onClose();
            router.push('/backoffice/contact');
        }
    };

    const formatTimeAgo = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return 'Il y a quelques instants';

        const now = new Date();
        const notificationTime = timestamp.toDate();
        const diffInMinutes = Math.floor(
            (now.getTime() - notificationTime.getTime()) / (1000 * 60),
        );

        if (diffInMinutes < 1) return 'Il y a quelques instants';
        if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Il y a ${diffInHours}h`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay pour fermer en cliquant à l'extérieur */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Volet de notifications */}
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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
                </div>

                {/* Contenu */}
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        // État vide
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <svg
                                    className="w-6 h-6 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500 text-center">
                                Aucune nouvelle notification
                            </p>
                            <p className="text-xs text-gray-400 text-center mt-1">
                                Vous êtes à jour !
                            </p>
                        </div>
                    ) : (
                        // Liste des notifications
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 group"
                                >
                                    <div className="flex items-start space-x-3">
                                        {/* Icône */}
                                        <div className="flex-shrink-0">
                                            {notification.type === 'contact' ? (
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <svg
                                                        className="w-4 h-4 text-blue-600"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Contenu */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            {notification.data?.messagePreview && (
                                                <p className="text-xs text-gray-400 mt-1 italic">
                                                    "{notification.data.messagePreview}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Indicateur non lu */}
                                        {!notification.read && (
                                            <div className="flex-shrink-0">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                        <Link
                            href="/backoffice/contact"
                            onClick={onClose}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium block text-center"
                        >
                            Voir tous les messages
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
