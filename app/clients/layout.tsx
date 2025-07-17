import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Ils nous ont fait confiance - Dalifilms',
    description:
        'Découvrez les projets réalisés pour nos clients et partenaires de confiance : célébrités et grandes marques.',
    keywords: 'clients, marques, célébrités, projets, réalisations, portfolio',
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return children;
}
