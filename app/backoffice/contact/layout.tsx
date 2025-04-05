import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestion des Contacts | Primecontent',
    description: "Interface d'administration pour la gestion des contacts et messages",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
