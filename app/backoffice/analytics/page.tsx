'use client';

import { useState } from 'react';

export default function AnalyticsPage() {
    const [formData, setFormData] = useState({
        baseUrl: 'https://dalifilms.fr',
        path: '',
        source: 'instagram',
        medium: 'story',
        campaign: '',
        term: '',
        content: '',
    });

    const [generatedUrl, setGeneratedUrl] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const generateUrl = () => {
        const params = new URLSearchParams();

        if (formData.source) params.append('utm_source', formData.source);
        if (formData.medium) params.append('utm_medium', formData.medium);
        if (formData.campaign) params.append('utm_campaign', formData.campaign);
        if (formData.term) params.append('utm_term', formData.term);
        if (formData.content) params.append('utm_content', formData.content);

        const fullUrl = `${formData.baseUrl}${formData.path}${params.toString() ? '?' + params.toString() : ''}`;
        setGeneratedUrl(fullUrl);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Générateur de liens UTM</h1>
                <p className="text-gray-600 mb-8">
                    Créez des liens trackés pour mesurer l&apos;efficacité de vos campagnes sur les
                    réseaux sociaux et analyser votre trafic.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Générateur de liens */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                Créer un lien UTM
                            </h2>

                            <div className="space-y-4">
                                {/* URL de base */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        URL de base
                                    </label>
                                    <input
                                        type="text"
                                        name="baseUrl"
                                        value={formData.baseUrl}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        placeholder="https://dalifilms.fr"
                                    />
                                </div>

                                {/* Chemin */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Page de destination (optionnel)
                                    </label>
                                    <input
                                        type="text"
                                        name="path"
                                        value={formData.path}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        placeholder="/videos ou /mariages"
                                    />
                                </div>

                                {/* Source */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Source du trafic *
                                    </label>
                                    <select
                                        name="source"
                                        value={formData.source}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                    >
                                        <option value="instagram">Instagram</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="email">Email</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                </div>

                                {/* Medium */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Type de support *
                                    </label>
                                    <select
                                        name="medium"
                                        value={formData.medium}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                    >
                                        <option value="story">Story</option>
                                        <option value="post">Post</option>
                                        <option value="reel">Reel</option>
                                        <option value="bio">Bio</option>
                                        <option value="dm">Message privé</option>
                                        <option value="email">Email</option>
                                        <option value="qr">QR Code</option>
                                    </select>
                                </div>

                                {/* Campaign */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom de campagne *
                                    </label>
                                    <input
                                        type="text"
                                        name="campaign"
                                        value={formData.campaign}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        placeholder="portfolio_janvier, mariage_promo, etc."
                                    />
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contenu (optionnel)
                                    </label>
                                    <input
                                        type="text"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        placeholder="variation_a, bouton_rouge, etc."
                                    />
                                </div>

                                <button
                                    onClick={generateUrl}
                                    className="w-full px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                                >
                                    Générer le lien UTM
                                </button>
                            </div>
                        </div>

                        {/* Résultat */}
                        {generatedUrl && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Votre lien tracké
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-md border mb-4">
                                    <code className="text-sm break-all text-gray-800">
                                        {generatedUrl}
                                    </code>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={copyToClipboard}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        {copySuccess ? 'Copié !' : 'Copier'}
                                    </button>
                                    <a
                                        href={generatedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                    >
                                        Tester le lien
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Instructions Google Analytics */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                Comment analyser vos résultats
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">
                                        Étape 1 : Accéder à Google Analytics
                                    </h3>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
                                        <li>
                                            Connectez-vous à{' '}
                                            <a
                                                href="https://analytics.google.com/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-black underline"
                                            >
                                                Google Analytics
                                            </a>
                                        </li>
                                        <li>Sélectionnez votre propriété (Dalifilms)</li>
                                        <li>
                                            Assurez-vous d&apos;être sur la période souhaitée (coin
                                            supérieur droit)
                                        </li>
                                    </ol>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">
                                        Étape 2 : Naviguer vers les campagnes UTM
                                    </h3>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
                                        <li>
                                            Dans le menu de gauche, cliquez sur{' '}
                                            <strong>&quot;Rapports&quot;</strong>
                                        </li>
                                        <li>
                                            Puis <strong>&quot;Générer des prospects&quot;</strong>
                                        </li>
                                        <li>
                                            Puis <strong>&quot;Acquisition de trafic&quot;</strong>
                                        </li>
                                        <li>
                                            Dans le tableau, changez la dimension primaire en
                                            cliquant sur le menu déroulant
                                        </li>
                                        <li>
                                            Sélectionnez{' '}
                                            <strong>&quot;Nom de la campagne&quot;</strong> ou{' '}
                                            <strong>&quot;Source de session / support&quot;</strong>
                                        </li>
                                    </ol>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">
                                        Étape 3 : Analyser vos campagnes
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="bg-gray-50 p-3 rounded border-l-4 border-black">
                                            <p className="text-sm font-medium text-gray-900">
                                                Métriques importantes à surveiller :
                                            </p>
                                            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                                                <li>
                                                    <strong>Utilisateurs :</strong> Nombre de
                                                    personnes uniques qui ont cliqué
                                                </li>
                                                <li>
                                                    <strong>Sessions :</strong> Nombre total de
                                                    visites
                                                </li>
                                                <li>
                                                    <strong>Durée moyenne :</strong> Temps passé sur
                                                    le site
                                                </li>
                                                <li>
                                                    <strong>Pages par session :</strong> Nombre de
                                                    pages visitées
                                                </li>
                                                <li>
                                                    <strong>Taux de rebond :</strong> Pourcentage
                                                    qui quitte immédiatement
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">
                                        Alternative : Rapports en temps réel
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Pour voir les clics en temps réel (dernières 30 minutes) :
                                    </p>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
                                        <li>
                                            Menu de gauche : <strong>&quot;Rapports&quot;</strong>
                                        </li>
                                        <li>
                                            Puis <strong>&quot;Temps réel&quot;</strong>
                                        </li>
                                        <li>Vous verrez les visiteurs actuels et leurs sources</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Exemples d&apos;utilisation
                            </h2>

                            <div className="space-y-4">
                                <div className="border-l-4 border-gray-300 pl-4">
                                    <h4 className="font-medium text-gray-900">
                                        Story Instagram Portfolio
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Source: instagram, Medium: story, Campagne:
                                        portfolio_janvier
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Parfait pour mesurer l&apos;engagement sur vos contenus
                                        créatifs
                                    </p>
                                </div>

                                <div className="border-l-4 border-gray-300 pl-4">
                                    <h4 className="font-medium text-gray-900">
                                        Promotion Mariages
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Source: instagram, Medium: post, Campagne:
                                        promo_mariages_hiver
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Idéal pour tracker les campagnes commerciales saisonnières
                                    </p>
                                </div>

                                <div className="border-l-4 border-gray-300 pl-4">
                                    <h4 className="font-medium text-gray-900">Bio Permanente</h4>
                                    <p className="text-sm text-gray-600">
                                        Source: instagram, Medium: bio, Campagne: bio_principal
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Utilisez pour mesurer le trafic constant depuis votre bio
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Accès rapide
                            </h2>
                            <div className="space-y-3">
                                <a
                                    href="https://analytics.google.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            Google Analytics
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Accéder à vos statistiques
                                        </div>
                                    </div>
                                    <svg
                                        className="w-5 h-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </a>

                                <a
                                    href="https://tagmanager.google.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            Google Tag Manager
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Gérer vos tags de suivi
                                        </div>
                                    </div>
                                    <svg
                                        className="w-5 h-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
