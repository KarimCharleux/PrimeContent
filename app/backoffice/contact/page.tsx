'use client';

import Link from 'next/link';

export default function ContactPage() {
    return (
        <div className="w-full p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-center flex-col text-center py-16">
                <svg
                    className="w-24 h-24 text-gray-300 mb-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                </svg>
                <h1 className="text-3xl font-bold mb-4">Gestion des Contacts</h1>
                <div className="max-w-lg mx-auto">
                    <p className="text-gray-600 mb-8">
                        Cette section est en cours de développement. Elle vous permettra bientôt de
                        gérer les demandes de contact et les messages reçus sur votre site.
                    </p>
                    <div className="flex justify-center">
                        <Link
                            href="/backoffice/dashboard"
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
                        >
                            Retour au dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
