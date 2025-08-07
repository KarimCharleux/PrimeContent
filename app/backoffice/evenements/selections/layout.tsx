import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sélections Utilisateurs - DaliFilms Admin',
    description: 'Gestion des sélections utilisateurs pour les événements',
};

export default function SelectionsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
