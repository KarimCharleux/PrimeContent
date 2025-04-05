import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestion des Clients | Primecontent',
    description: "Interface d'administration pour la gestion des clients",
};

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
