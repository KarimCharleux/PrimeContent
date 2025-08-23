import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestion des Utilisateurs | Backoffice',
    description: "Interface d'administration pour la gestion des utilisateurs",
};

export default function UsersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
