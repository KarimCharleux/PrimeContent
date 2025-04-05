'use client';

import Link from 'next/link';

export default function ClientsPage() {
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
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
                <h1 className="text-3xl font-bold mb-4">Gestion des Clients</h1>
                <div className="max-w-lg mx-auto">
                    <p className="text-gray-600 mb-8">
                        Cette section est en cours de développement. Elle vous permettra bientôt de
                        gérer vos clients et leurs informations.
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
