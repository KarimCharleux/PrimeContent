import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestion des Vidéos | Backoffice',
    description: "Interface d'administration pour la gestion des vidéos",
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
