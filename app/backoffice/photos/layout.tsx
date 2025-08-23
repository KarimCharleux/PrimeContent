import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestion des Photos | Backoffice',
    description: "Interface d'administration pour la gestion des photos",
};

export default function PhotosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
