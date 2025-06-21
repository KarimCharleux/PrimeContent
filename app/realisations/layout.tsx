import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nos Réalisations | Primecontent',
    description: 'Découvrez notre portfolio photo et vidéo, nos réalisations pour nos clients',
    keywords: 'portfolio, réalisations, photos, vidéos, projets, créations',
};

export default function RealisationsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
