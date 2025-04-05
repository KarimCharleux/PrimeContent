'use client';

import Link from 'next/link';
import { useState } from 'react';

interface PasswordProtectionProps {
    readonly correctPassword: string;
    readonly onPasswordVerified: () => void;
    readonly eventTitle: string;
}

export default function PasswordProtection({
    correctPassword,
    onPasswordVerified,
    eventTitle,
}: PasswordProtectionProps) {
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Simuler un délai pour la vérification du mot de passe
        setTimeout(() => {
            if (password === correctPassword) {
                setError(null);
                onPasswordVerified();
            } else {
                setAttempts((prev) => prev + 1);
                setError('Mot de passe incorrect. Veuillez réessayer.');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="text-center mb-6">
                <svg
                    className="mx-auto h-12 w-12 text-yellow-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                </svg>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">Contenu protégé</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Cet événement est protégé par un mot de passe.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Mot de passe
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`appearance-none block w-full px-3 py-2 border ${
                                error ? 'border-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                            placeholder="Entrez le mot de passe"
                        />
                    </div>
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading || attempts > 5}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                            isLoading || attempts > 5
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-black hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Vérification...
                            </>
                        ) : attempts > 5 ? (
                            'Trop de tentatives'
                        ) : (
                            "Accéder à l'événement"
                        )}
                    </button>
                </div>
            </form>

            {attempts > 5 && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-red-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                Trop de tentatives incorrectes. Veuillez contacter
                                l&apos;organisateur pour obtenir le mot de passe correct.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6 text-center">
                <Link
                    href="/evenements"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                    Retour à la liste des événements
                </Link>
            </div>
        </div>
    );
}
