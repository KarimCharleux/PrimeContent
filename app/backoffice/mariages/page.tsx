'use client';

import Link from 'next/link';

export default function MarriagesPage() {
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                </svg>
                <h1 className="text-3xl font-bold mb-4">Section Mariages</h1>
                <div className="max-w-lg mx-auto">
                    <p className="text-gray-600 mb-8">
                        Cette section est en cours de développement. Elle contiendra bientôt des
                        fonctionnalités dédiées à la gestion de vos mariages.
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
