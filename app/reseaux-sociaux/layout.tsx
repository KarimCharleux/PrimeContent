import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestion des Réseaux Sociaux | Primecontent',
    description:
        'Développez votre présence digitale avec nos services de gestion des réseaux sociaux. Stratégies sur mesure, contenu engageant et suivi personnalisé.',
    keywords:
        'réseaux sociaux, social media, marketing digital, stratégie digitale, contenu, engagement, community management',
    openGraph: {
        title: 'Gestion des Réseaux Sociaux | Primecontent',
        description:
            'Développez votre présence digitale avec nos services de gestion des réseaux sociaux. Stratégies sur mesure, contenu engageant et suivi personnalisé.',
        type: 'website',
    },
};

export default function ReseauxSociauxLayout({ children }: { children: React.ReactNode }) {
    return children;
}
