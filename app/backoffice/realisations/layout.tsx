import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Réalisations | Backoffice',
    description: 'Gestion des réalisations photos et vidéos',
};

export default function RealisationsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
