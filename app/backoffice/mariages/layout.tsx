import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestion des Mariages | Backoffice',
    description: "Interface d'administration pour la gestion des mariages",
};

export default function MarriagesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
